express = require('express');
const { authenticateToken} = require('../middleware/auth');
const {
    getAllPurchaseOrderStatuses,
} = require('../controllers/purchaseOrderStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PurchaseOrderStatuses
 *   description: API для управления статусами заявок на закуп
 */

/**
 * @swagger
 * /api/purchaseOrderStatuses/gets:
 *   get:
 *     summary: Получить список статусов заявок на закуп
 *     tags: [PurchaseOrderStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов заявок на закуп
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllPurchaseOrderStatuses);
module.exports = router;