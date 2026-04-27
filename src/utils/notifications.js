const Notification = require('../models/Notification');
const { getIO } = require('../../socket');

const getUnreadCount = (userId) => Notification.count({
  where: {
    user_id: userId,
    is_read: false,
    deleted: false
  }
});

const createNotificationAndEmit = async ({
  userId,
  type,
  title,
  message,
  entityType,
  entityId
}) => {
  if (!userId) return null;

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

  const unreadCount = await getUnreadCount(userId);

  try {
    const io = getIO();
    const room = `user_${userId}`;
    const notificationPayload = notification.toJSON ? notification.toJSON() : notification;

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

  return notification;
};

const notifyUsers = async (userIds, payload) => {
  const uniqueUserIds = [...new Set(
    (Array.isArray(userIds) ? userIds : [])
      .map((userId) => Number(userId))
      .filter((userId) => Number.isFinite(userId) && userId > 0)
  )];

  return Promise.allSettled(
    uniqueUserIds.map((userId) =>
      createNotificationAndEmit({
        ...payload,
        userId
      })
    )
  );
};

module.exports = {
  createNotificationAndEmit,
  notifyUsers
};
