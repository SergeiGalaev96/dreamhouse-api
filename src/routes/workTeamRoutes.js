const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
  getAllWorkTeams,
  searchWorkTeams,
  getWorkTeamById,
  createWorkTeam,
  updateWorkTeam,
  deleteWorkTeam
} = require('../controllers/workTeamController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkTeams
 *   description: API для управления бригадами
 */

/**
 * @swagger
 * /api/workTeams/gets:
 *   get:
 *     summary: Получение списка бригад
 *     tags: [WorkTeams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список бригад
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllWorkTeams);

/**
 * @swagger
 * /api/workTeams/search:
 *   post:
 *     summary: Поиск и фильтрация бригад
 *     tags: [WorkTeams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               leader_id:
 *                 type: integer
 *               page:
 *                 type: integer
 *                 default: 1
 *               size:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Список бригад
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchWorkTeams);

/**
 * @swagger
 * /api/workTeams/getById/{id}:
 *   get:
 *     summary: Получение бригады по ID
 *     tags: [WorkTeams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID бригады
 *     responses:
 *       200:
 *         description: Данные бригады
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getWorkTeamById);

/**
 * @swagger
 * /api/workTeams/create:
 *   post:
 *     summary: Создание новой бригады
 *     tags: [WorkTeams]
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
 *               - project_id
 *               - leader_id
 *             properties:
 *               name:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               leader_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Материал успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 2, 3), createWorkTeam);

/**
 * @swagger
 * /api/workTeams/update/{id}:
 *   put:
 *     summary: Обновление бригады
 *     tags: [WorkTeams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID бригады
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               leader_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Бригада успешно обновлена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Бригада не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateWorkTeam);

/**
 * @swagger
 * /api/workTeams/delete/{id}:
 *   delete:
 *     summary: Удаление бригады
 *     tags: [WorkTeams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID бригады
 *     responses:
 *       200:
 *         description: Бригада успешно удалена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Бригада не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteWorkTeam);

module.exports = router;