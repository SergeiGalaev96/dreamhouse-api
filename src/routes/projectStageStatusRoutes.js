express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getAllProjectStageStatuses, searchProjectStageStatuses, getProjectStageStatusById, createProjectStageStatus, updateProjectStageStatus, deleteProjectStageStatus } = require('../controllers/projectStageStatusesController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectStageStatuses
 *   description: API для управления Статусами этапов проектов
 */

/**
 * @swagger
 * /api/projectStageStatuses/gets:
 *   get:
 *     summary: Получить список статусов этапов проектов
 *     tags: [ProjectStageStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов этапов проектов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllProjectStageStatuses);

// /**
//  * @swagger
//  * /api/projectStageStatuses/search:
//  *   post:
//  *     summary: Поиск статусов этапов проектов
//  *     description: Выполняет поиск статусов этапов проектов
//  *     tags:
//  *       - ProjectStageStatuses
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: false
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *               page:
//  *                 type: integer
//  *                 example: 1
//  *               size:
//  *                 type: integer
//  *                 example: 10
//  *     responses:
//  *       200:
//  *         description: Успешный поиск статусов этапов проектов
//  *       401:
//  *         description: Неавторизован
//  *       403:
//  *         description: Доступ запрещён
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.post('/search', authenticateToken, searchProjectStageStatuses);


// /**
//  * @swagger
//  * /api/projectStageStatuses/getById/{id}:
//  *   get:
//  *     summary: Получить статус этапа проекта по ID
//  *     tags: [ProjectStageStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса этапа проекта
//  *     responses:
//  *       200:
//  *         description: Этап проекта найден
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Этап проекта не найден
//  *       500:
//  *         description: Ошибка сервера
//  */

// router.get('/getById/:id', authenticateToken, getProjectStageStatusById);

// /**
//  * @swagger
//  * /api/projectStageStatuses/create:
//  *   post:
//  *     summary: Создать статус этапа проекта
//  *     tags: [ProjectStageStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: "В работе"
//  *     responses:
//  *       201:
//  *         description: Статус этапа проекта создан
//  *       400:
//  *         description: Ошибка валидации
//  *       401:
//  *         description: Неавторизованный доступ
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.post('/create', authenticateToken, authorizeRole(1), createProjectStageStatus);

// /**
//  * @swagger
//  * /api/projectStageStatuses/update/{id}:
//  *   put:
//  *     summary: Обновить статус этапа проекта
//  *     tags: [ProjectStageStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса этапа проекта
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 description: Название статуса этапа проекта
//  *                 example: "В работе"
//  *     responses:
//  *       200:
//  *         description: Статус этапа проекта обновлён
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Статус этапа проекта не найден
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateProjectStageStatus);

// /**
//  * @swagger
//  * /api/projectStageStatuses/delete/{id}:
//  *   delete:
//  *     summary: Удалить статус этапа проекта
//  *     tags: [ProjectStageStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса этапа проекта
//  *     responses:
//  *       200:
//  *         description: Статус этапа проекта удалён
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Статус этапа проекта не найден
//  *       500:
//  *         description: Ошибка сервера
//  */

// router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteProjectStageStatus);

module.exports = router;