const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
  getAllTeamMembers,
  searchTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} = require('../controllers/teamMemberController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TeamMembers
 *   description: API для управления специалистами бригад
 */

/**
 * @swagger
 * /api/teamMembers/gets:
 *   get:
 *     summary: Получение списка специалистов бригад
 *     tags: [TeamMembers]
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
router.get('/gets', authenticateToken, getAllTeamMembers);

/**
 * @swagger
 * /api/teamMembers/search:
 *   post:
 *     summary: Поиск и фильтрация бригад
 *     tags: [TeamMembers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               team_id:
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
router.post('/search', authenticateToken, searchTeamMembers);

/**
 * @swagger
 * /api/teamMembers/getById/{id}:
 *   get:
 *     summary: Получение специалиста специалиста бригады по ID
 *     tags: [TeamMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID специалиста специалиста бригады
 *     responses:
 *       200:
 *         description: Данные специалиста бригады
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getTeamMemberById);

/**
 * @swagger
 * /api/teamMembers/create:
 *   post:
 *     summary: Создание нового специалиста бригады
 *     tags: [TeamMembers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - team_id
 *             properties:
 *               user_id:
 *                 type: integer
 *               team_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Специалиста бригады успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 2, 3), createTeamMember);

/**
 * @swagger
 * /api/teamMembers/update/{id}:
 *   put:
 *     summary: Обновление специалиста бригады
 *     tags: [TeamMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID специалиста бригады
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               team_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cпециалист бригады успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Cпециалист бригады не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateTeamMember);

/**
 * @swagger
 * /api/teamMembers/delete/{id}:
 *   delete:
 *     summary: Удаление специалиста бригады
 *     tags: [TeamMembers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID специалиста бригады
 *     responses:
 *       200:
 *         description: Cпециалист бригады успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Cпециалист бригады не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteTeamMember);

module.exports = router;