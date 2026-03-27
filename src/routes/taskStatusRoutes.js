express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllTaskStatuses } = require('../controllers/taskStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TaskStatuses
 *   description: API для управления статусами задачи
 */

/**
 * @swagger
 * /api/taskStatuses/gets:
 *   get:
 *     summary: Получить список статусов задачи
 *     tags: [TaskStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllTaskStatuses);

module.exports = router;