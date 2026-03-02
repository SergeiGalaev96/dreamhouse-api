const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllStageSubsections,
  searchStageSubsections,
  getStageSubsectionById,
  createStageSubsection,
  updateStageSubsection,
  deleteStageSubsection
} = require('../controllers/stageSubsectionController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: StageSubsections
 *   description: API для управления подэтапами этапа
 */


/**
 * @swagger
 * /api/stageSubsections/gets:
 *   get:
 *     summary: Получение списка подэтапов
 *     tags: [StageSubsections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список подэтапов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllStageSubsections);


/**
 * @swagger
 * /api/stageSubsections/search:
 *   post:
 *     summary: Поиск подэтапов
 *     tags: [StageSubsections]
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
 *                 description: Поиск по названию подэтапа
 *                 example: Лифт
 *               stage_id:
 *                 type: integer
 *                 description: ID этапа
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
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchStageSubsections);


/**
 * @swagger
 * /api/stageSubsections/getById/{id}:
 *   get:
 *     summary: Получение подэтапа по ID
 *     tags: [StageSubsections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID подэтапа
 *     responses:
 *       200:
 *         description: Данные подэтапа
 *       404:
 *         description: Подэтап не найден
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getStageSubsectionById);


/**
 * @swagger
 * /api/stageSubsections/create:
 *   post:
 *     summary: Создание нового подэтапа
 *     tags: [StageSubsections]
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
 *               - stage_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Монолитный каркас
 *               stage_id:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: Подэтап успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post(
  '/create',
  authenticateToken,
  authorizeRole(1, 2, 3),
  createStageSubsection
);


/**
 * @swagger
 * /api/stageSubsections/update/{id}:
 *   put:
 *     summary: Обновление подэтапа
 *     tags: [StageSubsections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID подэтапа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Каркас (обновлено)
 *               stage_id:
 *                 type: integer
 *               comment:
 *                 type: string
 *                 description: Комментарий для аудита изменений
 *     responses:
 *       200:
 *         description: Подэтап успешно обновлен
 *       404:
 *         description: Подэтап не найден
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.put(
  '/update/:id',
  authenticateToken,
  authorizeRole(1, 2, 3),
  updateStageSubsection
);


/**
 * @swagger
 * /api/stageSubsections/delete/{id}:
 *   delete:
 *     summary: Удаление подэтапа (soft delete)
 *     tags: [StageSubsections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID подэтапа
 *     responses:
 *       200:
 *         description: Подэтап успешно удален
 *       404:
 *         description: Подэтап не найден
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.delete(
  '/delete/:id',
  authenticateToken,
  authorizeRole(1, 2, 3),
  deleteStageSubsection
);

module.exports = router;