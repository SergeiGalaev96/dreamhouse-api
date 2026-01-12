express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
// const { validateProjectStatus } = require('../middleware/validation');
const { getAllProjectStatuses, getProjectStatusById, createProjectStatus, updateProjectStatus, deleteProjectStatus } = require('../controllers/projectStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectStatuses
 *   description: API для управления статусами проектов
 */

/**
 * @swagger
 * /api/projectStatuses/gets:
 *   get:
 *     summary: Получить список статусов проектов
 *     tags: [ProjectStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов проектов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */

router.get('/gets', authenticateToken, getAllProjectStatuses);

// /**
//  * @swagger
//  * /api/projectStatuses/getById/{id}:
//  *   get:
//  *     summary: Получить статус проекта по ID
//  *     tags: [ProjectStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса проекта
//  *     responses:
//  *       200:
//  *         description: Тип проекта найден
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Тип проекта не найден
//  *       500:
//  *         description: Ошибка сервера
//  */

// router.get('/getById/:id', authenticateToken, getProjectStatusById);

// /**
//  * @swagger
//  * /api/projectStatuses/create:
//  *   post:
//  *     summary: Создать статус проекта
//  *     tags: [ProjectStatuses]
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
//  *                 description: Название статуса проекта
//  *                 example: "Мосты"
//  *     responses:
//  *       201:
//  *         description: Тип проекта создан
//  *       400:
//  *         description: Ошибка валидации
//  *       401:
//  *         description: Неавторизованный доступ
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.post('/create', authenticateToken, authorizeRole(1), createProjectStatus);

// /**
//  * @swagger
//  * /api/projectStatuses/update/{id}:
//  *   put:
//  *     summary: Обновить статус проекта
//  *     tags: [ProjectStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса проекта
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 description: Название статуса проекта
//  *                 example: "Дорожный"
//  *     responses:
//  *       200:
//  *         description: Тип проекта обновлён
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Тип проекта не найден
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.put('/update/:id', authenticateToken, authorizeRole(1), updateProjectStatus);

// /**
//  * @swagger
//  * /api/projectStatuses/delete/{id}:
//  *   delete:
//  *     summary: Удалить статус проекта
//  *     tags: [ProjectStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса проекта
//  *     responses:
//  *       200:
//  *         description: Тип проекта удалён
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Тип проекта не найден
//  *       500:
//  *         description: Ошибка сервера
//  */

// router.delete('/delete/:id', authenticateToken, authorizeRole(1), deleteProjectStatus);

module.exports = router;