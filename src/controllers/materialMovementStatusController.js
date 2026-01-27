const MaterialMovementStatus = require('../models/MaterialMovementStatus');
const { Op } = require("sequelize");

const getAllMaterialMovementStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await MaterialMovementStatus.findAndCountAll({
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
      message: 'Ошибка сервера при получении статусов транзакций материалов',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialMovementStatuses
};