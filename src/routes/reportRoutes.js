const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { getWorkPerformedReport } = require('../controllers/reportController');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API для отчетов
 */

/**
 * @swagger
 * /api/reports/workPerformed/{id}:
 *   get:
 *     summary: Отчет по акту выполненных работ
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта
 *     responses:
 *       200:
 *         description: Данные отчета
 *       404:
 *         description: Акт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/workPerformed/:id', authenticateToken, getWorkPerformedReport);

module.exports = router;