const { Op } = require("sequelize");
const {
  sequelize,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialRequest,
  MaterialRequestItem,
  Warehouse,
  WarehouseStock
} = require('../models');
const MaterialMovement = require('../models/MaterialMovement');
const updateWithAudit = require('../utils/updateWithAudit');

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
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: PurchaseOrderItem,
      id,
      data,
      entityType: 'purchase_order_item',
      action: 'purchase_order_item_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Материал в заявке на закуп не найден'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Материал в заявке на закуп успешно обновлён'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {
    console.error('updatePurchaseOrderItem error:', error);

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
    const { warehouse_id, items } = req.body;
    if (!warehouse_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'warehouse_id обязателен'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'items должен быть непустым массивом'
      });
    }

    // Все затронутые заявки на материалы
    const affectedMaterialRequestIds = new Set();
    const affectedPurchaseOrderIds = new Set();

    /* ============================================================
       1. Обрабатываем каждую позицию закупки
    ============================================================ */
    for (const entry of items) {
      const { purchase_order_item_id, received_quantity } = entry;

      if (!purchase_order_item_id || received_quantity === undefined || received_quantity < 0) {
        throw new Error('Некорректные данные позиции приёмки');
      }

      const poItem = await PurchaseOrderItem.findByPk(
        purchase_order_item_id,
        {
          include: {
            model: MaterialRequestItem,
            as: 'material_request_item',
            attributes: ['material_request_id']
          },
          transaction
        }
      );

      if (!poItem) {
        throw new Error(`PurchaseOrderItem ${purchase_order_item_id} не найден`);
      }

      const orderedQty = Number(poItem.quantity);
      const prevDelivered = Number(poItem.delivered_quantity || 0);
      const newDeliveredTotal = prevDelivered + Number(received_quantity);

      /* =======================
         1.1 Статус позиции
      ======================= */
      let poItemStatus;
      if (received_quantity === 0) {
        poItemStatus = 6; // Не доставлен
      } else if (newDeliveredTotal >= orderedQty) {
        poItemStatus = 4; // Полностью доставлен
      } else {
        poItemStatus = 5; // Частично доставлен
      }

      await poItem.update(
        {
          delivered_quantity: newDeliveredTotal,
          status: poItemStatus
        },
        { transaction }
      );

      /* =======================
         1.2 Обновляем склад
      ======================= */
      if (received_quantity > 0) {
        const stock = await WarehouseStock.findOne({
          where: {
            warehouse_id,
            material_id: poItem.material_id,
            material_type: poItem.material_type,
            unit_of_measure: poItem.unit_of_measure,
            deleted: false
          },
          transaction
        });

        if (stock) {
          await stock.update(
            {
              quantity: Number(stock.quantity) + Number(received_quantity)
            },
            { transaction }
          );
        } else {
          await WarehouseStock.create(
            {
              warehouse_id,
              material_id: poItem.material_id,
              material_type: poItem.material_type,
              unit_of_measure: poItem.unit_of_measure,
              quantity: Number(received_quantity)
            },
            { transaction }
          );
        }
        /* =======================
          1.3 Создаем транзакции
        ======================= */
        const warehouse = await Warehouse.findOne({
          where: {
            id: warehouse_id
          },
          transaction
        });
        await MaterialMovement.create(
          {
            project_id: warehouse.project_id,
            date: new Date(),
            to_warehouse_id: warehouse_id,
            material_id: poItem.material_id,
            quantity: Number(received_quantity),
            user_id: req.user.id,
            note: "Автоматическая транзакция",
            operation: "+",
            status: 1
          },
          { transaction }
        );
      }

      if (poItem.material_request_item) {
        affectedMaterialRequestIds.add(poItem.material_request_item.material_request_id);
        affectedPurchaseOrderIds.add(poItem.purchase_order_id);
      }
    }
    /* ============================================================
      2. Проверяем, можно ли закрыть PurchaseOrder
    ============================================================ */
    for (const poId of affectedPurchaseOrderIds) {
      const poItems = await PurchaseOrderItem.findAll({
        where: {
          purchase_order_id: poId,
          deleted: false
        },
        attributes: ['status'],
        transaction
      });

      const allDelivered = poItems.length > 0 && poItems.every(item => item.status === 4);

      await PurchaseOrder.update(
        { status: allDelivered ? 5 : 4 }, // 5 Полностью доставлен /4 Частично доставлен
        {
          where: { id: poId },
          transaction
        }
      );
      // иначе остаётся "В доставке"
    }

    /* ============================================================
       3. Проверяем, можно ли закрыть MaterialRequest
    ============================================================ */
    // for (const mrId of affectedMaterialRequestIds) {
    //   const poItems = await PurchaseOrderItem.findAll({
    //     include: {
    //       model: MaterialRequestItem,
    //       as: 'material_request_item',
    //       where: { material_request_id: mrId },
    //       attributes: []
    //     },
    //     attributes: ['status'],
    //     transaction
    //   });

    //   const allDelivered =
    //     poItems.length > 0 &&
    //     poItems.every(i => i.status === 4);

    //   if (allDelivered) {
    //     await MaterialRequest.update(
    //       { status: 4 }, // Исполнена
    //       {
    //         where: { id: mrId },
    //         transaction
    //       }
    //     );
    //   }
    //   // иначе статус остаётся "На исполнении"
    // }

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