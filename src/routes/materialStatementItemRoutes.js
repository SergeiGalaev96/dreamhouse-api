const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
  getAllMaterialStatementItems,
  getMaterialStatementItemById,
  createMaterialStatementItem,
  updateMaterialStatementItem,
  deleteMaterialStatementItem
} = require('../controllers/materialStatementItemController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialStatementItems
 *   description: API для управления позициями ведомостей материалов
 */

/**
 * @swagger
 * /api/materialStatementItems/gets:
 *   get:
 *     summary: Получение списка позиций ведомостей материалов
 *     tags: [MaterialStatementItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Позиции ведомостей материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialStatementItems);

/**
 * @swagger
 * /api/materialStatementItems/getById/{id}:
 *   get:
 *     summary: Получение позиции ведомости по ID
 *     tags: [MaterialStatementItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции ведомости
 *     responses:
 *       200:
 *         description: Данные позиции ведомости
 *       404:
 *         description: Позиция ведомости не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialStatementItemById);

/**
 * @swagger
 * /api/materialStatementItems/create:
 *   post:
 *     summary: Создание позиции ведомости материалов
 *     tags: [MaterialStatementItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - material_statement_id
 *               - material_type
 *               - material_id
 *               - unit_of_measure
 *               - quantity_planned
 *             properties:
 *               material_statement_id:
 *                 type: integer
 *                 example: 1
 *               material_type:
 *                 type: integer
 *                 example: 1
 *               material_id:
 *                 type: integer
 *                 example: 5
 *               unit_of_measure:
 *                 type: integer
 *                 example: 3
 *               quantity_planned:
 *                 type: number
 *                 example: 120
 *               comment:
 *                 type: string
 *                 example: На фундамент
 *     responses:
 *       201:
 *         description: Позиция ведомости успешно создана
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createMaterialStatementItem);

/**
 * @swagger
 * /api/materialStatementItems/update/{id}:
 *   put:
 *     summary: Обновление позиции ведомости материалов
 *     tags: [MaterialStatementItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции ведомости
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Позиция ведомости успешно обновлена
 *       404:
 *         description: Позиция ведомости не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialStatementItem);

/**
 * @swagger
 * /api/materialStatementItems/delete/{id}:
 *   delete:
 *     summary: Удаление позиции ведомости материалов
 *     tags: [MaterialStatementItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции ведомости
 *     responses:
 *       200:
 *         description: Позиция ведомости успешно удалена
 *       404:
 *         description: Позиция ведомости не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialStatementItem);

module.exports = router;