const Notification = require("../models/Notification");
const { getIO } = require('../../socket');

const getUnreadCount = (userId) => Notification.count({
  where: {
    user_id: userId,
    is_read: false,
    deleted: false
  }
});

const emitUnreadNotificationsCount = async (userId) => {
  const count = await getUnreadCount(userId);

  try {
    const io = getIO();
    io.to(`user_${userId}`).emit('notifications:count', { count });
  } catch (socketError) {
    console.error('notification count emit error:', socketError.message);
  }

  return count;
};

const getUnreadNotificationsCount = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);

    res.json({
      success: true,
      unread_count: count
    });
  } catch (error) {
    console.error('get unread notifications count error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error',
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

    const offset = (Number(page) - 1) * Number(size);

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
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        size: Number(size),
        total: count,
        pages: Math.ceil(count / Number(size)),
        hasNext: Number(page) * Number(size) < count,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('search notifications error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error',
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
        message: 'Notification not found'
      });
    }

    const unreadCount = await emitUnreadNotificationsCount(req.user.id);

    res.json({
      success: true,
      unread_count: unreadCount,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
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
          is_read: false,
          deleted: false
        }
      }
    );

    const unreadCount = await emitUnreadNotificationsCount(req.user.id);

    res.json({
      success: true,
      unread_count: unreadCount,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
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
        message: 'Notification not found'
      });
    }

    const unreadCount = await emitUnreadNotificationsCount(req.user.id);

    res.json({
      success: true,
      unread_count: unreadCount,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
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
