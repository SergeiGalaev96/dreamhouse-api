express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllMaterialRequestItemTypes } = require('../controllers/materialRequestItemTypeController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialRequestItemTypes
 *   description: API для типами записей в заявке на материалы
 */

/**
 * @swagger
 * /api/materialRequestItemTypes/gets:
 *   get:
 *     summary: Получить список
 *     tags: [MaterialRequestItemTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialRequestItemTypes);

module.exports = router;