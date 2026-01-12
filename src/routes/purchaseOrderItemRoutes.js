express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
    getAllPurchaseOrderItems,
    searchPurchaseOrderItems,
    receivePurchaseOrderItems,
    getPurchaseOrderItemById,
    createPurchaseOrderItem,
    updatePurchaseOrderItem,
    deletePurchaseOrderItem
} = require('../controllers/purchaseOrderItemController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PurchaseOrderItems
 *   description: API для управления списком материалов в заявках на закуп
 */

/**
 * @swagger
 * /api/purchaseOrderItems/gets:
 *   get:
 *     summary: Получить список материалов в заявках на закуп
 *     tags: [PurchaseOrderItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список материалов в заявках на закуп
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllPurchaseOrderItems);

/**
 * @swagger
 * /api/purchaseOrderItems/search:
 *   post:
 *     summary: Поиск материалов в заявках на закуп
 *     description: Выполняет поиск материалов в заявках на закуп
 *     tags:
 *       - PurchaseOrderItems
 *     security:
 *       - bearerAuth: []
 *     orderBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purchase_order_id:
 *                 type: integer
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск материалов в заявках на закуп
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchPurchaseOrderItems);
/**
 * @swagger
 * /api/purchaseOrderItems/receive:
 *   post:
 *     summary: Приёмка материалов по позициям закупки
 *     tags: [PurchaseOrderItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 description: Список позиций для приёмки
 *                 items:
 *                   type: object
 *                   required:
 *                     - purchase_order_item_id
 *                     - delivered_quantity
 *                   properties:
 *                     purchase_order_item_id:
 *                       type: integer
 *                       example: 15
 *                       description: ID позиции закупки
 *                     delivered_quantity:
 *                       type: number
 *                       example: 5
 *                       description: Фактически доставленное количество
 *                     comment:
 *                       type: string
 *                       example: "Часть товара повреждена"
 *                       description: Комментарий по приёмке
 *     responses:
 *       200:
 *         description: Приёмка выполнена
 *       400:
 *         description: Ошибка запроса
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/receive', authenticateToken, receivePurchaseOrderItems);


/**
 * @swagger
 * /api/purchaseOrderItems/getById/{id}:
 *   get:
 *     summary: Получить материал в заявке на закуп на закуп по ID
 *     tags: [PurchaseOrderItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала в заявке на закуп
 *     responses:
 *       200:
 *         description: Материал в заявке на закуп
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал в заявке на закуп не найден
 *       500:
 *         description: Ошибка сервера
 */

router.get('/getById/:id', authenticateToken, getPurchaseOrderItemById);

/**
 * @swagger
 * /api/purchaseOrderItems/create:
 *   post:
 *     summary: Создать материал в заявке на закуп
 *     tags: [PurchaseOrderItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchase_order_id
 *               - material_request_item_id
 *               - material_id
 *               - material_type
 *               - quantity
 *               - price
 *               - summ
 *             properties:
 *               purchase_order_id:
 *                 type: integer
 *               material_request_item_id:
 *                 type: integer
 *               material_id:
 *                 type: integer
 *               material_type:
 *                 type: integer
 *               unit_of_measure:
 *                 type: integer
 *               quantity:
 *                 type: number
 *                 format: double
 *               price:
 *                 type: number
 *                 format: double
 *               summ:
 *                 type: number
 *                 format: double
 *     responses:
 *       201:
 *         description: Материал в заявке на закуп создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createPurchaseOrderItem);

/**
 * @swagger
 * /api/purchaseOrderItems/update/{id}:
 *   put:
 *     summary: Обновить материал в заявке на закуп
 *     tags: [PurchaseOrderItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала в заявке на закуп
 *     orderBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchase_order_id
 *             properties:
 *               purchase_order_id:
 *                 type: integer
 *               purchase_type:
 *                 type: integer
 *               purchase_id:
 *                 type: integer
 *               unit_of_measure:
 *                 type: number
 *                 format: double
 *               quantity:
 *                 type: number
 *                 format: double
 *               price:
 *                 type: number
 *                 format: double
 *               summ:
 *                 type: number
 *                 format: double
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Материал в заявке на закуп обновлён
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал в заявке на закуп не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updatePurchaseOrderItem);

/**
 * @swagger
 * /api/purchaseOrderItems/delete/{id}:
 *   delete:
 *     summary: Удалить материал в заявке на закуп
 *     tags: [PurchaseOrderItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала в заявке на закуп
 *     responses:
 *       200:
 *         description: Материал в заявке на закуп удалён
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал в заявке на закуп не найден
 *       500:
 *         description: Ошибка сервера
 */

router.delete('/delete/:id', authenticateToken, authorizeRole(1), deletePurchaseOrderItem);

module.exports = router;