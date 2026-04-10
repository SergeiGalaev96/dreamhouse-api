const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllMaterialWriteOffs,
  searchMaterialWriteOffs,
  getMaterialWriteOffById,
  createMaterialWriteOff,
  updateMaterialWriteOff,
  signMaterialWriteOff,
  postMaterialWriteOff,
  deleteMaterialWriteOff
} = require('../controllers/materialWriteOffController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: MaterialWriteOffs
 *     description: API для актов списания материалов
 */

/**
 * @swagger
 * /api/materialWriteOffs/gets:
 *   get:
 *     summary: Получить все акты списания материалов
 *     tags: [MaterialWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список актов списания
 */
router.get('/gets', authenticateToken, getAllMaterialWriteOffs);

/**
 * @swagger
 * /api/materialWriteOffs/search:
 *   post:
 *     summary: Поиск актов списания материалов
 *     tags: [MaterialWriteOffs]
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
 *               block_id:
 *                 type: integer
 *               warehouse_id:
 *                 type: integer
 *               work_performed_id:
 *                 type: integer
 *               work_performed_item_id:
 *                 type: integer
 *               status:
 *                 type: integer
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
router.post('/search', authenticateToken, searchMaterialWriteOffs);

/**
 * @swagger
 * /api/materialWriteOffs/getById/{id}:
 *   get:
 *     summary: Получить акт списания материалов по ID
 *     tags: [MaterialWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта списания
 *     responses:
 *       200:
 *         description: Акт списания найден
 *       404:
 *         description: Акт списания не найден
 */
router.get('/getById/:id', authenticateToken, getMaterialWriteOffById);

/**
 * @swagger
 * /api/materialWriteOffs/create:
 *   post:
 *     summary: Создать акт списания материалов
 *     tags: [MaterialWriteOffs]
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
 *               - work_performed_item_id
 *               - items
 *             properties:
 *               warehouse_id:
 *                 type: integer
 *               work_performed_item_id:
 *                 type: integer
 *               write_off_date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
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
 *       201:
 *         description: Акт списания создан
 */
router.post('/create', authenticateToken, createMaterialWriteOff);

/**
 * @swagger
 * /api/materialWriteOffs/update/{id}:
 *   put:
 *     summary: Обновить акт списания материалов
 *     tags: [MaterialWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта списания
 *     responses:
 *       200:
 *         description: Акт списания обновлен
 */
router.put('/update/:id', authenticateToken, updateMaterialWriteOff);

/**
 * @swagger
 * /api/materialWriteOffs/sign/{id}:
 *   post:
 *     summary: Подписать акт списания материалов
 *     tags: [MaterialWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта списания
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
 *         description: Акт списания подписан
 */
router.post('/sign/:id', authenticateToken, signMaterialWriteOff);

/**
 * @swagger
 * /api/materialWriteOffs/post/{id}:
 *   post:
 *     summary: Провести акт списания материалов
 *     tags: [MaterialWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта списания
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Акт списания проведен
 */
router.post('/post/:id', authenticateToken, postMaterialWriteOff);

/**
 * @swagger
 * /api/materialWriteOffs/delete/{id}:
 *   delete:
 *     summary: Удалить акт списания материалов
 *     tags: [MaterialWriteOffs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта списания
 *     responses:
 *       200:
 *         description: Акт списания удален
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialWriteOff);

module.exports = router;
