express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllWorkPerformedItemTypes } = require('../controllers/workPerformedItemTypeController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkPerformedItemTypes
 *   description: API для управления типов расходов АВР
 */

/**
 * @swagger
 * /api/workPerformedItemTypes/gets:
 *   get:
 *     summary: Получить список типов расходов АВР
 *     tags: [WorkPerformedItemTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список типов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllWorkPerformedItemTypes);

module.exports = router;