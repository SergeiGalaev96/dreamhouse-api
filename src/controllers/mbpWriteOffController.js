const { Op } = require('sequelize');
const {
  sequelize,
  MbpWriteOff,
  MbpWriteOffItem,
  Warehouse,
  WarehouseStock,
  Material
} = require('../models');
const MaterialMovement = require('../models/MaterialMovement');
const UserRole = require('../models/UserRole');
const updateWithAudit = require('../utils/updateWithAudit');
const { localTimestampLiteral } = require('../utils/dateTime');

const WAREHOUSE_OPERATION_ROLE_IDS = [1, 5, 10, 11, 15];

const WRITE_OFF_STATUS = {
  CREATED: 1,
  SIGNING: 2,
  POSTED: 3,
  CANCELED: 4
};

const SIGN_STAGE_MAP = {
  foreman: {
    signField: 'signed_by_foreman',
    timeField: 'signed_by_foreman_time',
    userField: 'foreman_user_id'
  },
  planning_engineer: {
    signField: 'signed_by_planning_engineer',
    timeField: 'signed_by_planning_engineer_time',
    userField: 'planning_engineer_user_id'
  },
  main_engineer: {
    signField: 'signed_by_main_engineer',
    timeField: 'signed_by_main_engineer_time',
    userField: 'main_engineer_user_id'
  },
  general_director: {
    signField: 'signed_by_general_director',
    timeField: 'signed_by_general_director_time',
    userField: 'general_director_user_id'
  }
};

const SIGN_STAGE_ROLE_MATCHERS = {
  foreman: ['прораб'],
  planning_engineer: ['пто', 'инженер пто', 'план'],
  main_engineer: ['глав', 'гл. инж', 'главный инженер'],
  general_director: ['ген', 'генеральный директор']
};

const ACTIVE_WHERE = {
  [Op.or]: [
    { deleted: false },
    { deleted: null }
  ]
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveNumber = (value) => {
  const parsed = toNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
};

const buildPagination = (page, size, total) => ({
  page: Number(page),
  size: Number(size),
  total,
  pages: Math.ceil(total / size),
  hasNext: page * size < total,
  hasPrev: page > 1
});

const normalizeMbpWriteOffItem = (item) => {
  if (!item) return item;

  return {
    ...item,
    quantity: toNumber(item.quantity)
  };
};

const serializeMbpWriteOff = (writeOff) => {
  if (!writeOff) return writeOff;

  const plain = typeof writeOff.toJSON === 'function' ? writeOff.toJSON() : writeOff;

  return {
    ...plain,
    items: Array.isArray(plain.items)
      ? plain.items.map((item) => normalizeMbpWriteOffItem(item))
      : plain.items
  };
};

const safeRollback = async (transaction) => {
  if (!transaction || transaction.finished) {
    return;
  }
  await transaction.rollback();
};

const mergeItemsByMaterial = (items) => {
  const aggregated = new Map();

  for (const item of items) {
    const materialId = toNumber(item.material_id);
    const quantity = toPositiveNumber(item.quantity);
    const unitOfMeasure = toNumber(item.unit_of_measure);

    if (!materialId || !quantity || !unitOfMeasure) return null;

    const current = aggregated.get(materialId) || {
      material_id: materialId,
      unit_of_measure: unitOfMeasure,
      quantity: 0,
      note: null
    };

    current.quantity += quantity;
    current.note = item.note ?? current.note ?? null;
    aggregated.set(materialId, current);
  }

  return Array.from(aggregated.values());
};

const canUserSign = async (stage, user) => {
  if (Number(user?.role_id) === 1) return true;
  if (!stage || !user?.role_id) return false;

  const role = await UserRole.findByPk(user.role_id);
  if (!role) return false;

  const roleName = `${role.name || ''} ${role.description || ''}`.toLowerCase();
  const matchers = SIGN_STAGE_ROLE_MATCHERS[stage] || [];
  return matchers.some((matcher) => roleName.includes(matcher));
};

const allSigned = (writeOff) =>
  writeOff.signed_by_foreman === true &&
  writeOff.signed_by_planning_engineer === true &&
  writeOff.signed_by_main_engineer === true &&
  writeOff.signed_by_general_director === true;

const validateWarehouseStockAvailability = async ({ warehouseId, items, transaction }) => {
  const materialIds = items.map((item) => item.material_id);
  const stocks = await WarehouseStock.findAll({
    where: {
      warehouse_id: warehouseId,
      material_id: materialIds,
      ...ACTIVE_WHERE
    },
    transaction
  });

  const stockMap = new Map(stocks.map((stock) => [Number(stock.material_id), stock]));

  for (const item of items) {
    const stock = stockMap.get(Number(item.material_id));
    const requestedQuantity = Number(item.quantity);
    const availableQuantity = stock ? Number(stock.quantity) : 0;

    if (!stock || availableQuantity < requestedQuantity) {
      return {
        ok: false,
        message: `Недостаточно остатка по материалу id=${item.material_id}. Доступно: ${availableQuantity}, запрошено: ${requestedQuantity}`
      };
    }
  }

  return { ok: true };
};

const getMbpWriteOffByIdInternal = async (id) =>
  MbpWriteOff.findByPk(id, {
    include: [
      {
        model: MbpWriteOffItem,
        as: 'items',
        where: ACTIVE_WHERE,
        required: false,
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name']
          }
        ],
        separate: true,
        order: [['created_at', 'ASC']]
      },
      {
        model: Warehouse,
        as: 'warehouse',
        attributes: ['id', 'name', 'project_id']
      }
    ]
  });

const finalizeMbpWriteOff = async ({ writeOff, userId, comment = null, transaction }) => {
  const items = await MbpWriteOffItem.findAll({
    where: {
      mbp_write_off_id: Number(writeOff.id),
      ...ACTIVE_WHERE
    },
    transaction
  });

  if (items.length === 0) {
    return { ok: false, status: 400, message: 'В акте МБП нет позиций' };
  }

  const materialIds = items.map((item) => item.material_id);
  const stocks = await WarehouseStock.findAll({
    where: {
      warehouse_id: writeOff.warehouse_id,
      material_id: materialIds,
      ...ACTIVE_WHERE
    },
    transaction
  });

  const stockMap = new Map(stocks.map((stock) => [Number(stock.material_id), stock]));

  for (const item of items) {
    const stock = stockMap.get(Number(item.material_id));
    const quantity = Number(item.quantity);

    if (!stock) {
      return { ok: false, status: 400, message: `На складе отсутствует материал id=${item.material_id}` };
    }

    if (Number(stock.quantity) < quantity) {
      return { ok: false, status: 400, message: `Недостаточно остатка по материалу id=${item.material_id}` };
    }
  }

  const postedAt = localTimestampLiteral();

  for (const item of items) {
    const stock = stockMap.get(Number(item.material_id));
    const quantity = Number(item.quantity);

    await stock.update({ quantity: Number(stock.quantity) - quantity }, { transaction });

    const movement = await MaterialMovement.create({
      project_id: writeOff.project_id,
      date: postedAt,
      from_warehouse_id: writeOff.warehouse_id,
      to_warehouse_id: null,
      user_id: userId,
      note: item.note || `Списание МБП №${writeOff.id}`,
      material_id: item.material_id,
      quantity,
      operation: '-',
      status: 1,
      entity_type: 'mbp_write_off',
      entity_id: writeOff.id
    }, { transaction });

    await item.update({ movement_id: movement.id }, { transaction });
  }

  await updateWithAudit({
    model: MbpWriteOff,
    id: writeOff.id,
    data: {
      status: WRITE_OFF_STATUS.POSTED,
      posted_at: postedAt
    },
    entityType: 'mbp_write_off',
    action: 'mbp_write_off_updated',
    userId,
    comment,
    transaction
  });

  return { ok: true };
};

const searchMbpWriteOffs = async (req, res) => {
  try {
    const {
      project_id,
      warehouse_id,
      status,
      date_from,
      date_to,
      page = 1,
      size = 10
    } = req.body || {};

    const whereClause = { ...ACTIVE_WHERE };
    const offset = (Number(page) - 1) * Number(size);

    if (project_id) whereClause.project_id = Number(project_id);
    if (warehouse_id) whereClause.warehouse_id = Number(warehouse_id);
    if (status) whereClause.status = Number(status);
    if (date_from || date_to) {
      whereClause.posted_at = {};
      if (date_from) whereClause.posted_at[Op.gte] = `${date_from} 00:00:00`;
      if (date_to) whereClause.posted_at[Op.lte] = `${date_to} 23:59:59.999`;
    }

    const { count, rows } = await MbpWriteOff.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MbpWriteOffItem,
          as: 'items',
          where: ACTIVE_WHERE,
          required: false,
          include: [
            {
              model: Material,
              as: 'material',
              attributes: ['id', 'name']
            }
          ],
          separate: true,
          order: [['created_at', 'ASC']]
        },
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name']
        }
      ],
      limit: Number(size),
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: rows.map((row) => serializeMbpWriteOff(row)),
      pagination: buildPagination(Number(page), Number(size), count)
    });
  } catch (error) {
    console.error('searchMbpWriteOffs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске списаний МБП',
      error: error.message
    });
  }
};

const getMbpWriteOffById = async (req, res) => {
  try {
    const { id } = req.params;
    const writeOff = await getMbpWriteOffByIdInternal(id);

    if (!writeOff || writeOff.deleted === true) {
      return res.status(404).json({
        success: false,
        message: 'Списание МБП не найдено'
      });
    }

    return res.json({
      success: true,
      data: serializeMbpWriteOff(writeOff)
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении списания МБП',
      error: error.message
    });
  }
};

const createMbpWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const currentUserRoleId = Number(req.user?.role_id);

    if (!WAREHOUSE_OPERATION_ROLE_IDS.includes(currentUserRoleId)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message:
          '\u041f\u0440\u0438\u0435\u043c\u043a\u0430, \u0441\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u0438 \u043f\u0435\u0440\u0435\u043c\u0435\u0449\u0435\u043d\u0438\u044f \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0430\u0434\u043c\u0438\u043d\u0443, \u0437\u0430\u0432. \u0441\u043a\u043b\u0430\u0434\u043e\u043c, \u043c\u0430\u0441\u0442\u0435\u0440\u0443, \u041f\u0422\u041e \u0438 \u0433\u043b. \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u0443'
      });
    }

    const { warehouse_id, note, items = [] } = req.body || {};
    const warehouseId = toNumber(warehouse_id);
    const normalizedItems = mergeItemsByMaterial(items);

    if (!warehouseId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'warehouse_id обязателен'
      });
    }

    if (!normalizedItems || normalizedItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Нужна хотя бы одна позиция списания'
      });
    }

    const warehouse = await Warehouse.findOne({
      where: { id: warehouseId, ...ACTIVE_WHERE },
      transaction
    });

    if (!warehouse) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Склад не найден'
      });
    }

    const materialIds = normalizedItems.map((item) => item.material_id);
    const materials = await Material.findAll({
      where: { id: materialIds, ...ACTIVE_WHERE },
      transaction
    });

    if (materials.length !== materialIds.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Часть материалов не найдена'
      });
    }

    const stockAvailability = await validateWarehouseStockAvailability({
      warehouseId,
      items: normalizedItems,
      transaction
    });

    if (!stockAvailability.ok) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: stockAvailability.message
      });
    }

    const writeOff = await MbpWriteOff.create({
      project_id: warehouse.project_id,
      warehouse_id: warehouseId,
      status: WRITE_OFF_STATUS.CREATED,
      note: note ?? null,
      created_user_id: req.user.id,
      signed_by_foreman: false,
      signed_by_foreman_time: null,
      signed_by_planning_engineer: false,
      signed_by_planning_engineer_time: null,
      signed_by_main_engineer: false,
      signed_by_main_engineer_time: null,
      signed_by_general_director: false,
      signed_by_general_director_time: null
    }, { transaction });

    await MbpWriteOffItem.bulkCreate(
      normalizedItems.map((item) => ({
        mbp_write_off_id: writeOff.id,
        material_id: item.material_id,
        unit_of_measure: item.unit_of_measure,
        quantity: item.quantity,
        note: item.note ?? null
      })),
      { transaction }
    );

    await transaction.commit();
    const created = await getMbpWriteOffByIdInternal(writeOff.id);

    return res.status(201).json({
      success: true,
      message: 'Списание МБП успешно создано',
      data: serializeMbpWriteOff(created)
    });
  } catch (error) {
    await transaction.rollback();
    console.error('createMbpWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании списания МБП',
      error: error.message
    });
  }
};

const updateMbpWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { note, items, comment } = req.body || {};

    const writeOff = await MbpWriteOff.findByPk(id, { transaction });

    if (!writeOff || writeOff.deleted === true) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Списание МБП не найдено'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Проведенное списание МБП нельзя редактировать'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.CANCELED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Отмененное списание МБП нельзя редактировать'
      });
    }

    const data = {};

    if (note !== undefined) {
      data.note = note ?? null;
    }

    await updateWithAudit({
      model: MbpWriteOff,
      id,
      data,
      entityType: 'mbp_write_off',
      action: 'mbp_write_off_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (Array.isArray(items)) {
      const normalizedItems = mergeItemsByMaterial(items);

      if (!normalizedItems || normalizedItems.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Нужна хотя бы одна позиция списания'
        });
      }

      const materialIds = normalizedItems.map((item) => item.material_id);
      const materials = await Material.findAll({
        where: { id: materialIds, ...ACTIVE_WHERE },
        transaction
      });

      if (materials.length !== materialIds.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Часть материалов не найдена'
        });
      }

      const stockAvailability = await validateWarehouseStockAvailability({
        warehouseId: Number(writeOff.warehouse_id),
        items: normalizedItems,
        transaction
      });

      if (!stockAvailability.ok) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: stockAvailability.message
        });
      }

      await MbpWriteOffItem.update(
        { deleted: true },
        { where: { mbp_write_off_id: Number(id), ...ACTIVE_WHERE }, transaction }
      );

      await MbpWriteOffItem.bulkCreate(
        normalizedItems.map((item) => ({
          mbp_write_off_id: Number(id),
          material_id: item.material_id,
          unit_of_measure: item.unit_of_measure,
          quantity: item.quantity,
          note: item.note ?? null
        })),
        { transaction }
      );
    }

    await transaction.commit();
    const updated = await getMbpWriteOffByIdInternal(id);

    return res.json({
      success: true,
      message: 'Списание МБП успешно обновлено',
      data: serializeMbpWriteOff(updated)
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('updateMbpWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении списания МБП',
      error: error.message
    });
  }
};

const signMbpWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { stage, comment } = req.body || {};

    const config = SIGN_STAGE_MAP[stage];
    if (!config) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Некорректный этап подписания'
      });
    }

    const writeOff = await MbpWriteOff.findByPk(id, { transaction });

    if (!writeOff || writeOff.deleted === true) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Списание МБП не найдено'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Списание МБП уже проведено'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.CANCELED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Отмененное списание МБП подписывать нельзя'
      });
    }

    if (!(await canUserSign(stage, req.user))) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для подписи этого этапа'
      });
    }

    if (writeOff[config.signField] === true) {
      await transaction.rollback();
      return res.json({
        success: true,
        message: 'Этап уже подписан',
        data: serializeMbpWriteOff(writeOff)
      });
    }

    const result = await updateWithAudit({
      model: MbpWriteOff,
      id,
      data: {
        [config.signField]: true,
        [config.timeField]: writeOff[config.timeField] || localTimestampLiteral(),
        [config.userField]: writeOff[config.userField] || req.user.id,
        status: WRITE_OFF_STATUS.SIGNING
      },
      entityType: 'mbp_write_off',
      action: 'mbp_write_off_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    let responseMessage = 'Списание МБП успешно подписано';

    if (allSigned(result.instance)) {
      const finalizeResult = await finalizeMbpWriteOff({
        writeOff: result.instance,
        userId: req.user.id,
        comment,
        transaction
      });

      if (!finalizeResult.ok) {
        await transaction.rollback();
        return res.status(finalizeResult.status).json({
          success: false,
          message: finalizeResult.message
        });
      }

      responseMessage = 'Списание МБП подписано и автоматически проведено';
    }

    await transaction.commit();
    const finalData = await getMbpWriteOffByIdInternal(id);

    return res.json({
      success: true,
      message: responseMessage,
      data: serializeMbpWriteOff(finalData)
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('signMbpWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при подписании списания МБП',
      error: error.message
    });
  }
};

const deleteMbpWriteOff = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};

    const writeOff = await MbpWriteOff.findByPk(id);

    if (!writeOff || writeOff.deleted === true) {
      return res.status(404).json({
        success: false,
        message: 'Списание МБП не найдено'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      return res.status(400).json({
        success: false,
        message: 'Проведенное списание МБП нельзя удалить'
      });
    }

    const result = await updateWithAudit({
      model: MbpWriteOff,
      id,
      data: {
        deleted: true,
        status: WRITE_OFF_STATUS.CANCELED
      },
      entityType: 'mbp_write_off',
      action: 'mbp_write_off_deleted',
      userId: req.user.id,
      comment
    });

    await MbpWriteOffItem.update(
      { deleted: true },
      { where: { mbp_write_off_id: Number(id), ...ACTIVE_WHERE } }
    );

    return res.json({
      success: true,
      message: result.changed
        ? 'Списание МБП успешно удалено'
        : 'Изменений не обнаружено'
    });
  } catch (error) {
    console.error('deleteMbpWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении списания МБП',
      error: error.message
    });
  }
};

module.exports = {
  searchMbpWriteOffs,
  getMbpWriteOffById,
  createMbpWriteOff,
  updateMbpWriteOff,
  signMbpWriteOff,
  deleteMbpWriteOff
};
