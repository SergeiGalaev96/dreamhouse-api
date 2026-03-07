const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
  getSupplierRatingSummary,
  getAllSupplierRatings,
  searchSupplierRatings,
  getSupplierRatingById,
  createSupplierRating,
  updateSupplierRating,
  deleteSupplierRating
} = require('../controllers/supplierRatingController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SupplierRating
 *   description: API для управления рейтингом поставщиков
 */

/**
 * @swagger
 * /api/supplierRating/rating/{supplier_id}:
 *   get:
 *     summary: Получение среднего рейтинга поставщика
 *     tags: [SupplierRating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supplier_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Поставщика
 *     responses:
 *       200:
 *         description: Средний рейтинг поставщика
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/rating/:supplier_id', authenticateToken, getSupplierRatingSummary);

/**
 * @swagger
 * /api/supplierRating/gets:
 *   get:
 *     summary: Получение списка рейтингов поставщиков
 *     tags: [SupplierRating]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список рейтингов поставщиков
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllSupplierRatings);


/**
 * @swagger
 * /api/supplierRating/search:
 *   post:
 *     summary: Поиск рейтингов поставщиков
 *     description: Выполняет поиск рейтингов поставщиков
 *     tags:
 *       - SupplierRating
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplier_id:
 *                 type: integer
 *                 example: 5
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск рейтингов
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchSupplierRatings);


/**
 * @swagger
 * /api/supplierRating/getById/{id}:
 *   get:
 *     summary: Получение рейтинга поставщика по ID
 *     tags: [SupplierRating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID рейтинга
 *     responses:
 *       200:
 *         description: Данные рейтинга
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Рейтинг не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getSupplierRatingById);


/**
 * @swagger
 * /api/supplierRating/create:
 *   post:
 *     summary: Создание рейтинга поставщика
 *     tags: [SupplierRating]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplier_id
 *             properties:
 *               supplier_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID поставщика
 *
 *               quality:
 *                 type: integer
 *                 example: 4
 *                 description: Оценка качества
 *
 *               time:
 *                 type: integer
 *                 example: 5
 *                 description: Оценка сроков поставки
 *
 *               price:
 *                 type: integer
 *                 example: 3
 *                 description: Оценка цены
 *     responses:
 *       201:
 *         description: Рейтинг поставщика успешно создан
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createSupplierRating);


/**
 * @swagger
 * /api/supplierRating/update/{id}:
 *   put:
 *     summary: Обновление рейтинга поставщика
 *     tags: [SupplierRating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID рейтинга
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quality:
 *                 type: integer
 *                 example: 4
 *
 *               time:
 *                 type: integer
 *                 example: 5
 *
 *               price:
 *                 type: integer
 *                 example: 3
 *
 *               comment:
 *                 type: string
 *                 example: "Обновление оценки"
 *     responses:
 *       200:
 *         description: Рейтинг успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Рейтинг не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateSupplierRating);


/**
 * @swagger
 * /api/supplierRating/delete/{id}:
 *   delete:
 *     summary: Удаление рейтинга поставщика
 *     tags: [SupplierRating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID рейтинга
 *     responses:
 *       200:
 *         description: Рейтинг успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Рейтинг не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteSupplierRating);

module.exports = router;