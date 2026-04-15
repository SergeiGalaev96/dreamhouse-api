const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllMaterialEstimates,
  searchMaterialEstimates,
  getMaterialEstimateById,
  createMaterialEstimate,
  updateMaterialEstimate,
  deleteMaterialEstimate
} = require('../controllers/materialEstimateController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialEstimates
 *   description: API для управления сметами материалов
 */

/**
 * @swagger
 * /api/materialEstimates/gets:
 *   get:
 *     summary: Получение списка смет материалов
 *     tags: [MaterialEstimates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Сметы материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialEstimates);

/**
 * @swagger
 * /api/materialEstimates/search:
 *   post:
 *     summary: Поиск и фильтрация смет материалов
 *     tags: [MaterialEstimates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               block_id:
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
 *         description: Список смет материалов
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterialEstimates);

/**
 * @swagger
 * /api/materialEstimates/getById/{id}:
 *   get:
 *     summary: Получение сметы материалов по ID
 *     tags: [MaterialEstimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID сметы
 *     responses:
 *       200:
 *         description: Данные сметы материалов
 *       404:
 *         description: Смета не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialEstimateById);

/**
 * @swagger
 * /api/materialEstimates/create:
 *   post:
 *     summary: Создание сметы блока
 *     description: Создаёт смету для выбранного блока с позициями материалов и услуг
 *     tags: [MaterialEstimates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - block_id
 *               - status
 *             properties:
 *               block_id:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Смета Блок А"
 *               status:
 *                 type: integer
 *                 description: 1=draft, 2=approved, 3=archived
 *                 example: 1
 *               approved_user_id:
 *                 type: integer
 *                 description: ID пользователя, утвердившего смету
 *                 example: 5
 *               approved_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-02-20T12:30:00Z
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - item_type
 *                     - subsection_id
 *                     - unit_of_measure
 *                     - quantity_planned
 *                   properties:
 *                     item_type:
 *                       type: integer
 *                       description: 1=material, 2=service
 *                       example: 1
 *                     subsection_id:
 *                       type: integer
 *                       example: 3
 *                     material_id:
 *                       type: integer
 *                       description: Обязателен если item_type=1
 *                       example: 10
 *                     service_id:
 *                       type: integer
 *                       description: Обязателен если item_type=2
 *                       example: 4
 *                     unit_of_measure:
 *                       type: integer
 *                       example: 3
 *                     quantity_planned:
 *                       type: number
 *                       format: double
 *                       example: 120.5
 *                     coefficient:
 *                       type: number
 *                       format: double
 *                       nullable: true
 *                       example: 1.2
 *                     comment:
 *                       type: string
 *                       example: На весь блок А
 *     responses:
 *       201:
 *         description: Смета успешно создана
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 10, 11), createMaterialEstimate);

/**
 * @swagger
 * /api/materialEstimates/update/{id}:
 *   put:
 *     summary: Обновление сметы блока
 *     description: Обновляет основную информацию сметы (без позиций). Позиции обновляются отдельными методами.
 *     tags: [MaterialEstimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID сметы
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Смета Блок А"
 *               status:
 *                 type: integer
 *                 description: 1=draft, 2=approved, 3=archived
 *                 example: 2
 *               approved_user_id:
 *                 type: integer
 *                 description: ID пользователя, утвердившего смету
 *                 example: 5
 *               approved_at:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-02-20T12:30:00Z
 *     responses:
 *       200:
 *         description: Смета успешно обновлена
 *       400:
 *         description: Ошибка валидации данных
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Смета не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 10, 11), updateMaterialEstimate);


/**
 * @swagger
 * /api/materialEstimates/delete/{id}:
 *   delete:
 *     summary: Удаление сметы материалов
 *     tags: [MaterialEstimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID сметы
 *     responses:
 *       200:
 *         description: Смета успешно удалена
 *       404:
 *         description: Смета не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 10, 11), deleteMaterialEstimate);

module.exports = router;
