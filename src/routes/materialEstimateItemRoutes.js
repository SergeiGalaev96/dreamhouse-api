const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
  getAllMaterialEstimateItems,
  getMaterialEstimateItemById,
  createMaterialEstimateItem,
  updateMaterialEstimateItem,
  deleteMaterialEstimateItem
} = require('../controllers/materialEstimateItemController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialEstimateItems
 *   description: API для управления позициями смет материалов
 */

/**
 * @swagger
 * /api/materialEstimateItems/gets:
 *   get:
 *     summary: Получение списка позиций смет материалов
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Позиции смет материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialEstimateItems);

/**
 * @swagger
 * /api/materialEstimateItems/getById/{id}:
 *   get:
 *     summary: Получение позиции сметы по ID
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции сметы
 *     responses:
 *       200:
 *         description: Данные позиции сметы
 *       404:
 *         description: Позиция сметы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialEstimateItemById);

/**
 * @swagger
 * /api/materialEstimateItems/create:
 *   post:
 *     summary: Создание позиции сметы материалов
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - material_estimate_id
 *               - subsection_id
 *               - material_type
 *               - material_id
 *               - unit_of_measure
 *               - quantity_planned
 *             properties:
 *               material_estimate_id:
 *                 type: integer
 *                 example: 1
 *               subsection_id:
 *                 type: integer
 *                 example: 1
 *               item_type:
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
 *               coefficient:
 *                 type: number
 *                 example: 1.5
 *               comment:
 *                 type: string
 *                 example: На фундамент
 *     responses:
 *       201:
 *         description: Позиция сметы успешно создана
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createMaterialEstimateItem);

/**
 * @swagger
 * /api/materialEstimateItems/update/{id}:
 *   put:
 *     summary: Обновление позиции сметы материалов
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции сметы
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Позиция сметы успешно обновлена
 *       404:
 *         description: Позиция сметы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialEstimateItem);

/**
 * @swagger
 * /api/materialEstimateItems/delete/{id}:
 *   delete:
 *     summary: Удаление позиции сметы материалов
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции сметы
 *     responses:
 *       200:
 *         description: Позиция сметы успешно удалена
 *       404:
 *         description: Позиция сметы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialEstimateItem);

module.exports = router;