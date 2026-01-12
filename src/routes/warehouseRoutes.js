const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
// const { validateWarehouse } = require('../middleware/validation');
const { 
  getAllWarehouses,
  searchWarehouses,
  getWarehouseById, 
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} = require('../controllers/warehouseController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: API для управления складами
 */

/**
 * @swagger
 * /api/warehouses/gets:
 *   get:
 *     summary: Получение списка складов
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список складов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllWarehouses);

/**
 * @swagger
 * /api/warehouses/search:
 *   post:
 *     summary: Поиск складов
 *     description: Выполняет поиск складов
 *     tags:
 *       - Warehouses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 1
 *               manager_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск складов
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchWarehouses);


/**
 * @swagger
 * /api/warehouses/getById/{id}:
 *   get:
 *     summary: Получение склада по ID
 *     tags: [Warehouses]
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
 *         description: Данные склада
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Склад не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getWarehouseById);

/**
 * @swagger
 * /api/warehouses/create:
 *   post:
 *     summary: Создание нового склада
 *     tags: [Warehouses]
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
 *               - name
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
 *       201:
 *         description: Склад успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1), createWarehouse);

/**
 * @swagger
 * /api/warehouses/update/{id}:
 *   put:
 *     summary: Обновление склада
 *     tags: [Warehouses]
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
router.put('/update/:id', authenticateToken, authorizeRole(1), updateWarehouse);

/**
 * @swagger
 * /api/warehouses/delete/{id}:
 *   delete:
 *     summary: Удаление склада
 *     tags: [Warehouses]
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
router.delete('/delete/:id', authenticateToken, authorizeRole(1), deleteWarehouse);

module.exports = router;