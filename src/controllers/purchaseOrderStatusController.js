const PurchaseOrderStatus = require('../models/PurchaseOrderStatus');
const { Op } = require("sequelize");

const getAllPurchaseOrderStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await PurchaseOrderStatus.findAndCountAll({
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
      message: 'Ошибка сервера при получении статуса заявки  на закуп',
      error: error.message
    });
  }
};

module.exports = {
  getAllPurchaseOrderStatuses
};