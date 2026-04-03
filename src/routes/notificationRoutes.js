const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const {
  getUnreadNotificationsCount,
  searchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('../controllers/notificationController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API для уведомлений пользователей
 */

/**
 * @swagger
 * /api/notifications/unreadCount:
 *   get:
 *     summary: Получить количество непрочитанных уведомлений
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Количество непрочитанных уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 unread_count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/unreadCount', authenticateToken, getUnreadNotificationsCount);

/**
 * @swagger
 * /api/notifications/search:
 *   post:
 *     summary: Поиск уведомлений
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_read:
 *                 type: boolean
 *                 example: false
 *               type:
 *                 type: string
 *                 example: task_updated
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Список уведомлений
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchNotifications);

/**
 * @swagger
 * /api/notifications/update/{id}:
 *   put:
 *     summary: Отметить уведомление как прочитанное
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Уведомление обновлено
 *       404:
 *         description: Уведомление не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, markNotificationAsRead);

/**
 * @swagger
 * /api/notifications/updateAll:
 *   put:
 *     summary: Отметить все уведомления как прочитанные
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Все уведомления обновлены
 *       500:
 *         description: Ошибка сервера
 */
router.put('/updateAll', authenticateToken, markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/delete/{id}:
 *   delete:
 *     summary: Удаление уведомления
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID уведомления
 *     responses:
 *       200:
 *         description: Уведомление удалено
 *       404:
 *         description: Уведомление не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, deleteNotification);

module.exports = router;