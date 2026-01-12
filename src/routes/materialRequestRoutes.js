const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { 
  getAllMaterialRequests,
  searchMaterialRequests,
  getMaterialRequestById,
  createMaterialRequest,
  updateMaterialRequest,
  deleteMaterialRequest 
} = require('../controllers/materialRequestController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialRequests
 *   description: API для управления заявками на материалы
 */

/**
 * @swagger
 * /api/materialRequests/gets:
 *   get:
 *     summary: Получение списка заявок на материалы
 *     tags: [MaterialRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Заявки на материалы
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialRequests);

/**
 * @swagger
 * /api/materialRequests/search:
 *   post:
 *     summary: Поиск и фильтрация заявок на материалы
 *     tags: [MaterialRequests]
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
 *         description: Список заявок на материалы
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterialRequests);

/**
 * @swagger
 * /api/materialRequests/getById/{id}:
 *   get:
 *     summary: Получение заявки на материалы по ID
 *     tags: [MaterialRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки на материалы
 *     responses:
 *       200:
 *         description: Данные заявки на материалы
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Заявка на материалы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialRequestById);

/**
 * @swagger
 * /api/materialRequests/create:
 *   post:
 *     summary: Создание заявки на материалы
 *     tags: [MaterialRequests]
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
 *               - items
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID проекта
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 description: Позиции материалов
 *                 items:
 *                   type: object
 *                   required:
 *                     - material_type
 *                     - material_id
 *                     - unit_of_measure
 *                     - quantity
 *                   properties:
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
 *                       description: Запрашиваемое количество
 *
 *                     comment:
 *                       type: string
 *                       example: Для монолита
 *
 *     responses:
 *       201:
 *         description: Заявка на материалы успешно создана
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createMaterialRequest);



/**
 * @swagger
 * /api/materialRequests/update/{id}:
 *   put:
 *     summary: Обновление заявки на материалы
 *     tags: [MaterialRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки на материалы
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
 *         description: Заявкf на материалы успешно обновлена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Заявки на материалы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialRequest);

/**
 * @swagger
 * /api/materialRequests/delete/{id}:
 *   delete:
 *     summary: Удаление заявки на материалы
 *     tags: [MaterialRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID заявки на материалы
 *     responses:
 *       200:
 *         description: Заявка на материалы успешно удалена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Заявки на материалы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialRequest);

module.exports = router;