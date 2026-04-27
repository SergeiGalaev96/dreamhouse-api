const { Op } = require('sequelize');
const {
  sequelize,
  MaterialWriteOff,
  MaterialWriteOffItem,
  WorkPerformed,
  WorkPerformedItem,
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

const safeRollback = async (transaction) => {
  if (!transaction || transaction.finished) {
    return;
  }
  await transaction.rollback();
};

const buildPagination = (page, size, total) => ({
  page: Number(page),
  size: Number(size),
  total,
  pages: Math.ceil(total / size),
  hasNext: page * size < total,
  hasPrev: page > 1
});

const mergeItemsByMaterial = (items) => {
  const aggregated = new Map();

  for (const item of items) {
    const materialId = toNumber(item.material_id);
    const quantity = toPositiveNumber(item.quantity);
    const unitOfMeasure = toNumber(item.unit_of_measure);

    if (!materialId || !quantity || !unitOfMeasure) {
      return null;
    }

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

const getWorkPerformedContext = async (workPerformedItemId, transaction = null) => {
  const [rows] = await sequelize.query(
    `
      select
        wpi.id,
        wpi.work_performed_id,
        wpi.material_estimate_item_id,
        wpi.service_id,
        wpi.service_type,
        wpi.stage_id,
        wpi.subsection_id,
        wpi.unit_of_measure,
        wpi.quantity,
        wp.project_id,
        wp.block_id,
        wp.code
      from construction.work_performed_items wpi
      join construction.work_performed wp on wp.id = wpi.work_performed_id
      where wpi.id = :workPerformedItemId
        and (wpi.deleted = false or wpi.deleted is null)
        and (wp.deleted = false or wp.deleted is null)
      limit 1
    `,
    {
      replacements: { workPerformedItemId },
      transaction
    }
  );

  return rows[0] || null;
};

const getWriteOffByIdInternal = async (id) =>
  MaterialWriteOff.findByPk(id, {
    include: [
      {
        model: MaterialWriteOffItem,
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
      },
      {
        model: WorkPerformed,
        as: 'work_performed',
        attributes: ['id', 'code', 'project_id', 'block_id', 'performed_person_name', 'created_at']
      },
      {
        model: WorkPerformedItem,
        as: 'work_performed_item',
        attributes: ['id', 'service_id', 'service_type', 'stage_id', 'subsection_id', 'quantity', 'unit_of_measure']
      }
    ]
  });

const canUserSign = async (stage, user) => {
  if (Number(user?.role_id) === 1) {
    return true;
  }

  if (!stage || !user?.role_id) {
    return false;
  }

  const role = await UserRole.findByPk(user.role_id);
  if (!role) {
    return false;
  }

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

const finalizeMaterialWriteOff = async ({ writeOff, userId, comment = null, transaction }) => {
  const items = await MaterialWriteOffItem.findAll({
    where: {
      material_write_off_id: Number(writeOff.id),
      ...ACTIVE_WHERE
    },
    transaction
  });

  if (items.length === 0) {
    return { ok: false, status: 400, message: 'В акте списания нет позиций' };
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
      note: item.note || `Списание по акту №${writeOff.id}`,
      material_id: item.material_id,
      quantity,
      operation: '-',
      status: 1,
      entity_type: 'material_write_off',
      entity_id: writeOff.id
    }, { transaction });

    await item.update({ movement_id: movement.id }, { transaction });
  }

  await updateWithAudit({
    model: MaterialWriteOff,
    id: writeOff.id,
    data: {
      status: WRITE_OFF_STATUS.POSTED,
      posted_at: postedAt
    },
    entityType: 'material_write_off',
    action: 'material_write_off_updated',
    userId,
    comment,
    transaction
  });

  return { ok: true };
};

const getAllMaterialWriteOffs = async (req, res) => {
  try {
    const { count, rows } = await MaterialWriteOff.findAndCountAll({
      where: ACTIVE_WHERE,
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: rows,
      pagination: { total: count }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении актов списания материалов',
      error: error.message
    });
  }
};

const searchMaterialWriteOffs = async (req, res) => {
  try {
    const {
      project_id,
      block_id,
      warehouse_id,
      work_performed_id,
      work_performed_item_id,
      status,
      date_from,
      date_to,
      page = 1,
      size = 10
    } = req.body || {};

    const whereClause = { ...ACTIVE_WHERE };
    const offset = (Number(page) - 1) * Number(size);

    if (project_id) whereClause.project_id = Number(project_id);
    if (block_id) whereClause.block_id = Number(block_id);
    if (warehouse_id) whereClause.warehouse_id = Number(warehouse_id);
    if (work_performed_id) whereClause.work_performed_id = Number(work_performed_id);
    if (work_performed_item_id) whereClause.work_performed_item_id = Number(work_performed_item_id);
    if (status) whereClause.status = Number(status);
    if (date_from || date_to) {
      whereClause.posted_at = {};
      if (date_from) whereClause.posted_at[Op.gte] = `${date_from} 00:00:00`;
      if (date_to) whereClause.posted_at[Op.lte] = `${date_to} 23:59:59.999`;
    }

    const { count, rows } = await MaterialWriteOff.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MaterialWriteOffItem,
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
        },
        {
          model: WorkPerformed,
          as: 'work_performed',
          attributes: ['id', 'code', 'performed_person_name']
        },
        {
          model: WorkPerformedItem,
          as: 'work_performed_item',
          attributes: ['id', 'service_id', 'stage_id', 'subsection_id', 'quantity']
        }
      ],
      limit: Number(size),
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: rows,
      pagination: buildPagination(Number(page), Number(size), count)
    });
  } catch (error) {
    console.error('searchMaterialWriteOffs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске актов списания материалов',
      error: error.message
    });
  }
};

const getMaterialWriteOffById = async (req, res) => {
  try {
    const { id } = req.params;
    const writeOff = await getWriteOffByIdInternal(id);

    if (!writeOff || writeOff.deleted === true) {
      return res.status(404).json({
        success: false,
        message: 'Акт списания материалов не найден'
      });
    }

    return res.json({
      success: true,
      data: writeOff
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении акта списания материалов',
      error: error.message
    });
  }
};

const createMaterialWriteOff = async (req, res) => {
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

    const {
      warehouse_id,
      work_performed_item_id,
      note,
      items = []
    } = req.body || {};

    const warehouseId = toNumber(warehouse_id);
    const workPerformedItemId = toNumber(work_performed_item_id);
    const normalizedItems = mergeItemsByMaterial(items);

    if (!warehouseId || !workPerformedItemId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'warehouse_id и work_performed_item_id обязательны'
      });
    }

    if (!normalizedItems || normalizedItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Нужна хотя бы одна позиция списания'
      });
    }

    const context = await getWorkPerformedContext(workPerformedItemId, transaction);
    if (!context) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Работа АВР не найдена'
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

    if (Number(warehouse.project_id) !== Number(context.project_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Склад не принадлежит проекту выбранной работы АВР'
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

    const writeOff = await MaterialWriteOff.create({
      project_id: context.project_id,
      block_id: context.block_id,
      warehouse_id: warehouseId,
      work_performed_id: context.work_performed_id,
      work_performed_item_id: context.id,
      status: WRITE_OFF_STATUS.CREATED,
      note: note ?? null,
      created_user_id: req.user.id,
      foreman_user_id: null,
      signed_by_foreman: false,
      planning_engineer_user_id: null,
      signed_by_planning_engineer: false,
      main_engineer_user_id: null,
      signed_by_main_engineer: false,
      general_director_user_id: null,
      signed_by_general_director: false
    }, { transaction });

    await MaterialWriteOffItem.bulkCreate(
      normalizedItems.map((item) => ({
        material_write_off_id: writeOff.id,
        material_id: item.material_id,
        unit_of_measure: item.unit_of_measure,
        quantity: item.quantity,
        note: item.note ?? null
      })),
      { transaction }
    );

    await transaction.commit();
    const created = await getWriteOffByIdInternal(writeOff.id);

    return res.status(201).json({
      success: true,
      message: 'Акт списания материалов успешно создан',
      data: created
    });
  } catch (error) {
    await transaction.rollback();
    console.error('createMaterialWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании акта списания материалов',
      error: error.message
    });
  }
};

const updateMaterialWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { note, items, comment } = req.body || {};

    const writeOff = await MaterialWriteOff.findByPk(id, { transaction });

    if (!writeOff || writeOff.deleted === true) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Акт списания материалов не найден'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Проведенный акт списания нельзя изменять'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.CANCELED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Отмененный акт списания нельзя изменять'
      });
    }

    const data = {};

    if (note !== undefined) {
      data.note = note ?? null;
    }

    const result = await updateWithAudit({
      model: MaterialWriteOff,
      id,
      data,
      entityType: 'material_write_off',
      action: 'material_write_off_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (items !== undefined) {
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

      await MaterialWriteOffItem.update(
        { deleted: true },
        { where: { material_write_off_id: Number(id), ...ACTIVE_WHERE }, transaction }
      );

      await MaterialWriteOffItem.bulkCreate(
        normalizedItems.map((item) => ({
          material_write_off_id: Number(id),
          material_id: item.material_id,
          unit_of_measure: item.unit_of_measure,
          quantity: item.quantity,
          note: item.note ?? null
        })),
        { transaction }
      );
    }

    await transaction.commit();
    const updated = await getWriteOffByIdInternal(id);

    return res.json({
      success: true,
      message: result.changed || items !== undefined
        ? 'Акт списания материалов успешно обновлен'
        : 'Изменений не обнаружено',
      data: updated
    });
  } catch (error) {
    await transaction.rollback();
    console.error('updateMaterialWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении акта списания материалов',
      error: error.message
    });
  }
};

const signMaterialWriteOff = async (req, res) => {
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

    const writeOff = await MaterialWriteOff.findByPk(id, { transaction });

    if (!writeOff || writeOff.deleted === true) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Акт списания материалов не найден'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Акт списания уже проведен'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.CANCELED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Отмененный акт подписывать нельзя'
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
        data: writeOff
      });
    }

    const result = await updateWithAudit({
      model: MaterialWriteOff,
      id,
      data: {
        [config.signField]: true,
        [config.timeField]: writeOff[config.timeField] || localTimestampLiteral(),
        [config.userField]: writeOff[config.userField] || req.user.id,
        status: WRITE_OFF_STATUS.SIGNING
      },
      entityType: 'material_write_off',
      action: 'material_write_off_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    let responseMessage = 'Акт списания материалов успешно подписан';

    if (allSigned(result.instance)) {
      const finalizeResult = await finalizeMaterialWriteOff({
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

      responseMessage = 'Акт списания материалов подписан и автоматически проведен';
    }

    await transaction.commit();
    const finalData = await getWriteOffByIdInternal(id);

    return res.json({
      success: true,
      message: responseMessage,
      data: finalData
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('signMaterialWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при подписании акта списания материалов',
      error: error.message
    });
  }
};

const postMaterialWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { comment } = req.body || {};

    const writeOff = await MaterialWriteOff.findByPk(id, { transaction });

    if (!writeOff || writeOff.deleted === true) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Акт списания материалов не найден'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Акт списания уже проведен'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.CANCELED) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Отмененный акт провести нельзя'
      });
    }

    if (!allSigned(writeOff)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Для проведения акта нужны все подписи'
      });
    }

    const finalizeResult = await finalizeMaterialWriteOff({
      writeOff,
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

    await transaction.commit();
    const posted = await getWriteOffByIdInternal(id);

    return res.json({
      success: true,
      message: 'Акт списания материалов успешно проведен',
      data: posted
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('postMaterialWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при проведении акта списания материалов',
      error: error.message
    });
  }
};

const deleteMaterialWriteOff = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};

    const writeOff = await MaterialWriteOff.findByPk(id);

    if (!writeOff || writeOff.deleted === true) {
      return res.status(404).json({
        success: false,
        message: 'Акт списания материалов не найден'
      });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      return res.status(400).json({
        success: false,
        message: 'Проведенный акт списания нельзя удалить'
      });
    }

    const result = await updateWithAudit({
      model: MaterialWriteOff,
      id,
      data: {
        deleted: true,
        status: WRITE_OFF_STATUS.CANCELED
      },
      entityType: 'material_write_off',
      action: 'material_write_off_deleted',
      userId: req.user.id,
      comment
    });

    await MaterialWriteOffItem.update(
      { deleted: true },
      {
        where: { material_write_off_id: Number(id), ...ACTIVE_WHERE }
      }
    );

    return res.json({
      success: true,
      message: result.changed
        ? 'Акт списания материалов успешно удален'
        : 'Изменений не обнаружено'
    });
  } catch (error) {
    console.error('deleteMaterialWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении акта списания материалов',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialWriteOffs,
  searchMaterialWriteOffs,
  getMaterialWriteOffById,
  createMaterialWriteOff,
  updateMaterialWriteOff,
  signMaterialWriteOff,
  postMaterialWriteOff,
  deleteMaterialWriteOff
};
