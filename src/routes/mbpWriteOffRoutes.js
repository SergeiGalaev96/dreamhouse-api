const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  searchMbpWriteOffs,
  getMbpWriteOffById,
  createMbpWriteOff,
  updateMbpWriteOff,
  signMbpWriteOff,
  deleteMbpWriteOff
} = require('../controllers/mbpWriteOffController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: MbpWriteOffs
 *     description: API для списаний МБП
 */

/**
 * @swagger
 * /api/mbpWriteOffs/search:
 *   post:
 *     summary: Поиск списаний МБП
 *     tags: [MbpWriteOffs]
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
 *               warehouse_id:
 *                 type: integer
 *               status:
 *                 type: integer
 *                 description: 1 - создан, 2 - на подписании, 3 - проведен, 4 - отменен
 *               date_from:
 *                 type: string
 *                 format: date
 *               date_to:
 *                 type: string
 *                 format: date
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Результат поиска
 */
router.post('/search', authenticateToken, searchMbpWriteOffs);

/**
 * @swagger
 * /api/mbpWriteOffs/getById/{id}:
 *   get:
 *     summary: Получить списание МБП по ID
 *     tags: [MbpWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID списания МБП
 *     responses:
 *       200:
 *         description: Списание МБП найдено
 *       404:
 *         description: Списание МБП не найдено
 */
router.get('/getById/:id', authenticateToken, getMbpWriteOffById);

/**
 * @swagger
 * /api/mbpWriteOffs/create:
 *   post:
 *     summary: Создать списание МБП
 *     tags: [MbpWriteOffs]
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
 *               note:
 *                 type: string
 *                 description: Общий комментарий к списанию
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - material_id
 *                     - unit_of_measure
 *                     - quantity
 *                   properties:
 *                     material_id:
 *                       type: integer
 *                     unit_of_measure:
 *                       type: integer
 *                     quantity:
 *                       type: number
 *                     note:
 *                       type: string
 *                       description: Комментарий по позиции
 *     responses:
 *       201:
 *         description: Списание МБП создано
 */
router.post('/create', authenticateToken, createMbpWriteOff);

/**
 * @swagger
 * /api/mbpWriteOffs/update/{id}:
 *   put:
 *     summary: Обновить списание МБП
 *     tags: [MbpWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID списания МБП
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *               comment:
 *                 type: string
 *                 description: Комментарий для аудита
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - material_id
 *                     - unit_of_measure
 *                     - quantity
 *                   properties:
 *                     material_id:
 *                       type: integer
 *                     unit_of_measure:
 *                       type: integer
 *                     quantity:
 *                       type: number
 *                     note:
 *                       type: string
 *     responses:
 *       200:
 *         description: Списание МБП обновлено
 */
router.put('/update/:id', authenticateToken, updateMbpWriteOff);

/**
 * @swagger
 * /api/mbpWriteOffs/sign/{id}:
 *   post:
 *     summary: Подписать списание МБП
 *     tags: [MbpWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID списания МБП
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
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Списание МБП подписано
 */
router.post('/sign/:id', authenticateToken, signMbpWriteOff);

/**
 * @swagger
 * /api/mbpWriteOffs/delete/{id}:
 *   delete:
 *     summary: Удалить списание МБП
 *     tags: [MbpWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID списания МБП
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: Комментарий к удалению
 *     responses:
 *       200:
 *         description: Списание МБП удалено
 */
router.delete('/delete/:id', authenticateToken, deleteMbpWriteOff);

module.exports = router;
