const { Op } = require('sequelize');
const { sequelize, } = require('../models');
const Notification = require("../models/Notification");

const getUnreadNotificationsCount = async (req, res) => {
  try {

    const count = await Notification.count({
      where: {
        user_id: req.user.id,
        is_read: false,
        deleted: false
      }
    });

    res.json({
      success: true,
      unread_count: count
    });

  } catch (error) {

    console.error('Ошибка получения количества уведомлений:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });

  }
};

const searchNotifications = async (req, res) => {
  try {

    const {
      is_read,
      type,
      page = 1,
      size = 10
    } = req.body;

    const offset = (page - 1) * size;

    const whereClause = {
      deleted: false,
      user_id: req.user.id
    };

    if (is_read !== undefined) {
      whereClause.is_read = is_read;
    }

    if (type) {
      whereClause.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      limit: Number(size),
      offset: Number(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: Number(size),
        total: count,
        pages: Math.ceil(count / size),
        hasNext: page * size < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {

    console.error('Ошибка поиска уведомлений:', error);

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске уведомлений',
      error: error.message
    });

  }
};

const markNotificationAsRead = async (req, res) => {
  try {

    const { id } = req.params;

    const [updated] = await Notification.update(
      { is_read: true },
      {
        where: {
          id,
          user_id: req.user.id
        }
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Уведомление не найдено'
      });
    }

    res.json({
      success: true,
      message: 'Уведомление отмечено как прочитанное'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });

  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: req.user.id,
          is_read: false
        }
      }
    );

    res.json({
      success: true,
      message: 'Все уведомления отмечены как прочитанные'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });

  }
};

const deleteNotification = async (req, res) => {
  try {

    const { id } = req.params;

    const [updated] = await Notification.update(
      { deleted: true },
      {
        where: {
          id,
          user_id: req.user.id
        }
      }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Уведомление не найдено'
      });
    }

    res.json({
      success: true,
      message: 'Уведомление удалено'
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });

  }
};

module.exports = {
  getUnreadNotificationsCount,
  searchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};