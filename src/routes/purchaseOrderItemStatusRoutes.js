express = require('express');
const { authenticateToken} = require('../middleware/auth');
const {
    getAllPurchaseOrderItemStatuses,
} = require('../controllers/purchaseOrderItemStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PurchaseOrderItemStatuses
 *   description: API для управления статусами элементов в заявках на закуп
 */

/**
 * @swagger
 * /api/purchaseOrderItemStatuses/gets:
 *   get:
 *     summary: Получить список статусов элементов в заявках на закуп
 *     tags: [PurchaseOrderItemStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов элементов в заявках на закуп
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllPurchaseOrderItemStatuses);
module.exports = router;