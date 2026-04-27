const { Op, Sequelize } = require("sequelize");
const updateWithAudit = require('../utils/updateWithAudit');
const { sendTaskAssignedEmail, sendTaskStatusChangedEmail } = require('../utils/mailer');
const Notification = require('../models/Notification');
const { getIO } = require('../../socket');
const Task = require('../models/Task');
const TaskPriority = require('../models/TaskPriority');
const TaskStatus = require('../models/TaskStatus');
const User = require('../models/User');
const { sendPushToUser } = require('../utils/pushNotifications');

const TASK_STATUS_ACQUAINTED = 2;
const TASK_STATUS_IN_PROGRESS = 3;
const TASK_STATUS_DONE = 4;
const TASK_STATUS_CANCELLED = 5;

const getTaskStatusNotificationTitle = (status) => {
  switch (Number(status)) {
    case TASK_STATUS_ACQUAINTED:
      return 'С задачей ознакомлен';
    case TASK_STATUS_IN_PROGRESS:
      return 'Задача в работе';
    case TASK_STATUS_DONE:
      return 'Задача выполнена';
    case TASK_STATUS_CANCELLED:
      return 'Задача отменена';
    default:
      return 'Статус задачи изменен';
  }
};

const getTaskStatusNotificationTitleSafe = (status) => {
  switch (Number(status)) {
    case TASK_STATUS_ACQUAINTED:
      return '\u0421 \u0437\u0430\u0434\u0430\u0447\u0435\u0439 \u043e\u0437\u043d\u0430\u043a\u043e\u043c\u043b\u0435\u043d';
    case TASK_STATUS_IN_PROGRESS:
      return '\u0417\u0430\u0434\u0430\u0447\u0430 \u0432 \u0440\u0430\u0431\u043e\u0442\u0435';
    case TASK_STATUS_DONE:
      return '\u0417\u0430\u0434\u0430\u0447\u0430 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0430';
    case TASK_STATUS_CANCELLED:
      return '\u0417\u0430\u0434\u0430\u0447\u0430 \u043e\u0442\u043c\u0435\u043d\u0435\u043d\u0430';
    default:
      return '\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u0434\u0430\u0447\u0438 \u0438\u0437\u043c\u0435\u043d\u0435\u043d';
  }
};

const createNotificationAndEmit = async ({ userId, type, title, message, entityType, entityId }) => {
  if (!userId) return;

  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    message,
    entity_type: entityType,
    entity_id: entityId,
    is_read: false,
    deleted: false
  });

  const unreadCount = await Notification.count({
    where: {
      user_id: userId,
      is_read: false,
      deleted: false
    }
  });

  try {
    const io = getIO();
    const room = `user_${userId}`;
    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    const notificationPayload = notification.toJSON ? notification.toJSON() : notification;

    console.log(`[notifications] emit ${type} to ${room}; sockets=${roomSize}; notification=${notification.id}`);

    io.to(room).emit('notifications:count', {
      count: unreadCount
    });
    io.to(room).emit('notifications:new', {
      notification: notificationPayload,
      count: unreadCount
    });
  } catch (socketError) {
    console.error('notification emit error:', socketError.message);
  }
};

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
      user_id,
      project_id,
      statuses,
      page = 1,
      size = 10
    } = req.body;

    const limit = Number(size);
    const offset = (Number(page) - 1) * limit;

    const baseWhereClause = {
      deleted: false
    };

    const baseAndConditions = [];
    const currentUserId = Number(req.user?.id) || null;
    const currentUserRoleId = Number(req.user?.role_id) || null;
    const requestedUserId = user_id != null ? Number(user_id) : null;
    const isAdmin = currentUserRoleId === 1;

    /* =========================
       SEARCH
    ========================= */

    if (search && search.trim() !== "") {

      const s = `%${search.trim()}%`;

      baseAndConditions.push({
        [Op.or]: [
          { title: { [Op.iLike]: s } },
          { description: { [Op.iLike]: s } }
        ]
      });

    }

    /* =========================
       USER
    ========================= */

    const effectiveUserId = isAdmin ? requestedUserId : currentUserId;

    if (effectiveUserId) {
      baseAndConditions.push({
        [Op.or]: [
          { created_user_id: effectiveUserId },
          { responsible_user_id: effectiveUserId }
        ]
      });
    }

    /* =========================
       PROJECT
    ========================= */

    if (project_id) {
      baseAndConditions.push({
        project_id
      });
    }

    /* =========================
       STATUSES
    ========================= */

    const whereClause = {
      ...baseWhereClause
    };

    const listAndConditions = [...baseAndConditions];

    const statusFilter = Array.isArray(statuses)
      ? statuses
      : statuses != null
        ? [statuses]
        : null;

    if (statusFilter) {
      listAndConditions.push({
        status: {
          [Op.in]: statusFilter
        }
      });
    }

    if (listAndConditions.length > 0) {
      whereClause[Op.and] = listAndConditions;
    }

    /* =========================
       QUERY DATA
    ========================= */

    const { count, rows } = await Task.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      subQuery: false,
      order: [["id", "DESC"]]
    });

    /* =========================
       QUERY STATS (без пагинации)
    ========================= */

    const statsWhereClause = {
      ...baseWhereClause
    };

    if (baseAndConditions.length > 0) {
      statsWhereClause[Op.and] = [...baseAndConditions];
    }

    const groupedStatusStats = await Task.findAll({
      where: statsWhereClause,
      attributes: [
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
      ],
      group: ["status"],
      raw: true
    });

    const statusCounts = groupedStatusStats.reduce((acc, row) => {
      acc[Number(row.status)] = Number(row.count || 0);
      return acc;
    }, {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    });

    const overdueAndConditions = [...baseAndConditions, {
      deadline: {
        [Op.lt]: Sequelize.fn("NOW")
      }
    }, {
      status: {
        [Op.notIn]: [4, 5]
      }
    }];

    const overdueWhereClause = {
      ...baseWhereClause
    };

    if (overdueAndConditions.length > 0) {
      overdueWhereClause[Op.and] = overdueAndConditions;
    }

    const overdueCount = await Task.count({
      where: overdueWhereClause
    });

    const total = Array.isArray(count) ? count.length : count;

    res.json({
      success: true,
      data: rows,
      stats: {
        statuses: statusCounts,
        overdueCount
      },
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
      await createNotificationAndEmit({
        userId: task.responsible_user_id,
        type: 'task_assigned',
        title: 'Назначена новая задача',
        message: `Вам назначена задача: ${task.title}`,
        entityType: 'task',
        entityId: task.id
      });
    }

    if (responsibleUser?.email) {
      await sendTaskAssignedEmail({
        to: responsibleUser.email,
        task,
        creator_name: creator.first_name + " " + creator.last_name,
        priority: taskPriority?.name
      });
    }

    if (task.responsible_user_id) {
      await sendPushToUser({
        userId: task.responsible_user_id,
        title: 'Назначена новая задача',
        body: task.title,
        data: {
          type: 'task_assigned',
          taskId: task.id,
          entityType: 'task'
        }
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

    const oldStatus = Number(taskBefore.status);
    const newStatus = Number(taskAfter.status);

    if (oldStatus !== newStatus) {

      const creatorId = taskAfter.created_user_id || taskBefore.created_user_id;
      const responsibleId = taskAfter.responsible_user_id || taskBefore.responsible_user_id;
      const recipientId =
        newStatus === TASK_STATUS_CANCELLED
          ? responsibleId
          : [TASK_STATUS_ACQUAINTED, TASK_STATUS_IN_PROGRESS].includes(newStatus)
            ? creatorId
            : creatorId;

      console.log(`[tasks] status changed task=${taskAfter.id}; ${oldStatus}->${newStatus}; recipient=${recipientId}; creator=${creatorId}; responsible=${responsibleId}`);

      const creator = await User.findByPk(creatorId);
      const responsible = await User.findByPk(responsibleId);
      const taskPriority = await TaskPriority.findByPk(taskAfter.priority);
      const taskStatus = await TaskStatus.findByPk(taskAfter.status);
      const notificationRecipient = recipientId === responsibleId ? responsible : creator;

      if (notificationRecipient?.email) {
        await sendTaskStatusChangedEmail({
          to: notificationRecipient.email,
          task: taskAfter,
          creator_name: creator ? `${creator.first_name} ${creator.last_name}` : '',
          responsible_user_name: responsible ? `${responsible.first_name} ${responsible.last_name}` : '',
          priority: taskPriority?.name,
          status: taskStatus?.name
        });
      }

      if (recipientId) {
        const notificationTitle = getTaskStatusNotificationTitleSafe(newStatus);
        const notificationMessage = `${notificationTitle}: "${taskAfter.title}"`;
        await createNotificationAndEmit({
          userId: recipientId,
          type: 'task_updated',
          title: 'Статус задачи изменен',
          message: `Статус задачи "${taskAfter.title}" изменен на "${taskStatus?.name || taskAfter.status}"`,
          title: notificationTitle,
          message: notificationMessage,
          entityType: 'task',
          entityId: taskAfter.id
        });

        await sendPushToUser({
          userId: recipientId,
          title: notificationTitle,
          body: taskAfter.title,
          data: {
            type: 'task_updated',
            taskId: String(taskAfter.id),
            entityType: 'task',
            status: String(newStatus)
          }
        });
      }

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
