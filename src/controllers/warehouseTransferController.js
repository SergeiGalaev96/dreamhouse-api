const { Op } = require('sequelize');
const {
  sequelize,
  WarehouseTransfer,
  WarehouseTransferItem,
  Warehouse,
  WarehouseStock,
  MaterialMovement,
  Project,
  Document
} = require('../models');
const { localTimestampLiteral } = require('../utils/dateTime');

const safeRollback = async (transaction) => {
  if (!transaction || transaction.finished) return;
  await transaction.rollback();
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const canUserSignSide = ({ user, side, fromWarehouse, toWarehouse, fromProject, toProject }) => {
  const userId = Number(user?.id);
  const roleId = Number(user?.role_id);

  if (!userId) return false;
  if (roleId === 1) return true;

  if (side === 'sender') {
    return userId === Number(fromWarehouse?.manager_id) || userId === Number(fromProject?.master_id);
  }

  if (side === 'receiver') {
    return userId === Number(toWarehouse?.manager_id) || userId === Number(toProject?.master_id);
  }

  return false;
};

const buildTransferQuery = async (where, limit, offset) => {
  const { count, rows } = await WarehouseTransfer.findAndCountAll({
    where,
    include: [
      {
        model: WarehouseTransferItem,
        as: 'items',
        where: { deleted: false },
        required: false
      }
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });

  return { count, rows };
};

const searchWarehouseTransfers = async (req, res) => {
  try {
    const {
      warehouse_id,
      status,
      page = 1,
      size = 10
    } = req.body || {};

    const offset = (Number(page) - 1) * Number(size);
    const where = {
      deleted: false
    };

    if (warehouse_id) {
      where[Op.or] = [
        { from_warehouse_id: Number(warehouse_id) },
        { to_warehouse_id: Number(warehouse_id) }
      ];
    }

    if (status) {
      where.status = Number(status);
    }

    const { count, rows } = await buildTransferQuery(where, Number(size), offset);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: Number(size),
        total: count,
        pages: Math.ceil(count / Number(size)),
        hasNext: Number(page) * Number(size) < count,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('searchWarehouseTransfers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске накладных перемещения',
      error: error.message
    });
  }
};

const getWarehouseTransferById = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await WarehouseTransfer.findOne({
      where: {
        id: Number(id),
        deleted: false
      },
      include: [
        {
          model: WarehouseTransferItem,
          as: 'items',
          where: { deleted: false },
          required: false
        }
      ]
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Накладная перемещения не найдена'
      });
    }

    return res.json({
      success: true,
      data: transfer
    });
  } catch (error) {
    console.error('getWarehouseTransferById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении накладной перемещения',
      error: error.message
    });
  }
};

const createWarehouseTransfer = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      from_warehouse_id,
      to_warehouse_id,
      comment,
      items
    } = req.body || {};

    if (!from_warehouse_id || !to_warehouse_id) {
      await safeRollback(transaction);
      return res.status(400).json({
        success: false,
        message: 'Нужны from_warehouse_id и to_warehouse_id'
      });
    }

    if (Number(from_warehouse_id) === Number(to_warehouse_id)) {
      await safeRollback(transaction);
      return res.status(400).json({
        success: false,
        message: 'Склад отправителя и получателя должны отличаться'
      });
    }

    if (!Array.isArray(items) || !items.length) {
      await safeRollback(transaction);
      return res.status(400).json({
        success: false,
        message: 'Добавьте хотя бы одну позицию'
      });
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      Warehouse.findOne({
        where: { id: Number(from_warehouse_id), deleted: false },
        transaction
      }),
      Warehouse.findOne({
        where: { id: Number(to_warehouse_id), deleted: false },
        transaction
      })
    ]);

    if (!fromWarehouse || !toWarehouse) {
      await safeRollback(transaction);
      return res.status(404).json({
        success: false,
        message: 'Один из складов не найден'
      });
    }

    const transfer = await WarehouseTransfer.create({
      posted_at: localTimestampLiteral(),
      from_warehouse_id: Number(from_warehouse_id),
      to_warehouse_id: Number(to_warehouse_id),
      created_user_id: Number(req.user.id),
      status: 1,
      comment: comment || null,
      sender_signed: false,
      receiver_signed: false,
      deleted: false
    }, { transaction });

    const transferItems = [];

    for (const item of items) {
      if (!item?.material_id || toNumber(item.quantity) <= 0 || !item?.unit_of_measure) {
        throw new Error('Некорректные данные позиции перемещения');
      }

      transferItems.push({
        warehouse_transfer_id: transfer.id,
        material_id: Number(item.material_id),
        unit_of_measure: Number(item.unit_of_measure),
        quantity: toNumber(item.quantity),
        deleted: false
      });
    }

    await WarehouseTransferItem.bulkCreate(transferItems, { transaction });

    await Document.create({
      entity_type: 'warehouseTransfer',
      entity_id: transfer.id,
      name: `Файлы перемещения №${transfer.id}`,
      status: 3,
      uploaded_by: Number(req.user.id),
      deleted: false
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Накладная на перемещение создана',
      data: transfer
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('createWarehouseTransfer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании накладной перемещения',
      error: error.message
    });
  }
};

const postWarehouseTransfer = async ({ transfer, items, userId, projectId, postedAt = localTimestampLiteral(), transaction }) => {
  const fromWarehouseId = Number(transfer.from_warehouse_id);
  const toWarehouseId = Number(transfer.to_warehouse_id);

  for (const item of items) {
    const materialId = Number(item.material_id);
    const quantity = toNumber(item.quantity);

    const sourceStock = await WarehouseStock.findOne({
      where: {
        warehouse_id: fromWarehouseId,
        material_id: materialId,
        deleted: false
      },
      transaction
    });

    if (!sourceStock) {
      throw new Error(`Материал ${materialId} отсутствует на складе отправителя`);
    }

    const available = toNumber(sourceStock.quantity);
    if (available < quantity) {
      throw new Error(`Недостаточно остатка по материалу ${materialId}`);
    }

    const destinationStock = await WarehouseStock.findOne({
      where: {
        warehouse_id: toWarehouseId,
        material_id: materialId,
        deleted: false
      },
      transaction
    });

    await sourceStock.update(
      { quantity: available - quantity },
      { transaction }
    );

    if (destinationStock) {
      await destinationStock.update(
        { quantity: toNumber(destinationStock.quantity) + quantity },
        { transaction }
      );
    } else {
      await WarehouseStock.create({
        warehouse_id: toWarehouseId,
        material_id: materialId,
        material_type: sourceStock.material_type,
        unit_of_measure: Number(item.unit_of_measure),
        quantity,
        deleted: false
      }, { transaction });
    }

    await MaterialMovement.create({
      project_id: Number(projectId),
      date: postedAt,
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      user_id: Number(userId),
      note: transfer.comment || `Перемещение №${transfer.id}`,
      material_id: materialId,
      quantity,
      operation: '=',
      status: 1,
      entity_type: 'warehouse_transfer',
      entity_id: Number(transfer.id),
      deleted: false
    }, { transaction });
  }
};

const signWarehouseTransfer = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { side } = req.body || {};

    if (!['sender', 'receiver'].includes(side)) {
      await safeRollback(transaction);
      return res.status(400).json({
        success: false,
        message: 'side должен быть sender или receiver'
      });
    }

    const transfer = await WarehouseTransfer.findOne({
      where: {
        id: Number(id),
        deleted: false
      },
      include: [
        {
          model: WarehouseTransferItem,
          as: 'items',
          where: { deleted: false },
          required: false
        }
      ],
      transaction
    });

    if (!transfer) {
      await safeRollback(transaction);
      return res.status(404).json({
        success: false,
        message: 'Накладная перемещения не найдена'
      });
    }

    if (Number(transfer.status) === 4 || Number(transfer.status) === 5) {
      await safeRollback(transaction);
      return res.status(400).json({
        success: false,
        message: 'Накладная уже завершена'
      });
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      Warehouse.findOne({ where: { id: Number(transfer.from_warehouse_id), deleted: false }, transaction }),
      Warehouse.findOne({ where: { id: Number(transfer.to_warehouse_id), deleted: false }, transaction })
    ]);

    const [fromProject, toProject] = await Promise.all([
      Project.findOne({ where: { id: Number(fromWarehouse?.project_id), deleted: false }, transaction }),
      Project.findOne({ where: { id: Number(toWarehouse?.project_id), deleted: false }, transaction })
    ]);

    const allowed = canUserSignSide({
      user: req.user,
      side,
      fromWarehouse,
      toWarehouse,
      fromProject,
      toProject
    });

    if (!allowed) {
      await safeRollback(transaction);
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для подписи этой стороны'
      });
    }

    const now = localTimestampLiteral();
    let nextStatus = Number(transfer.status);

    if (side === 'sender') {
      if (transfer.sender_signed) {
        await safeRollback(transaction);
        return res.status(400).json({
          success: false,
          message: 'Отправитель уже подписал накладную'
        });
      }

      transfer.sender_signed = true;
      transfer.sender_signed_user_id = Number(req.user.id);
      transfer.sender_signed_time = now;
      nextStatus = 2;
    }

    if (side === 'receiver') {
      if (transfer.receiver_signed) {
        await safeRollback(transaction);
        return res.status(400).json({
          success: false,
          message: 'Получатель уже подписал накладную'
        });
      }

      transfer.receiver_signed = true;
      transfer.receiver_signed_user_id = Number(req.user.id);
      transfer.receiver_signed_time = now;
      nextStatus = 3;
    }

    const bothSigned = Boolean(transfer.sender_signed) && Boolean(transfer.receiver_signed);

    if (bothSigned) {
      const postedAt = localTimestampLiteral();
      await postWarehouseTransfer({
        transfer,
        items: transfer.items || [],
        userId: req.user.id,
        projectId: fromWarehouse?.project_id,
        postedAt,
        transaction
      });
      transfer.posted_at = postedAt;
      nextStatus = 4;
    }

    transfer.status = nextStatus;

    await transfer.save({ transaction });
    await transfer.reload({ transaction });
    await transaction.commit();

    return res.json({
      success: true,
      message: bothSigned ? 'Накладная подписана и проведена' : 'Накладная подписана',
      data: transfer
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('signWarehouseTransfer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при подписи накладной перемещения',
      error: error.message
    });
  }
};

const rejectWarehouseTransfer = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { comment } = req.body || {};

    const transfer = await WarehouseTransfer.findOne({
      where: {
        id: Number(id),
        deleted: false
      },
      transaction
    });

    if (!transfer) {
      await safeRollback(transaction);
      return res.status(404).json({
        success: false,
        message: 'Накладная перемещения не найдена'
      });
    }

    if (Number(transfer.status) === 4 || Number(transfer.status) === 5) {
      await safeRollback(transaction);
      return res.status(400).json({
        success: false,
        message: 'Накладная уже завершена'
      });
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      Warehouse.findOne({ where: { id: Number(transfer.from_warehouse_id), deleted: false }, transaction }),
      Warehouse.findOne({ where: { id: Number(transfer.to_warehouse_id), deleted: false }, transaction })
    ]);
    const [fromProject, toProject] = await Promise.all([
      Project.findOne({ where: { id: Number(fromWarehouse?.project_id), deleted: false }, transaction }),
      Project.findOne({ where: { id: Number(toWarehouse?.project_id), deleted: false }, transaction })
    ]);

    const canReject =
      canUserSignSide({ user: req.user, side: 'sender', fromWarehouse, toWarehouse, fromProject, toProject }) ||
      canUserSignSide({ user: req.user, side: 'receiver', fromWarehouse, toWarehouse, fromProject, toProject });

    if (!canReject) {
      await safeRollback(transaction);
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для отклонения накладной'
      });
    }

    transfer.status = 5;
    transfer.comment = comment || transfer.comment;
    await transfer.save({ transaction });
    await transaction.commit();

    return res.json({
      success: true,
      message: 'Накладная отклонена',
      data: transfer
    });
  } catch (error) {
    await safeRollback(transaction);
    console.error('rejectWarehouseTransfer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при отклонении накладной перемещения',
      error: error.message
    });
  }
};

module.exports = {
  searchWarehouseTransfers,
  getWarehouseTransferById,
  createWarehouseTransfer,
  signWarehouseTransfer,
  rejectWarehouseTransfer
};
