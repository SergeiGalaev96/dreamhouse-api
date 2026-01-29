const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAuditHistory } = require('../controllers/auditLogController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AuditLog
 *   description: История изменений (аудит)
 */

/**
 * @swagger
 * /api/auditLog:
 *   get:
 *     summary: Получить историю изменений сущности
 *     tags: [AuditLog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: entity_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: size
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: История изменений
 *       400:
 *         description: Некорректные параметры запроса
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */

router.get('/', authenticateToken, getAuditHistory);
module.exports = router;
