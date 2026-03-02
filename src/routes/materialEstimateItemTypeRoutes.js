express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllMaterialEstimateItemTypes } = require('../controllers/materialEstimateItemTypeController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialEstimateItemTypes
 *   description: API для управления типами материалов в смете
 */

/**
 * @swagger
 * /api/materialEstimateItemTypes/gets:
 *   get:
 *     summary: Получить список типов материалов в смете
 *     tags: [MaterialEstimateItemTypes]
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
router.get('/gets', authenticateToken, getAllMaterialEstimateItemTypes);

module.exports = router;