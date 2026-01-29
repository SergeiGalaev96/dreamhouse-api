express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllDocumentStatuses } = require('../controllers/documentStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DocumentStatuses
 *   description: API для управления статусами документа
 */

/**
 * @swagger
 * /api/documentStatuses/gets:
 *   get:
 *     summary: Получить список статусов документа
 *     tags: [DocumentStatuses]
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
router.get('/gets', authenticateToken, getAllDocumentStatuses);

module.exports = router;