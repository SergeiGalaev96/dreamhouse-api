express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllMaterialWriteOffStatuses } = require('../controllers/materialWriteOffStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialWriteOffStatuses
 *   description: API для управления статусами списаний материалов
 */

/**
 * @swagger
 * /api/materialWriteOffStatuses/gets:
 *   get:
 *     summary: Получить список статусов списаний материалов
 *     tags: [MaterialWriteOffStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов списаний материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialWriteOffStatuses);

module.exports = router;
