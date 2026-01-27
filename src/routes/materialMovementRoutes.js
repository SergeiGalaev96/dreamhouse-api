const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { 
  getAllMaterialMovements,
  searchMaterialMovements,
  getMaterialMovementById,
  createMaterialMovement,
  updateMaterialMovement,
  deleteMaterialMovement 
} = require('../controllers/materialMovementController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialMovements
 *   description: API для управления транзакциями материалов
 */

/**
 * @swagger
 * /api/materialMovements/gets:
 *   get:
 *     summary: Получение списка транзакций материалов
 *     tags: [MaterialMovements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Транзакции на материалы
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialMovements);

/**
 * @swagger
 * /api/materialMovements/search:
 *   post:
 *     summary: Поиск и фильтрация транзакций материалов
 *     tags: [MaterialMovements]
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
 *               material_id:
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
 *         description: Список транзакций материалов
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterialMovements);

/**
 * @swagger
 * /api/materialMovements/getById/{id}:
 *   get:
 *     summary: Получение транзакции на материалы по ID
 *     tags: [MaterialMovements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID транзакции на материалы
 *     responses:
 *       200:
 *         description: Данные транзакции на материалы
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Заявка на материалы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialMovementById);

/**
 * @swagger
 * /api/materialMovements/create:
 *   post:
 *     summary: Создание транзакции на материалы
 *     tags: [MaterialMovements]
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
router.post('/create', authenticateToken, createMaterialMovement);



/**
 * @swagger
 * /api/materialMovements/update/{id}:
 *   put:
 *     summary: Обновление транзакции на материалы
 *     tags: [MaterialMovements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID транзакции на материалы
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
 *         description: Транзакции на материалы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialMovement);

/**
 * @swagger
 * /api/materialMovements/delete/{id}:
 *   delete:
 *     summary: Удаление транзакции на материалы
 *     tags: [MaterialMovements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID транзакции на материалы
 *     responses:
 *       200:
 *         description: Заявка на материалы успешно удалена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Транзакции на материалы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialMovement);

module.exports = router;