express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllCurrencies } = require('../controllers/currenciesController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Currencies
 *   description: API для управления Валютами
 */

/**
 * @swagger
 * /api/currencies/gets:
 *   get:
 *     summary: Получить список валют
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список валют
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllCurrencies);

module.exports = router;