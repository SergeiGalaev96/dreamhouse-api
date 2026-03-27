const TaskPriority = require('../models/TaskPriority');
const { Op } = require("sequelize");

const getAllTaskPriorities = async (req, res) => {
  try {
    const whereClause = {deleted: false};

    const { count, rows } = await TaskPriority.findAndCountAll({
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
      message: 'Ошибка сервера при получении приоритетов задачи',
      error: error.message
    });
  }
};

module.exports = {
  getAllTaskPriorities,
};