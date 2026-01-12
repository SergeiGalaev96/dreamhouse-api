const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllCurrencyRates, getCurrencyRatesByDate } = require('../controllers/currencyRatesController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: CurrencyRates
 *   description: API для управления Курсами валют
 */

/**
 * @swagger
 * /api/currencyRates/gets:
 *   get:
 *     summary: Получить список Курсов валют
 *     tags: [CurrencyRates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список Курсов валют
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllCurrencyRates);

/**
 * @swagger
 * /api/currencyRates/getByDate/{date}:
 *   get:
 *     summary: Получить список Курсов валют за определенный день
 *     tags: [CurrencyRates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *            type: string
 *            format: date
 *         description: Дата
 *         example: 2025-12-29
 *     responses:
 *       200:
 *         description: Список Курсов валют
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getByDate/:date', authenticateToken, getCurrencyRatesByDate);

module.exports = router;