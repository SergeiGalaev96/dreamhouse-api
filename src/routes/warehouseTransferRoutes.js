const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  searchWarehouseTransfers,
  getWarehouseTransferById,
  createWarehouseTransfer,
  signWarehouseTransfer,
  rejectWarehouseTransfer
} = require('../controllers/warehouseTransferController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: WarehouseTransfers
 *     description: Накладные на перемещение материалов между складами
 *
 * components:
 *   schemas:
 *     WarehouseTransferItemInput:
 *       type: object
 *       required:
 *         - material_id
 *         - unit_of_measure
 *         - quantity
 *       properties:
 *         material_id:
 *           type: integer
 *           example: 12
 *         unit_of_measure:
 *           type: integer
 *           example: 1
 *         quantity:
 *           type: number
 *           format: double
 *           example: 25.5
 *
 *     WarehouseTransferItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         warehouse_transfer_id:
 *           type: integer
 *           example: 10
 *         material_id:
 *           type: integer
 *           example: 12
 *         unit_of_measure:
 *           type: integer
 *           example: 1
 *         quantity:
 *           type: number
 *           format: double
 *           example: 25.5
 *         material:
 *           type: object
 *           nullable: true
 *           description: Материал, если включен association `material`
 *           properties:
 *             id:
 *               type: integer
 *               example: 12
 *             name:
 *               type: string
 *               example: Бетон М-100
 *         created_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         updated_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         deleted:
 *           type: boolean
 *           example: false
 *
 *     WarehouseTransfer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         posted_at:
 *           type: string
 *           format: date-time
 *           description: Дата создания, при проведении перезаписывается датой проведения
 *         from_warehouse_id:
 *           type: integer
 *           example: 3
 *         to_warehouse_id:
 *           type: integer
 *           example: 5
 *         created_user_id:
 *           type: integer
 *           example: 8
 *         status:
 *           type: integer
 *           description: 1 Черновик, 2 Подписан отправителем, 3 Подписан получателем, 4 Проведен, 5 Отклонен
 *           example: 1
 *         comment:
 *           type: string
 *           nullable: true
 *           example: Перемещение между складами
 *         sender_signed:
 *           type: boolean
 *           example: false
 *         sender_signed_user_id:
 *           type: integer
 *           nullable: true
 *         sender_signed_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         receiver_signed:
 *           type: boolean
 *           example: false
 *         receiver_signed_user_id:
 *           type: integer
 *           nullable: true
 *         receiver_signed_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WarehouseTransferItem'
 *
 *     WarehouseTransferResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Накладная на перемещение создана
 *         data:
 *           $ref: '#/components/schemas/WarehouseTransfer'
 *
 *     WarehouseTransferListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WarehouseTransfer'
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
 *               example: 25
 *             pages:
 *               type: integer
 *               example: 3
 *             hasNext:
 *               type: boolean
 *               example: true
 *             hasPrev:
 *               type: boolean
 *               example: false
 *
 *     WarehouseTransferErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Ошибка сервера
 *         error:
 *           type: string
 *           example: Подробности ошибки
 */

/**
 * @swagger
 * /api/warehouseTransfers/search:
 *   post:
 *     summary: Поиск накладных на перемещение
 *     tags: [WarehouseTransfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               warehouse_id:
 *                 type: integer
 *                 description: Склад отправителя или получателя
 *                 example: 3
 *               status:
 *                 type: integer
 *                 description: Фильтр по статусу
 *                 example: 1
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Список накладных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferListResponse'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferErrorResponse'
 */
router.post('/search', authenticateToken, searchWarehouseTransfers);

/**
 * @swagger
 * /api/warehouseTransfers/getById/{id}:
 *   get:
 *     summary: Получить накладную по ID
 *     tags: [WarehouseTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     responses:
 *       200:
 *         description: Данные накладной
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferResponse'
 *       404:
 *         description: Накладная не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getWarehouseTransferById);

/**
 * @swagger
 * /api/warehouseTransfers/create:
 *   post:
 *     summary: Создать накладную на перемещение
 *     tags: [WarehouseTransfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_warehouse_id
 *               - to_warehouse_id
 *               - items
 *             properties:
 *               from_warehouse_id:
 *                 type: integer
 *                 example: 3
 *               to_warehouse_id:
 *                 type: integer
 *                 example: 5
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 example: Перемещение материалов на другой объект
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   $ref: '#/components/schemas/WarehouseTransferItemInput'
 *                 example:
 *                   - material_id: 12
 *                     unit_of_measure: 1
 *                     quantity: 25.5
 *                   - material_id: 18
 *                     unit_of_measure: 2
 *                     quantity: 10
 *     responses:
 *       201:
 *         description: Накладная создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferResponse'
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Один из складов не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createWarehouseTransfer);

/**
 * @swagger
 * /api/warehouseTransfers/sign/{id}:
 *   post:
 *     summary: Подписать накладную отправителем или получателем
 *     description: После подписи обеих сторон накладная автоматически проводится, меняет остатки складов и создает движение материала.
 *     tags: [WarehouseTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - side
 *             properties:
 *               side:
 *                 type: string
 *                 enum: [sender, receiver]
 *                 example: sender
 *     responses:
 *       200:
 *         description: Накладная подписана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferResponse'
 *       400:
 *         description: Некорректная сторона подписи или накладная завершена
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Накладная не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.post('/sign/:id', authenticateToken, signWarehouseTransfer);

/**
 * @swagger
 * /api/warehouseTransfers/reject/{id}:
 *   post:
 *     summary: Отклонить накладную на перемещение
 *     tags: [WarehouseTransfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 10
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 example: Ошибка в количестве
 *     responses:
 *       200:
 *         description: Накладная отклонена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WarehouseTransferResponse'
 *       400:
 *         description: Накладная уже завершена
 *       403:
 *         description: Недостаточно прав
 *       404:
 *         description: Накладная не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.post('/reject/:id', authenticateToken, rejectWarehouseTransfer);

module.exports = router;
