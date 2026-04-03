const { Op, Sequelize } = require("sequelize");
const updateWithAudit = require('../utils/updateWithAudit');
const { sendTaskAssignedEmail, sendTaskStatusChangedEmail } = require('../utils/mailer');
const Notification = require('../models/Notification');
const { getIO } = require('../../socket');
const Task = require('../models/Task');
const TaskPriority = require('../models/TaskPriority');
const TaskStatus = require('../models/TaskStatus');
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

    const {
      search,
      project_id,
      statuses,
      page = 1,
      size = 10
    } = req.body;

    const limit = Number(size);
    const offset = (Number(page) - 1) * limit;

    const whereClause = {};

    /* =========================
       SEARCH
    ========================= */

    if (search && search.trim() !== "") {

      const s = `%${search.trim()}%`;

      whereClause[Op.or] = [
        { title: { [Op.iLike]: s } },
        { description: { [Op.iLike]: s } }
      ];

    }

    /* =========================
       PROJECT
    ========================= */

    if (project_id) {
      whereClause.project_id = project_id;
    }

    /* =========================
       STATUSES
    ========================= */

    const statusFilter = Array.isArray(statuses)
      ? statuses
      : statuses != null
        ? [statuses]
        : null;

    if (statusFilter) {
      whereClause.status = {
        [Op.in]: statusFilter
      };
    }

    /* =========================
       QUERY
    ========================= */

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

    const task = await Task.create({
      ...req.body,
      created_user_id: req.user.id
    });

    const responsibleUser = await User.findByPk(task.responsible_user_id);
    const creator = await User.findByPk(req.user.id);

    const taskPriority = await TaskPriority.findByPk(task.priority);

    if (task.responsible_user_id) {
      await Notification.create({
        user_id: task.responsible_user_id,
        type: 'task_assigned',
        title: 'Назначена новая задача',
        message: `Вам назначена задача: ${task.title}`,
        entity_type: 'task',
        entity_id: task.id,
        is_read: false
      });

      const unreadCount = await Notification.count({
        where: {
          user_id: task.responsible_user_id,
          is_read: false,
          deleted: false
        }
      });

      try {
        const io = getIO();
        io.to(`user_${task.responsible_user_id}`).emit('notifications:count', {
          count: unreadCount
        });
      } catch (socketError) {
        console.error('notifications:count emit error:', socketError.message);
      }
    }

    if (responsibleUser?.email) {
      await sendTaskAssignedEmail({
        to: responsibleUser.email,
        task,
        creator_name: creator.first_name + " " + creator.last_name,
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

    /* ============================================================
       Получаем задачу ДО обновления
    ============================================================ */

    const taskBefore = await Task.findByPk(id);

    if (!taskBefore) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }

    /* ============================================================
       Обновление
    ============================================================ */

    const result = await updateWithAudit({
      model: Task,
      id,
      data,
      entityType: 'task',
      action: 'task_updated',
      userId: req.user.id,
      comment
    });

    const taskAfter = result.instance;

    /* ============================================================
       Проверяем изменение статуса
    ============================================================ */

    const oldStatus = taskBefore.status;
    const newStatus = taskAfter.status;

    if (oldStatus !== newStatus) {

      const creator = await User.findByPk(taskAfter.created_user_id);
      const responsible = await User.findByPk(taskAfter.responsible_user_id);
      const taskPriority = await TaskPriority.findByPk(taskAfter.priority);
      const taskStatus = await TaskStatus.findByPk(taskAfter.status);
      let toEmail = creator.email;

      if (newStatus === 5 && responsible?.email) {
        toEmail = responsible.email;
      }

      await sendTaskStatusChangedEmail({
        to: toEmail,
        task: taskAfter,
        creator_name: `${creator.first_name} ${creator.last_name}`,
        responsible_user_name: `${responsible.first_name} ${responsible.last_name}`,
        priority: taskPriority?.name,
        status: taskStatus?.name
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
