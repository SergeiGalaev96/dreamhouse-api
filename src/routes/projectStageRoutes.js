express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getAllProjectStages, searchProjectStages, getProjectStageById, createProjectStage, updateProjectStage, deleteProjectStage } = require('../controllers/projectStagesController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectStages
 *   description: API для управления этапами проектов
 */

/**
 * @swagger
 * /api/projectStages/gets:
 *   get:
 *     summary: Получить список этапов проектов
 *     tags: [ProjectStages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список этапов проектов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllProjectStages);

/**
 * @swagger
 * /api/projectStages/search:
 *   post:
 *     summary: Поиск этапов проектов
 *     description: Выполняет поиск этапов проектов
 *     tags:
 *       - ProjectStages
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск этапов проектов
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchProjectStages);

/**
 * @swagger
 * /api/projectStages/getById/{id}:
 *   get:
 *     summary: Получить этап проекта по ID
 *     tags: [ProjectStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID этапа проекта
 *     responses:
 *       200:
 *         description: Этап проекта найден
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Этап проекта не найден
 *       500:
 *         description: Ошибка сервера
 */

router.get('/getById/:id', authenticateToken, getProjectStageById);

/**
 * @swagger
 * /api/projectStages/create:
 *   post:
 *     summary: Создать этап проекта
 *     tags: [ProjectStages]
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
 *               - responsible_user_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Этап 1"
 *               project_id:
 *                 type: integer
 *                 example: 1
 *               responsible_user_id:
 *                 type: string
 *                 description: Название этапа проекта
 *                 example: 1
 *     responses:
 *       201:
 *         description: Этап проекта создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1), createProjectStage);

/**
 * @swagger
 * /api/projectStages/update/{id}:
 *   put:
 *     summary: Обновить этап проекта
 *     tags: [ProjectStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID этапа проекта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название этапа проекта
 *                 example: "Дорожный"
 *     responses:
 *       200:
 *         description: Этап проекта обновлён
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Этап проекта не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateProjectStage);

/**
 * @swagger
 * /api/projectStages/delete/{id}:
 *   delete:
 *     summary: Удалить этап проекта
 *     tags: [ProjectStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID этапа проекта
 *     responses:
 *       200:
 *         description: Этап проекта удалён
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Этап проекта не найден
 *       500:
 *         description: Ошибка сервера
 */

router.delete('/delete/:id', authenticateToken, authorizeRole(1), deleteProjectStage);

module.exports = router;