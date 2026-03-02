const MaterialEstimateItemType = require('../models/MaterialEstimateItemType');
const { Op } = require("sequelize");

const getAllMaterialEstimateItemTypes = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await MaterialEstimateItemType.findAndCountAll({
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
      message: 'Ошибка сервера при получении типов записей сметы',
      error: error.message
    });
  }
};

module.exports = {
  getAllMaterialEstimateItemTypes
};