const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllServices,
  searchServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: API для управления услугами
 */


/**
 * @swagger
 * /api/services/gets:
 *   get:
 *     summary: Получение списка услуг
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список услуг
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllServices);


/**
 * @swagger
 * /api/services/search:
 *   post:
 *     summary: Поиск услуг
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *               service_type:
 *                 type: integer
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Результат поиска
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchServices);


/**
 * @swagger
 * /api/services/getById/{id}:
 *   get:
 *     summary: Получение услуги по ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Данные услуги
 *       404:
 *         description: Услуга не найдена
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getServiceById);


/**
 * @swagger
 * /api/services/create:
 *   post:
 *     summary: Создание услуги
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - service_type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Монтаж фасада
 *               service_type:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Услуга создана
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 10, 11, 4), createService);


/**
 * @swagger
 * /api/services/update/{id}:
 *   put:
 *     summary: Обновление услуги
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Услуга обновлена
 *       404:
 *         description: Услуга не найдена
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 10, 11, 4), updateService);


/**
 * @swagger
 * /api/services/delete/{id}:
 *   delete:
 *     summary: Удаление услуги
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Услуга удалена
 *       404:
 *         description: Услуга не найдена
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 10, 11, 4), deleteService);

module.exports = router;
