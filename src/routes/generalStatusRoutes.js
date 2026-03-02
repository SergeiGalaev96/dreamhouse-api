express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllGeneralStatuses } = require('../controllers/generalStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GeneralStatuses
 *   description: API для управления статусами
 */

/**
 * @swagger
 * /api/generalStatuses/gets:
 *   get:
 *     summary: Получить список статусов
 *     tags: [GeneralStatuses]
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
router.get('/gets', authenticateToken, getAllGeneralStatuses);

module.exports = router;