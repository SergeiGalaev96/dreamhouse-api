const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllServiceTypes,
  searchServiceTypes,
  getServiceTypeById,
  createServiceType,
  updateServiceType,
  deleteServiceType
} = require('../controllers/serviceTypeController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ServiceTypes
 *   description: API для управления типами услуг
 */


/**
 * @swagger
 * /api/serviceTypes/gets:
 *   get:
 *     summary: Получение списка типов услуг
 *     tags: [ServiceTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список типов услуг
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllServiceTypes);


/**
 * @swagger
 * /api/serviceTypes/search:
 *   post:
 *     summary: Поиск типов услуг
 *     tags: [ServiceTypes]
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
router.post('/search', authenticateToken, searchServiceTypes);


/**
 * @swagger
 * /api/serviceTypes/getById/{id}:
 *   get:
 *     summary: Получение типа услуги по ID
 *     tags: [ServiceTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID типа услуги
 *     responses:
 *       200:
 *         description: Данные типа услуги
 *       404:
 *         description: Тип услуги не найден
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getServiceTypeById);


/**
 * @swagger
 * /api/serviceTypes/create:
 *   post:
 *     summary: Создание типа услуги
 *     tags: [ServiceTypes]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Фасадные работы
 *     responses:
 *       201:
 *         description: Тип услуги создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 10, 11, 4), createServiceType);


/**
 * @swagger
 * /api/serviceTypes/update/{id}:
 *   put:
 *     summary: Обновление типа услуги
 *     tags: [ServiceTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *     responses:
 *       200:
 *         description: Тип услуги обновлён
 *       404:
 *         description: Тип услуги не найден
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 10, 11, 4), updateServiceType);


/**
 * @swagger
 * /api/serviceTypes/delete/{id}:
 *   delete:
 *     summary: Удаление типа услуги
 *     tags: [ServiceTypes]
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
 *         description: Тип услуги удалён
 *       404:
 *         description: Тип услуги не найден
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 10, 11, 4), deleteServiceType);

module.exports = router;
