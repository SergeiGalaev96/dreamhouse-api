const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllBlockStages,
  searchBlockStages,
  getBlockStageById,
  createBlockStage,
  updateBlockStage,
  deleteBlockStage
} = require('../controllers/blockStageController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: BlockStages
 *   description: API для управления этапами (секциями) внутри блока
 */


/**
 * @swagger
 * /api/blockStages/gets:
 *   get:
 *     summary: Получение списка всех этапов
 *     tags: [BlockStages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список этапов
 *       401:
 *         description: Неавторизован
 */
router.get('/gets', authenticateToken, getAllBlockStages);


/**
 * @swagger
 * /api/blockStages/search:
 *   post:
 *     summary: Поиск этапов по названию или блоку
 *     tags: [BlockStages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *                 description: Поиск по названию этапа
 *                 example: Каркас
 *               block_id:
 *                 type: integer
 *                 description: ID блока
 *                 example: 5
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
router.post('/search', authenticateToken, searchBlockStages);


/**
 * @swagger
 * /api/blockStages/getById/{id}:
 *   get:
 *     summary: Получение этапа по ID
 *     tags: [BlockStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID этапа
 */
router.get('/getById/:id', authenticateToken, getBlockStageById);


/**
 * @swagger
 * /api/blockStages/create:
 *   post:
 *     summary: Создание нового этапа (секция внутри блока)
 *     tags: [BlockStages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - block_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Каркас
 *                 description: Название этапа
 *               block_id:
 *                 type: integer
 *                 example: 3
 *                 description: ID блока, к которому относится этап
 *     responses:
 *       201:
 *         description: Этап успешно создан
 */
router.post(
  '/create',
  authenticateToken,
  createBlockStage
);


/**
 * @swagger
 * /api/blockStages/update/{id}:
 *   put:
 *     summary: Обновление этапа
 *     tags: [BlockStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID этапа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Каркас монолитный
 *               block_id:
 *                 type: integer
 *                 example: 3
 *               comment:
 *                 type: string
 *                 example: Переименовали этап
 *                 description: Комментарий для аудита
 */
router.put(
  '/update/:id',
  authenticateToken,
  updateBlockStage
);


/**
 * @swagger
 * /api/blockStages/delete/{id}:
 *   delete:
 *     summary: Удаление этапа (soft delete)
 *     tags: [BlockStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID этапа
 */
router.delete(
  '/delete/:id',
  authenticateToken,
  authorizeRole(1, 2, 3),
  deleteBlockStage
);

module.exports = router;
