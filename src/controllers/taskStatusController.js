const TaskStatus = require('../models/TaskStatus');
const { Op } = require("sequelize");

const getAllTaskStatuses = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await TaskStatus.findAndCountAll({
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
      message: 'Ошибка сервера при получении статусов задачи',
      error: error.message
    });
  }
};

module.exports = {
  getAllTaskStatuses,
};