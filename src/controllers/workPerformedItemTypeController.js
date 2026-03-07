const { Op } = require("sequelize");
const WorkPerformedItemType = require('../models/WorkPerformedItemType');

const getAllWorkPerformedItemTypes = async (req, res) => {
  try {

    const whereClause = {deleted: false};

    const { count, rows } = await WorkPerformedItemType.findAndCountAll({
      where: whereClause,
      order: [['id', 'ASC']]
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
      message: 'Ошибка сервера при получении типов расходов АВР',
      error: error.message
    });
  }
};

module.exports = {
  getAllWorkPerformedItemTypes
};