const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  searchMbpWriteOffs,
  getMbpWriteOffById,
  createMbpWriteOff,
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
 *               - block_id
 *               - items
 *             properties:
 *               warehouse_id:
 *                 type: integer
 *               block_id:
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
 */
router.post('/create', authenticateToken, createMbpWriteOff);

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
 */
router.delete('/delete/:id', authenticateToken, deleteMbpWriteOff);

module.exports = router;
