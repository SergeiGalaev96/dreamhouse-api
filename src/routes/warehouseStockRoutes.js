const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { 
  getAllWarehouseStocks,
  searchWarehouseStocks,
  getWarehouseStockById,
  createWarehouseStock,
  updateWarehouseStock,
  deleteWarehouseStock
} = require('../controllers/warehouseStockController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WarehouseStocks
 *   description: API для управления запасами на складах
 */

/**
 * @swagger
 * /api/warehouseStocks/gets:
 *   get:
 *     summary: Получение списка запасов
 *     tags: [WarehouseStocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список запасов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllWarehouseStocks);

/**
 * @swagger
 * /api/warehouseStocks/search:
 *   post:
 *     summary: Поиск запасов
 *     description: Выполняет поиск запасов
 *     tags:
 *       - WarehouseStocks
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
 *                 example: 1
 *               material_id:
 *                 type: integer
 *                 example: 1
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск запасов
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchWarehouseStocks);

/**
 * @swagger
 * /api/warehouseStocks/getById/{id}:
 *   get:
 *     summary: Получение запаса по ID
 *     tags: [WarehouseStocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID склада
 *     responses:
 *       200:
 *         description: Данные запаса
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Запас не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getWarehouseStockById);

/**
 * @swagger
 * /api/warehouseStocks/create:
 *   post:
 *     summary: Создание нового запаса
 *     tags: [WarehouseStocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouse_id
 *               - material_id
 *             properties:
 *               warehouse_id:
 *                 type: integer
 *               material_id:
 *                 type: integer
 *               quantity:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Склад успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1), createWarehouseStock);

/**
 * @swagger
 * /api/warehouseStocks/update/{id}:
 *   put:
 *     summary: Обновление склада
 *     tags: [WarehouseStocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID склада
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               address:
 *                 type: string
 *               manager_id:
 *                 type: integer
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Склад успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Склад не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1), updateWarehouseStock);

/**
 * @swagger
 * /api/warehouseStocks/delete/{id}:
 *   delete:
 *     summary: Удаление склада
 *     tags: [WarehouseStocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID склада
 *     responses:
 *       200:
 *         description: Склад успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Склад не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1), deleteWarehouseStock);

module.exports = router;