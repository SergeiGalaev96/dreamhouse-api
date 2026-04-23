const { Op } = require("sequelize");
const { sequelize, Warehouse, WarehouseStock } = require("../models");
const MaterialMovement = require('../models/MaterialMovement');
const updateWithAudit = require('../utils/updateWithAudit');

const getAllMaterialMovements = async (req, res) => {
  try {
    const whereClause = { deleted: false };

    const { count, rows } = await MaterialMovement.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении транзакций',
      error: error.message
    });
  }
};

const searchMaterialMovements = async (req, res) => {
  try {
    const {
      project_id,
      warehouse_id,
      material_id,
      status,
      // name,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;
    const whereClause = { deleted: false };


    // if (name)
    //   whereClause.name = { [Op.iLike]: `%${name}%` };

    if (project_id)
      whereClause.project_id = project_id

    if (warehouse_id)
      whereClause[Op.or] = [
        { from_warehouse_id: warehouse_id },
        { to_warehouse_id: warehouse_id }
      ]

    if (material_id)
      whereClause.material_id = material_id

    if (status)
      whereClause.status = status

    const { count, rows } = await MaterialMovement.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']]
    });

    const operationRows = await MaterialMovement.findAll({
      attributes: [
        'operation',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      where: whereClause,
      group: ['operation'],
      raw: true
    });

    const operationCounts = {
      incoming: 0,
      outgoing: 0,
      transfer: 0,
      '+': 0,
      '-': 0,
      '=': 0
    };

    for (const row of operationRows) {
      const operation = row.operation;
      const total = Number(row.total || 0);

      operationCounts[operation] = total;
      if (operation === '+') operationCounts.incoming = total;
      if (operation === '-') operationCounts.outgoing = total;
      if (operation === '=') operationCounts.transfer = total;
    }

    res.json({
      success: true,
      data: rows,
      operation_counts: operationCounts,
      pagination: {
        page: Number(page),
        size: Number(size),
        total: count,
        pages: Math.ceil(count / size),
        hasNext: page * size < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Ошибка при поиске транзакций:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске транзакций",
      error: error.message,
    });
  }
};

const getMaterialMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    const materialMovement = await MaterialMovement.findByPk(id);

    if (!materialMovement) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция не найдена'
      });
    }

    res.json({
      success: true,
      data: materialMovement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении транзакции',
      error: error.message
    });
  }
};

const createMaterialMovement = async (req, res) => {
  try {
    const materialMovement = await MaterialMovement.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Транзакция успешно создана',
      data: materialMovement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании транзакции',
      error: error.message
    });
  }
};

const transferMaterialMovements = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { from_warehouse_id, to_warehouse_id, items } = req.body;

    if (!from_warehouse_id || !to_warehouse_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'from_warehouse_id и to_warehouse_id обязательны'
      });
    }

    if (Number(from_warehouse_id) === Number(to_warehouse_id)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Склады отправки и получения должны отличаться'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'items должен быть непустым массивом'
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
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Один из складов не найден'
      });
    }

    for (const entry of items) {
      const { material_id, quantity, note } = entry || {};

      if (!material_id || quantity === undefined || Number(quantity) <= 0) {
        throw new Error('Некорректные данные позиции перемещения');
      }

      const sourceStock = await WarehouseStock.findOne({
        where: {
          warehouse_id: Number(from_warehouse_id),
          material_id: Number(material_id),
          deleted: false
        },
        transaction
      });

      if (!sourceStock) {
        throw new Error(`Материал ${material_id} отсутствует на складе отправки`);
      }

      const availableQuantity = Number(sourceStock.quantity || 0);
      const transferQuantity = Number(quantity);

      if (transferQuantity > availableQuantity) {
        throw new Error(`Недостаточно остатка по материалу ${material_id}`);
      }

      const destinationStock = await WarehouseStock.findOne({
        where: {
          warehouse_id: Number(to_warehouse_id),
          material_id: Number(material_id),
          deleted: false
        },
        transaction
      });

      await sourceStock.update(
        { quantity: availableQuantity - transferQuantity },
        { transaction }
      );

      if (destinationStock) {
        await destinationStock.update(
          { quantity: Number(destinationStock.quantity || 0) + transferQuantity },
          { transaction }
        );
      } else {
        await WarehouseStock.create(
          {
            warehouse_id: Number(to_warehouse_id),
            material_id: Number(material_id),
            material_type: sourceStock.material_type,
            unit_of_measure: sourceStock.unit_of_measure,
            quantity: transferQuantity
          },
          { transaction }
        );
      }

      await MaterialMovement.create(
        {
          project_id: fromWarehouse.project_id,
          date: new Date(),
          from_warehouse_id: Number(from_warehouse_id),
          to_warehouse_id: Number(to_warehouse_id),
          material_id: Number(material_id),
          quantity: transferQuantity,
          user_id: req.user.id,
          note: note || 'Перемещение между складами',
          operation: '=',
          status: 1
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Перемещение между складами успешно выполнено'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('transferMaterialMovements error:', error);

    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при перемещении материалов между складами',
      error: error.message
    });
  }
};

const updateMaterialMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: MaterialMovement,
      id,
      data,
      entityType: 'material_movement',
      action: 'material_movement_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция не найдена'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Транзакция успешно обновлена'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updateMaterialMovement error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении транзакции',
      error: error.message
    });
  }
};


const deleteMaterialMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const materialMovementId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await MaterialMovement.update(
      { deleted: true },
      { where: { id: materialMovementId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Транзакция успешно удалена'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении транзакции',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialMovements,
  searchMaterialMovements,
  getMaterialMovementById,
  createMaterialMovement,
  transferMaterialMovements,
  updateMaterialMovement,
  deleteMaterialMovement
};
