const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllMaterialStatements,
  searchMaterialStatements,
  getMaterialStatementById,
  createMaterialStatement,
  updateMaterialStatement,
  deleteMaterialStatement
} = require('../controllers/materialStatementController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialStatements
 *   description: API для управления ведомостями материалов
 */

/**
 * @swagger
 * /api/materialStatements/gets:
 *   get:
 *     summary: Получение списка ведомостей материалов
 *     tags: [MaterialStatements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ведомости материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialStatements);

/**
 * @swagger
 * /api/materialStatements/search:
 *   post:
 *     summary: Поиск и фильтрация ведомостей материалов
 *     tags: [MaterialStatements]
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
 *                 example: 1
 *               status:
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
 *         description: Список ведомостей материалов
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterialStatements);

/**
 * @swagger
 * /api/materialStatements/getById/{id}:
 *   get:
 *     summary: Получение ведомости материалов по ID
 *     tags: [MaterialStatements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ведомости
 *     responses:
 *       200:
 *         description: Данные ведомости материалов
 *       404:
 *         description: Ведомость не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialStatementById);

/**
 * @swagger
 * /api/materialStatements/create:
 *   post:
 *     summary: Создание ведомости материалов
 *     tags: [MaterialStatements]
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
 *               status:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - material_id
 *                     - unit_of_measure
 *                     - quantity
 *                   properties:
 *                     material_type:
 *                       type: integer
 *                       example: 1
 *                     material_id:
 *                       type: integer
 *                       example: 1
 *                     unit_of_measure:
 *                       type: integer
 *                       example: 3
 *                     quantity_planned:
 *                       type: number
 *                       example: 120
 *                     comment:
 *                       type: string
 *                       example: На весь объект
 *     responses:
 *       201:
 *         description: Ведомость материалов успешно создана
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createMaterialStatement);

/**
 * @swagger
 * /api/materialStatements/update/{id}:
 *   put:
 *     summary: Обновление ведомости материалов
 *     tags: [MaterialStatements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ведомости
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Ведомость успешно обновлена
 *       404:
 *         description: Ведомость не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialStatement);

/**
 * @swagger
 * /api/materialStatements/delete/{id}:
 *   delete:
 *     summary: Удаление ведомости материалов
 *     tags: [MaterialStatements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ведомости
 *     responses:
 *       200:
 *         description: Ведомость успешно удалена
 *       404:
 *         description: Ведомость не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialStatement);

module.exports = router;
