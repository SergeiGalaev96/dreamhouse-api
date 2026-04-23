const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  searchWarehouseTransferItems,
  getWarehouseTransferItemById
} = require('../controllers/warehouseTransferItemController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: WarehouseTransferItems
 *     description: Позиции накладных на перемещение материалов
 *
 * components:
 *   schemas:
 *     WarehouseTransferItemSearchResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WarehouseTransferItem'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             size:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 2
 *             pages:
 *               type: integer
 *               example: 1
 *             hasNext:
 *               type: boolean
 *               example: false
 *             hasPrev:
 *               type: boolean
 *               example: false
 *
 *     WarehouseTransferItemResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/WarehouseTransferItem'
 */

/**
 * @swagger
 * /api/warehouseTransferItems/search:
 *   post:
 *     summary: Поиск позиций накладных перемещения
 *     tags: [WarehouseTransferItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               warehouse_transfer_id:
 *                 type: integer
 *                 description: ID накладной перемещения
 *                 example: 10
 *               material_id:
 *                 type: integer
 *                 description: ID материала
 *                 example: 12
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Список позиций
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferItemSearchResponse'
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchWarehouseTransferItems);

/**
 * @swagger
 * /api/warehouseTransferItems/getById/{id}:
 *   get:
 *     summary: Получить позицию накладной перемещения по ID
 *     tags: [WarehouseTransferItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Данные позиции
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferItemResponse'
 *       404:
 *         description: Позиция не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getWarehouseTransferItemById);

module.exports = router;
