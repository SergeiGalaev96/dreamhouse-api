const GeneralStatus = require('../models/GeneralStatus');
const { Op } = require("sequelize");

const getAllGeneralStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await GeneralStatus.findAndCountAll({
      where: whereClause,
      order: [['id', 'ASC']]
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
      message: 'Ошибка сервера при получении статусов',
      error: error.message
    });
  }
};

module.exports = {
  getAllGeneralStatuses,
};