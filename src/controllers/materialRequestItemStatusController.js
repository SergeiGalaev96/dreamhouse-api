const MaterialRequestItemStatus = require('../models/MaterialRequestItemStatus');
const { Op } = require("sequelize");

const getAllMaterialRequestItemStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await MaterialRequestItemStatus.findAndCountAll({
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
      message: 'Ошибка сервера при получении статусов материалов в заявках',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialRequestItemStatuses
};