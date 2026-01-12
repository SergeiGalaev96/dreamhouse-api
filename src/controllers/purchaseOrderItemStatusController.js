const PurchaseOrderItemStatus = require('../models/PurchaseOrderItemStatus');
const { Op } = require("sequelize");

const getAllPurchaseOrderItemStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await PurchaseOrderItemStatus.findAndCountAll({
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
      message: 'Ошибка сервера при получении статусов элементов в заявках на закуп',
      error: error.message
    });
  }
};

module.exports = {
  getAllPurchaseOrderItemStatuses
};