const { Op, Sequelize } = require("sequelize");
const updateWithAudit = require('../utils/updateWithAudit');
const { sendTaskAssignedEmail } = require('../utils/mailer');
const Task = require('../models/Task');
const TaskPriority = require('../models/TaskPriority');
const User = require('../models/User');

const getAllTasks = async (req, res) => {
  try {

    const { count, rows } = await Task.findAndCountAll({

      order: [["id", "DESC"]]

    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: Array.isArray(count) ? count.length : count
      }
    });

  } catch (error) {

    console.error("Ошибка получения задач:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при получении задач",
      error: error.message
    });

  }
};

const searchTasks = async (req, res) => {
  try {

    const { search, page = 1, size = 10 } = req.body;

    const limit = Number(size);
    const offset = (Number(page) - 1) * limit;

    const whereClause = {};

    if (search && search.trim() !== "") {

      const s = `%${search.trim()}%`;

      whereClause[Op.or] = [
        { title: { [Op.iLike]: s } },
        { description: { [Op.iLike]: s } }
      ];

    }

    const { count, rows } = await Task.findAndCountAll({

      where: whereClause,

      limit,
      offset,

      subQuery: false,

      order: [["id", "DESC"]]

    });

    const total = Array.isArray(count) ? count.length : count;

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {

    console.error("Ошибка при поиске задач:", error);

    res.status(500).json({
      success: false,
      message: "Ошибка сервера при поиске задач",
      error: error.message
    });

  }
};

const getTaskById = async (req, res) => {
  try {

    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении задачи',
      error: error.message
    });

  }
};

const createTask = async (req, res) => {
  try {

    const task = await Task.create(req.body);

    const responsibleUser = await User.findByPk(task.responsible_user_id);
    const taskPriority = await TaskPriority.findByPk(task.priority);

    if (responsibleUser?.email) {
      await sendTaskAssignedEmail({
        to: responsibleUser.email,
        task,
        creator_name: req.user.name,
        priority: taskPriority?.name
      });
    }

    res.status(201).json({
      success: true,
      message: 'Задача успешно создана',
      data: task
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании задачи',
      error: error.message
    });

  }
};

const updateTask = async (req, res) => {
  try {

    const { id } = req.params;
    const { comment, ...data } = req.body;

    const result = await updateWithAudit({
      model: Task,
      id,
      data,
      entityType: 'task',
      action: 'task_updated',
      userId: req.user.id,
      comment
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    return res.json({
      success: true,
      message: result.changed
        ? 'Задача успешно обновлена'
        : 'Изменений не обнаружено',
      data: result.instance
    });

  } catch (error) {

    console.error('updateTask error:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении задачи',
      error: error.message
    });

  }
};

const deleteTask = async (req, res) => {
  try {

    const { id } = req.params;
    const taskId = Number(id);

    const deleted = await Task.destroy({
      where: { id: taskId }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Задача успешно удалена'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении задачи',
      error: error.message
    });

  }
};

module.exports = {
  getAllTasks,
  searchTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};