express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllTaskPriorities } = require('../controllers/taskPriorityController.js');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TaskPriorities
 *   description: API для управления приоритетами задачи
 */

/**
 * @swagger
 * /api/taskPriorities/gets:
 *   get:
 *     summary: Получить список приоритетов задачи
 *     tags: [TaskPriorities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список приоритетов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllTaskPriorities);

module.exports = router;