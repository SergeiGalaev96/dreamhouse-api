const { Op } = require("sequelize");
const sequelize = require('../config/database');
const PurchaseOrder = require('../models/PurchaseOrder');
const PurchaseOrderItem = require('../models/PurchaseOrderItem');
const { MaterialRequestItem, MaterialRequest } = require('../models');

const getAllPurchaseOrders = async (req, res) => {
  try {
    const whereClause = { deleted: false };
    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: "id",
      order: [['project_id', 'ASC']],
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          required: false,
          where: { deleted: false },
        }
      ]
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
      message: 'Ошибка сервера при заявок на материалы',
      error: error.message
    });
  }
};

const searchPurchaseOrders = async (req, res) => {
  try {
    const {
      project_id,
      supplier_id,
      created_user_id,
      status,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = { deleted: false };

    if (project_id) whereClause.project_id = project_id;
    if (supplier_id) whereClause.supplier_id = supplier_id;
    if (created_user_id) whereClause.created_user_id = created_user_id;
    if (status) whereClause.status = status;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      distinct: true,
      col: "id",
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']],

      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          required: false,          // НЕ INNER JOIN → заявка может быть без items
          where: { deleted: false },
        }
      ]
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
    console.error('Ошибка поиска заявок на материалы:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске заявок на материалы',
      error: error.message
    });
  }
};


const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOne({
      where: {
        id,
        deleted: false
      },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          required: false
        }
      ]
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
    });

  } catch (error) {
    console.error('Ошибка при получении заявки на закуп:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении заявки на материалы',
      error: error.message
    });
  }
};

const createPurchaseOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { items, ...orderData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Список материалов (items) обязателен'
      });
    }

    /* ============================================================
       1. Создаём заказ на закупку
    ============================================================ */
    const purchaseOrder = await PurchaseOrder.create(
      orderData,
      { transaction }
    );

    /* ============================================================
       2. Создаём позиции закупки
    ============================================================ */
    const orderItems = items.map(item => ({
      ...item,
      purchase_order_id: purchaseOrder.id
    }));

    await PurchaseOrderItem.bulkCreate(orderItems, { transaction });

    /* ============================================================
       3. Получаем уникальные material_request_item_id
    ============================================================ */
    const materialRequestItemIds = [
      ...new Set(items.map(i => i.material_request_item_id))
    ];

    /* ============================================================
       4. Получаем MaterialRequestItem (quantity + material_request_id)
    ============================================================ */
    const requestItems = await MaterialRequestItem.findAll({
      where: {
        id: { [Op.in]: materialRequestItemIds }
      },
      attributes: ['id', 'quantity', 'material_request_id'],
      transaction
    });

    /* ============================================================
       5. Считаем, сколько ВСЕГО заказано по каждой позиции
    ============================================================ */
    const orderedTotals = await PurchaseOrderItem.findAll({
      attributes: [
        'material_request_item_id',
        [
          sequelize.fn('SUM', sequelize.col('quantity')),
          'total_ordered'
        ]
      ],
      where: {
        material_request_item_id: { [Op.in]: materialRequestItemIds },
        deleted: false,
        status: { [Op.ne]: 5 } // 5 — отменено (если используешь)
      },
      group: ['material_request_item_id'],
      transaction
    });

    const orderedMap = {};
    orderedTotals.forEach(row => {
      orderedMap[row.material_request_item_id] =
        Number(row.get('total_ordered'));
    });

    /* ============================================================
       6. Обновляем статус КАЖДОЙ MaterialRequestItem
          3 — partially_ordered
          4 — fully_ordered
    ============================================================ */
    for (const item of requestItems) {
      const requested = Number(item.quantity);
      const ordered = orderedMap[item.id] || 0;

      let newStatus = null;

      if (ordered >= requested) {
        newStatus = 4; // полностью заказано
      } else if (ordered > 0) {
        newStatus = 3; // частично заказано
      }

      // обновление статуса
      if (newStatus && item.status !== newStatus) {
        await MaterialRequestItem.update(
          { status: newStatus },
          { where: { id: item.id }, transaction }
        );
      }
    }
    /* ============================================================
       7. Обновляем статус MaterialRequest → "на исполнении"
    ============================================================ */
    const materialRequestIds = [
      ...new Set(requestItems.map(i => i.material_request_id))
    ];

    await MaterialRequest.update(
      { status: 3 }, // на исполнении
      {
        where: {
          id: { [Op.in]: materialRequestIds },
          status: { [Op.ne]: 3 }
        },
        transaction
      }
    );

    /* ============================================================
       8. Фиксируем транзакцию
    ============================================================ */
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Заявка на материалы успешно создана',
      data: purchaseOrder
    });

  } catch (error) {
    await transaction.rollback();
    console.error('createPurchaseOrder error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании заявки на материалы',
      error: error.message
    });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await PurchaseOrder.update(req.body, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    const updatedPurchaseOrder = await PurchaseOrder.findByPk(id);

    res.json({
      success: true,
      message: 'Заявка на материалы успешно обновлена',
      data: updatedPurchaseOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении заявки на материалы',
      error: error.message
    });
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const materiaId = Number(id);

    // Обновляем поле deleted вместо удаления записи
    const [updated] = await PurchaseOrder.update(
      { deleted: true },
      { where: { id: materiaId } }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Заявка на материалы не найдена'
      });
    }

    return res.json({
      success: true,
      message: 'Заявка на материалы успешно удалена'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении заявки на материалы',
      error: error.message
    });
  }
};

module.exports = {
  getAllPurchaseOrders,
  searchPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder
};