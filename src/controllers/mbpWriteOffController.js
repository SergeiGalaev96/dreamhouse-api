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

const WRITE_OFF_STATUS = {
  CREATED: 1,
  SIGNING: 2,
  POSTED: 3,
  CANCELED: 4
};

const SIGN_STAGE_MAP = {
  foreman: {
    signField: 'signed_by_foreman',
    timeField: 'signed_by_foreman_time'
  },
  planning_engineer: {
    signField: 'signed_by_planning_engineer',
    timeField: 'signed_by_planning_engineer_time'
  },
  main_engineer: {
    signField: 'signed_by_main_engineer',
    timeField: 'signed_by_main_engineer_time'
  },
  general_director: {
    signField: 'signed_by_general_director',
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

const normalizeDate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
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

const getProjectBlockContext = async (blockId, transaction = null) => {
  const [rows] = await sequelize.query(
    `
      select id, project_id, name
      from construction.project_blocks
      where id = :blockId
        and (deleted = false or deleted is null)
      limit 1
    `,
    {
      replacements: { blockId },
      transaction
    }
  );

  return rows[0] || null;
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

  for (const item of items) {
    const stock = stockMap.get(Number(item.material_id));
    const quantity = Number(item.quantity);

    await stock.update({ quantity: Number(stock.quantity) - quantity }, { transaction });

    const movement = await MaterialMovement.create({
      project_id: writeOff.project_id,
      date: new Date(),
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
    data: { status: WRITE_OFF_STATUS.POSTED },
    entityType: 'mbp_write_off',
    action: 'mbp_write_off_posted',
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
      block_id,
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
    if (block_id) whereClause.block_id = Number(block_id);
    if (warehouse_id) whereClause.warehouse_id = Number(warehouse_id);
    if (status) whereClause.status = Number(status);
    if (date_from || date_to) {
      whereClause.write_off_date = {};
      if (date_from) whereClause.write_off_date[Op.gte] = date_from;
      if (date_to) whereClause.write_off_date[Op.lte] = date_to;
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
      data: rows,
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
      data: writeOff
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
    const { warehouse_id, block_id, write_off_date, note, items = [] } = req.body || {};
    const warehouseId = toNumber(warehouse_id);
    const blockId = toNumber(block_id);
    const normalizedItems = mergeItemsByMaterial(items);
    const normalizedDate = normalizeDate(write_off_date);

    if (!warehouseId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'warehouse_id обязателен'
      });
    }

    if (!blockId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'block_id обязателен'
      });
    }

    if (!normalizedDate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Некорректная дата списания'
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

    const block = await getProjectBlockContext(blockId, transaction);

    if (!block) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Блок не найден'
      });
    }

    if (Number(block.project_id) !== Number(warehouse.project_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Блок не относится к проекту склада'
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

    const writeOff = await MbpWriteOff.create({
      project_id: warehouse.project_id,
      block_id: blockId,
      warehouse_id: warehouseId,
      write_off_date: normalizedDate,
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
      data: created
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
        data: writeOff
      });
    }

    const result = await updateWithAudit({
      model: MbpWriteOff,
      id,
      data: {
        [config.signField]: true,
        [config.timeField]: writeOff[config.timeField] || new Date(),
        status: WRITE_OFF_STATUS.SIGNING
      },
      entityType: 'mbp_write_off',
      action: `mbp_write_off_signed_${stage}`,
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
      data: finalData
    });
  } catch (error) {
    await transaction.rollback();
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
  signMbpWriteOff,
  deleteMbpWriteOff
};
