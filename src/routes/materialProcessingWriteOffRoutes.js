const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  searchMaterialProcessingWriteOffs,
  getMaterialProcessingWriteOffById,
  createMaterialProcessingWriteOff,
  updateMaterialProcessingWriteOff,
  signMaterialProcessingWriteOff,
  deleteMaterialProcessingWriteOff
} = require('../controllers/materialProcessingWriteOffController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: MaterialProcessingWriteOffs
 *     description: API для актов переработки материалов
 *
 * components:
 *   schemas:
 *     MaterialProcessingWriteOffItemInput:
 *       type: object
 *       required:
 *         - material_id
 *         - unit_of_measure
 *         - quantity
 *       properties:
 *         material_id:
 *           type: integer
 *           example: 12
 *         unit_of_measure:
 *           type: integer
 *           example: 1
 *         quantity:
 *           type: number
 *           format: double
 *           example: 10
 *         note:
 *           type: string
 *           nullable: true
 *           example: Материал для изготовления опалубки
 *
 *     MaterialProcessingWriteOffResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Акт переработки успешно создан
 *         data:
 *           type: object
 *
 *     MaterialProcessingWriteOffListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             type: object
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             size:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 25
 *             pages:
 *               type: integer
 *               example: 3
 *             hasNext:
 *               type: boolean
 *               example: true
 *             hasPrev:
 *               type: boolean
 *               example: false
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Ошибка сервера
 *         error:
 *           type: string
 *           example: Подробности ошибки
 */

/**
 * @swagger
 * /api/materialProcessingWriteOffs/search:
 *   post:
 *     summary: Поиск актов переработки
 *     tags: [MaterialProcessingWriteOffs]
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
 *                 example: 18
 *               warehouse_id:
 *                 type: integer
 *                 example: 3
 *               status:
 *                 type: integer
 *                 description: 1 - создан, 2 - на подписании, 3 - проведен, 4 - отменен
 *                 example: 1
 *               date_from:
 *                 type: string
 *                 format: date
 *                 example: 2026-04-01
 *               date_to:
 *                 type: string
 *                 format: date
 *                 example: 2026-04-30
 *               page:
 *                 type: integer
 *                 default: 1
 *               size:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Список актов переработки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialProcessingWriteOffListResponse'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/search', authenticateToken, searchMaterialProcessingWriteOffs);

/**
 * @swagger
 * /api/materialProcessingWriteOffs/getById/{id}:
 *   get:
 *     summary: Получить акт переработки по ID
 *     tags: [MaterialProcessingWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Акт переработки найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialProcessingWriteOffResponse'
 *       404:
 *         description: Акт переработки не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialProcessingWriteOffById);

/**
 * @swagger
 * /api/materialProcessingWriteOffs/create:
 *   post:
 *     summary: Создать акт переработки
 *     tags: [MaterialProcessingWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouse_id
 *               - items
 *             properties:
 *               warehouse_id:
 *                 type: integer
 *                 example: 3
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: Переработка материалов для опалубки
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MaterialProcessingWriteOffItemInput'
 *     responses:
 *       201:
 *         description: Акт переработки создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialProcessingWriteOffResponse'
 *       400:
 *         description: Ошибка валидации или недостаточно остатков на складе
 *       404:
 *         description: Склад не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createMaterialProcessingWriteOff);

/**
 * @swagger
 * /api/materialProcessingWriteOffs/update/{id}:
 *   put:
 *     summary: Обновить акт переработки
 *     tags: [MaterialProcessingWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 nullable: true
 *                 example: Обновленный комментарий
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 example: Причина изменения
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MaterialProcessingWriteOffItemInput'
 *     responses:
 *       200:
 *         description: Акт переработки обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialProcessingWriteOffResponse'
 *       400:
 *         description: Ошибка валидации или акт нельзя редактировать
 *       404:
 *         description: Акт переработки не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialProcessingWriteOff);

/**
 * @swagger
 * /api/materialProcessingWriteOffs/sign/{id}:
 *   post:
 *     summary: Подписать акт переработки
 *     description: После последней подписи акт автоматически проводится и списывает материалы со склада.
 *     tags: [MaterialProcessingWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stage
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [foreman, planning_engineer, main_engineer, general_director]
 *                 example: foreman
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 example: Подписано
 *     responses:
 *       200:
 *         description: Акт переработки подписан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MaterialProcessingWriteOffResponse'
 *       400:
 *         description: Некорректный этап, акт уже проведен или недостаточно остатков
 *       403:
 *         description: Недостаточно прав для подписи
 *       404:
 *         description: Акт переработки не найден
 *       500:
 *         description: Ошибка сервера
 */
router.post('/sign/:id', authenticateToken, signMaterialProcessingWriteOff);

/**
 * @swagger
 * /api/materialProcessingWriteOffs/delete/{id}:
 *   delete:
 *     summary: Удалить акт переработки
 *     tags: [MaterialProcessingWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 example: Удалено ошибочно созданное списание
 *     responses:
 *       200:
 *         description: Акт переработки удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Акт переработки успешно удален
 *       400:
 *         description: Проведенный акт нельзя удалить
 *       404:
 *         description: Акт переработки не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, deleteMaterialProcessingWriteOff);

module.exports = router;
