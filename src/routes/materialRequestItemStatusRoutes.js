express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllMaterialRequestItemStatuses } = require('../controllers/materialRequestItemStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialRequestItemStatuses
 *   description: API для управления Статусами материалов в заявках
 */

/**
 * @swagger
 * /api/materialRequestItemStatuses/gets:
 *   get:
 *     summary: Получить список статусов материалов в заявках
 *     tags: [MaterialRequestItemStatuses]
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
router.get('/gets', authenticateToken, getAllMaterialRequestItemStatuses);

module.exports = router;