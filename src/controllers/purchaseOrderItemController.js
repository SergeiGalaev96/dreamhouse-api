const { Op } = require("sequelize");
const {
  sequelize,
  PurchaseOrderItem,
  MaterialRequestItem,
  MaterialRequest
} = require('../models');

const getAllPurchaseOrderItems = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await PurchaseOrderItem.findAndCountAll({
      where: whereClause,
      order: [['purchase_order_id', 'ASC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов в заявках на закуп',
      error: error.message
    });
  }
};

const searchPurchaseOrderItems = async (req, res) => {
  try {
    const {
      purchase_order_id,
      material_type,
      material_id,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (purchase_order_id) whereClause.purchase_order_id = purchase_order_id;
    if (material_type) whereClause.material_type = material_type;
    if (material_id) whereClause.material_id = material_id;

    const { count, rows } = await PurchaseOrderItem.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
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
    console.error('Ошибка сервера при поиске материалов в заявках на закуп:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске материалов в заявках на закуп',
      error: error.message
    });
  }
};


const getPurchaseOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrderItem = await PurchaseOrderItem.findByPk(id);

    if (!purchaseOrderItem) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке на закуп не найден'
      });
    }

    res.json({
      success: true,
      data: purchaseOrderItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении материал в заявке на закуп',
      error: error.message
    });
  }
};

const createPurchaseOrderItem = async (req, res) => {
  try {
    const purchaseOrderItem = await PurchaseOrderItem.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Материал успешно добавлен в заявку на закуп',
      data: purchaseOrderItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при добавлении материала в заявку на закуп',
      error: error.message
    });
  }
};

const updatePurchaseOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await PurchaseOrderItem.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке на закуп не найден'
      });
    }

    const updatedPurchaseOrderItem = await PurchaseOrderItem.findByPk(id);

    res.json({
      success: true,
      message: 'Материал в заявке на закуп успешно обновлен',
      data: updatedPurchaseOrderItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении материала в заявке на закуп',
      error: error.message
    });
  }
};

const deletePurchaseOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await PurchaseOrderItem.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке на закуп не найден'
      });
    }

    return res.json({
      success: true,
      message: 'Материал успешно удален из заявки'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении материала из заявки',
      error: error.message
    });
  }
};

const receivePurchaseOrderItems = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'items должен быть непустым массивом'
      });
    }

    // Множество родительских MaterialRequest для проверки статуса
    const affectedMaterialRequestIds = new Set();

    // 1. Обрабатываем каждую позицию закупки
    for (const entry of items) {
      const { purchase_order_item_id, delivered_quantity } = entry;

      if (!purchase_order_item_id || delivered_quantity === undefined || delivered_quantity < 0) {
        throw new Error('Некорректные данные позиции приёмки');
      }

      // Берём PurchaseOrderItem с привязанным MaterialRequestItem
      const poItem = await PurchaseOrderItem.findByPk(purchase_order_item_id, {
        include: {
          model: MaterialRequestItem,
          as: 'material_request_item',
          attributes: ['material_request_id']
        },
        transaction
      });

      if (!poItem) {
        throw new Error(`PurchaseOrderItem ${purchase_order_item_id} не найден`);
      }

      const orderedQty = Number(poItem.quantity);
      const prevDelivered = Number(poItem.delivered_quantity || 0);
      const newDeliveredTotal = prevDelivered + Number(delivered_quantity);

      // 2. Определяем статус позиции
      let poItemStatus;
      if (delivered_quantity === 0) {
        poItemStatus = 6; // Не доставлен
      } else if (newDeliveredTotal >= orderedQty) {
        poItemStatus = 4; // Полностью доставлен
      } else {
        poItemStatus = 5; // Частично доставлен
      }

      await poItem.update(
        { delivered_quantity: newDeliveredTotal, status: poItemStatus },
        { transaction }
      );

      if (poItem.materialRequestItem) {
        affectedMaterialRequestIds.add(poItem.materialRequestItem.material_request_id);
      }
    }

    // 3. Проверяем, можно ли закрыть MaterialRequest
    for (const mrId of affectedMaterialRequestIds) {
      // Берём все PurchaseOrderItem по заявке
      const poItems = await PurchaseOrderItem.findAll({
        include: {
          model: MaterialRequestItem,
          as: 'materialRequestItem',
          where: { material_request_id: mrId },
          attributes: []
        },
        attributes: ['status'],
        transaction
      });

      const allDelivered = poItems.length > 0 && poItems.every(i => i.status === 4);

      if (allDelivered) {
        await MaterialRequest.update(
          { status: 4 }, // Исполнена
          { where: { id: mrId }, transaction }
        );
      }
      // Если есть хотя бы одна частично доставленная позиция — статус остаётся 3 (На исполнении)
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'Приёмка материалов успешно выполнена'
    });

  } catch (error) {
    await transaction.rollback();
    console.error('receivePurchaseOrderItems error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при приёмке материалов',
      error: error.message
    });
  }
};

module.exports = { receivePurchaseOrderItems };



module.exports = {
  getAllPurchaseOrderItems,
  searchPurchaseOrderItems,
  receivePurchaseOrderItems,
  getPurchaseOrderItemById,
  createPurchaseOrderItem,
  updatePurchaseOrderItem,
  deletePurchaseOrderItem
};