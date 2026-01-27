express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllMaterialMovementStatuses } = require('../controllers/materialMovementStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialMovementStatuses
 *   description: API для управления Статусами транзакций материалов
 */

/**
 * @swagger
 * /api/materialMovementStatuses/gets:
 *   get:
 *     summary: Получить список статусов транзакций материалов
 *     tags: [MaterialMovementStatuses]
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
router.get('/gets', authenticateToken, getAllMaterialMovementStatuses);

module.exports = router;