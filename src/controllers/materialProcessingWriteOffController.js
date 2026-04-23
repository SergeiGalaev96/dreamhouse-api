const { Op } = require('sequelize');
const {
  sequelize,
  MaterialProcessingWriteOff,
  MaterialProcessingWriteOffItem,
  Warehouse,
  WarehouseStock,
  Material
} = require('../models');
const MaterialMovement = require('../models/MaterialMovement');
const UserRole = require('../models/UserRole');
const updateWithAudit = require('../utils/updateWithAudit');
const { localTimestampLiteral } = require('../utils/dateTime');

const WRITE_OFF_STATUS = {
  CREATED: 1,
  SIGNING: 2,
  POSTED: 3,
  CANCELED: 4
};

const ENTITY_TYPE = 'processing_write_off';

const SIGN_STAGE_MAP = {
  foreman: {
    signField: 'signed_by_foreman',
    userField: 'foreman_user_id',
    timeField: 'signed_by_foreman_time'
  },
  planning_engineer: {
    signField: 'signed_by_planning_engineer',
    userField: 'planning_engineer_user_id',
    timeField: 'signed_by_planning_engineer_time'
  },
  main_engineer: {
    signField: 'signed_by_main_engineer',
    userField: 'main_engineer_user_id',
    timeField: 'signed_by_main_engineer_time'
  },
  general_director: {
    signField: 'signed_by_general_director',
    userField: 'general_director_user_id',
    timeField: 'signed_by_general_director_time'
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

const safeRollback = async (transaction) => {
  if (!transaction || transaction.finished) return;
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

const getProcessingWriteOffByIdInternal = async (id) =>
  MaterialProcessingWriteOff.findByPk(id, {
    include: [
      {
        model: MaterialProcessingWriteOffItem,
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

const finalizeProcessingWriteOff = async ({ writeOff, userId, comment = null, transaction }) => {
  const items = await MaterialProcessingWriteOffItem.findAll({
    where: {
      processing_write_off_id: Number(writeOff.id),
      ...ACTIVE_WHERE
    },
    transaction
  });

  if (items.length === 0) {
    return { ok: false, status: 400, message: 'В акте переработки нет позиций' };
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

    await MaterialMovement.create({
      project_id: writeOff.project_id,
      date: postedAt,
      from_warehouse_id: writeOff.warehouse_id,
      to_warehouse_id: null,
      user_id: userId,
      note: item.note || `Акт переработки №${writeOff.id}`,
      material_id: item.material_id,
      quantity,
      operation: '-',
      status: 1,
      entity_type: ENTITY_TYPE,
      entity_id: writeOff.id
    }, { transaction });
  }

  await updateWithAudit({
    model: MaterialProcessingWriteOff,
    id: writeOff.id,
    data: {
      status: WRITE_OFF_STATUS.POSTED,
      posted_at: postedAt
    },
    entityType: ENTITY_TYPE,
    action: 'processing_write_off_updated',
    userId,
    comment,
    transaction
  });

  return { ok: true };
};

const searchMaterialProcessingWriteOffs = async (req, res) => {
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

    const { count, rows } = await MaterialProcessingWriteOff.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MaterialProcessingWriteOffItem,
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
      data: rows,
      pagination: buildPagination(Number(page), Number(size), count)
    });
  } catch (error) {
    console.error('searchMaterialProcessingWriteOffs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске актов переработки',
      error: error.message
    });
  }
};

const getMaterialProcessingWriteOffById = async (req, res) => {
  try {
    const { id } = req.params;
    const writeOff = await getProcessingWriteOffByIdInternal(id);

    if (!writeOff || writeOff.deleted === true) {
      return res.status(404).json({
        success: false,
        message: 'Акт переработки не найден'
      });
    }

    return res.json({
      success: true,
      data: writeOff
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении акта переработки',
      error: error.message
    });
  }
};

const createMaterialProcessingWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { warehouse_id, note, items = [] } = req.body || {};
    const warehouseId = toNumber(warehouse_id);
    const normalizedItems = mergeItemsByMaterial(items);

    if (!warehouseId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'warehouse_id обязателен' });
    }

    if (!normalizedItems || normalizedItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Нужна хотя бы одна позиция переработки' });
    }

    const warehouse = await Warehouse.findOne({
      where: { id: warehouseId, ...ACTIVE_WHERE },
      transaction
    });

    if (!warehouse) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Склад не найден' });
    }

    const materialIds = normalizedItems.map((item) => item.material_id);
    const materials = await Material.findAll({
      where: { id: materialIds, ...ACTIVE_WHERE },
      transaction
    });

    if (materials.length !== materialIds.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Часть материалов не найдена' });
    }

    const stockAvailability = await validateWarehouseStockAvailability({
      warehouseId,
      items: normalizedItems,
      transaction
    });

    if (!stockAvailability.ok) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: stockAvailability.message });
    }

    const writeOff = await MaterialProcessingWriteOff.create({
      project_id: warehouse.project_id,
      warehouse_id: warehouseId,
      status: WRITE_OFF_STATUS.CREATED,
      note: note ?? null,
      created_user_id: req.user.id,
      signed_by_foreman: false,
      signed_by_planning_engineer: false,
      signed_by_main_engineer: false,
      signed_by_general_director: false
    }, { transaction });

    await MaterialProcessingWriteOffItem.bulkCreate(
      normalizedItems.map((item) => ({
        processing_write_off_id: writeOff.id,
        material_id: item.material_id,
        unit_of_measure: item.unit_of_measure,
        quantity: item.quantity,
        note: item.note ?? null
      })),
      { transaction }
    );

    await transaction.commit();
    const created = await getProcessingWriteOffByIdInternal(writeOff.id);

    return res.status(201).json({
      success: true,
      message: 'Акт переработки успешно создан',
      data: created
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('createMaterialProcessingWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании акта переработки',
      error: error.message
    });
  }
};

const updateMaterialProcessingWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { note, items, comment } = req.body || {};

    const writeOff = await MaterialProcessingWriteOff.findByPk(id, { transaction });

    if (!writeOff || writeOff.deleted === true) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Акт переработки не найден' });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Проведенный акт переработки нельзя редактировать' });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.CANCELED) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Отмененный акт переработки нельзя редактировать' });
    }

    const data = {};

    if (note !== undefined) {
      data.note = note ?? null;
    }

    await updateWithAudit({
      model: MaterialProcessingWriteOff,
      id,
      data,
      entityType: ENTITY_TYPE,
      action: 'processing_write_off_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    if (Array.isArray(items)) {
      const normalizedItems = mergeItemsByMaterial(items);

      if (!normalizedItems || normalizedItems.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Нужна хотя бы одна позиция переработки' });
      }

      const materialIds = normalizedItems.map((item) => item.material_id);
      const materials = await Material.findAll({
        where: { id: materialIds, ...ACTIVE_WHERE },
        transaction
      });

      if (materials.length !== materialIds.length) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Часть материалов не найдена' });
      }

      const stockAvailability = await validateWarehouseStockAvailability({
        warehouseId: Number(writeOff.warehouse_id),
        items: normalizedItems,
        transaction
      });

      if (!stockAvailability.ok) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: stockAvailability.message });
      }

      await MaterialProcessingWriteOffItem.update(
        { deleted: true },
        { where: { processing_write_off_id: Number(id), ...ACTIVE_WHERE }, transaction }
      );

      await MaterialProcessingWriteOffItem.bulkCreate(
        normalizedItems.map((item) => ({
          processing_write_off_id: Number(id),
          material_id: item.material_id,
          unit_of_measure: item.unit_of_measure,
          quantity: item.quantity,
          note: item.note ?? null
        })),
        { transaction }
      );
    }

    await transaction.commit();
    const updated = await getProcessingWriteOffByIdInternal(id);

    return res.json({
      success: true,
      message: 'Акт переработки успешно обновлен',
      data: updated
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('updateMaterialProcessingWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении акта переработки',
      error: error.message
    });
  }
};

const signMaterialProcessingWriteOff = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { stage, comment } = req.body || {};

    const config = SIGN_STAGE_MAP[stage];
    if (!config) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Некорректный этап подписания' });
    }

    const writeOff = await MaterialProcessingWriteOff.findByPk(id, { transaction });

    if (!writeOff || writeOff.deleted === true) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Акт переработки не найден' });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Акт переработки уже проведен' });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.CANCELED) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Отмененный акт переработки подписывать нельзя' });
    }

    if (!(await canUserSign(stage, req.user))) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Недостаточно прав для подписи этого этапа' });
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
      model: MaterialProcessingWriteOff,
      id,
      data: {
        [config.signField]: true,
        [config.userField]: req.user.id,
        [config.timeField]: writeOff[config.timeField] || localTimestampLiteral(),
        status: WRITE_OFF_STATUS.SIGNING
      },
      entityType: ENTITY_TYPE,
      action: 'processing_write_off_updated',
      userId: req.user.id,
      comment,
      transaction
    });

    let responseMessage = 'Акт переработки успешно подписан';

    if (allSigned(result.instance)) {
      const finalizeResult = await finalizeProcessingWriteOff({
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

      responseMessage = 'Акт переработки подписан и автоматически проведен';
    }

    await transaction.commit();
    const finalData = await getProcessingWriteOffByIdInternal(id);

    return res.json({
      success: true,
      message: responseMessage,
      data: finalData
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('signMaterialProcessingWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при подписании акта переработки',
      error: error.message
    });
  }
};

const deleteMaterialProcessingWriteOff = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body || {};

    const writeOff = await MaterialProcessingWriteOff.findByPk(id);

    if (!writeOff || writeOff.deleted === true) {
      return res.status(404).json({ success: false, message: 'Акт переработки не найден' });
    }

    if (Number(writeOff.status) === WRITE_OFF_STATUS.POSTED) {
      return res.status(400).json({ success: false, message: 'Проведенный акт переработки нельзя удалить' });
    }

    const result = await updateWithAudit({
      model: MaterialProcessingWriteOff,
      id,
      data: {
        deleted: true,
        status: WRITE_OFF_STATUS.CANCELED
      },
      entityType: ENTITY_TYPE,
      action: 'processing_write_off_deleted',
      userId: req.user.id,
      comment
    });

    await MaterialProcessingWriteOffItem.update(
      { deleted: true },
      { where: { processing_write_off_id: Number(id), ...ACTIVE_WHERE } }
    );

    return res.json({
      success: true,
      message: result.changed ? 'Акт переработки успешно удален' : 'Изменений не обнаружено'
    });
  } catch (error) {
    console.error('deleteMaterialProcessingWriteOff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении акта переработки',
      error: error.message
    });
  }
};

module.exports = {
  searchMaterialProcessingWriteOffs,
  getMaterialProcessingWriteOffById,
  createMaterialProcessingWriteOff,
  updateMaterialProcessingWriteOff,
  signMaterialProcessingWriteOff,
  deleteMaterialProcessingWriteOff
};
