express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllDocumentStages } = require('../controllers/documentStageController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DocumentStages
 *   description: API для управления этапами ЮР отдела
 */

/**
 * @swagger
 * /api/documentStages/gets:
 *   get:
 *     summary: Получить список этапов ЮР отдела
 *     tags: [DocumentStages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список этапов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllDocumentStages);

module.exports = router;