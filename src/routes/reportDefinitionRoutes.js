const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getActiveReportDefinitions } = require('../controllers/reportDefinitionController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ReportDefinitions
 *   description: Реестр доступных отчетов и параметров формы
 */

/**
 * @swagger
 * /api/reportDefinitions/gets:
 *   get:
 *     summary: Получить активные отчеты
 *     tags: [ReportDefinitions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список активных отчетов
 */
router.get('/gets', authenticateToken, getActiveReportDefinitions);

module.exports = router;
