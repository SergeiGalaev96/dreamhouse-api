const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { 
  getAllPurchaseOrders,
  searchPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder 
} = require('../controllers/purchaseOrderController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: PurchaseOrders
 *   description: API для управления заявками на закуп материалов
 */

/**
 * @swagger
 * /api/purchaseOrders/gets:
 *   get:
 *     summary: Получение списка заявок на закуп материалов
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Заявки на закуп материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllPurchaseOrders);

/**
 * @swagger
 * /api/purchaseOrders/search:
 *   post:
 *     summary: Поиск и фильтрация заявок на закуп материалов
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *                 default: 1
 *               supplier_id:
 *                 type: integer
 *                 default: 1
 *               created_user_id:
 *                 type: integer
 *                 default: 1
 *               status:
 *                 type: integer
 *                 default: 1
 *               page:
 *                 type: integer
 *                 default: 1
 *               size:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Список заявок на закуп материалов
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchPurchaseOrders);

/**
 * @swagger
 * /api/purchaseOrders/getById/{id}:
 *   get:
 *     summary: Получение заявки на закуп материалов по ID
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки на закуп материалов
 *     responses:
 *       200:
 *         description: Данные заявки на закуп материалов
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Заявка на закуп материалов не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getPurchaseOrderById);

/**
 * @swagger
 * /api/purchaseOrders/create:
 *   post:
 *     summary: Создание заказа на закупку материалов
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - supplier_id
 *               - created_user_id
 *               - items
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID проекта
 *
 *               supplier_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID поставщика
 * 
 *               created_user_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID Снабженца
 *
 *               comment:
 *                 type: string
 *                 example: Закупка по заявке №2
 *                 description: Комментарий к закупке
 *
 *               items:
 *                 type: array
 *                 description: Список закупаемых материалов
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - material_request_item_id
 *                     - material_type
 *                     - material_id
 *                     - unit_of_measure
 *                     - quantity
 *                     - price
 *                     - summ
 *                   properties:
 *                     material_request_item_id:
 *                       type: integer
 *                       example: 3
 *                       description: ID позиции из заявки на материалы
 *
 *                     material_type:
 *                       type: integer
 *                       example: 3
 *                       description: Тип материала
 *
 *                     material_id:
 *                       type: integer
 *                       example: 9
 *                       description: ID материала
 *
 *                     unit_of_measure:
 *                       type: integer
 *                       example: 3
 *                       description: Единица измерения
 *
 *                     quantity:
 *                       type: number
 *                       format: decimal
 *                       example: 50
 *                       description: Количество для закупки
 *
 *                     price:
 *                       type: number
 *                       format: decimal
 *                       example: 100
 *                       description: Цена за единицу
 *
 *                     summ:
 *                       type: number
 *                       format: decimal
 *                       example: 5000
 *                       description: Общая сумма позиции
 *
 *     responses:
 *       201:
 *         description: Заказ на закупку материалов успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createPurchaseOrder);

/**
 * @swagger
 * /api/purchaseOrders/update/{id}:
 *   put:
 *     summary: Обновление заявки на закуп материалов
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки на закуп материалов
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *             properties:
 *               project_id:
 *                 type: integer
 *                 description: ID проекта
 *               status:
 *                 type: integer
 *                 description: ID проекта
 *     responses:
 *       200:
 *         description: Заявкf на закуп материалов успешно обновлена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Заявки на закуп материалов не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updatePurchaseOrder);

/**
 * @swagger
 * /api/purchaseOrders/delete/{id}:
 *   delete:
 *     summary: Удаление заявки на закуп материалов
 *     tags: [PurchaseOrders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки на закуп материалов
 *     responses:
 *       200:
 *         description: Заявка на закуп материалов успешно удалена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Заявки на закуп материалов не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deletePurchaseOrder);

module.exports = router;