const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllWarehouseTransferStatuses } = require('../controllers/warehouseTransferStatusController');

const router = express.Router();

router.get('/gets', authenticateToken, getAllWarehouseTransferStatuses);

/**
 * @swagger
 * tags:
 *   name: WarehouseTransferStatuses
 *   description: API для управления статусами перемещений
 */

/**
 * @swagger
 * /api/warehouseTransferStatuses/gets:
 *   get:
 *     summary: Получить список статусов перемещений
 *     tags: [WarehouseTransferStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов перемещений
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */

module.exports = router;
