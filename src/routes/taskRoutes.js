const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const { 
  getAllTasks,
  searchTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: API для управления задачами
 */

/**
 * @swagger
 * /api/tasks/gets:
 *   get:
 *     summary: Получение списка задач
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список задач
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllTasks);

/**
 * @swagger
 * /api/tasks/search:
 *   post:
 *     summary: Поиск и фильтрация задач
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search:
 *                 type: string
 *                 example: бетон
 *               page:
 *                 type: integer
 *                 default: 1
 *               size:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Список задач
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchTasks);

/**
 * @swagger
 * /api/tasks/getById/{id}:
 *   get:
 *     summary: Получение задачи по ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Данные задачи
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Задача не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getTaskById);

/**
 * @swagger
 * /api/tasks/create:
 *   post:
 *     summary: Создание задачи
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - created_user_id
 *               - responsible_user_id
 *             properties:
 *               title:
 *                 type: string
 *                 example: Закупить бетон
 *                 description: Название задачи
 *
 *               description:
 *                 type: string
 *                 example: Нужно закупить 10 кубов бетона
 *                 description: Описание задачи
 *
 *               created_user_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID создателя задачи
 *
 *               responsible_user_id:
 *                 type: integer
 *                 example: 5
 *                 description: Ответственный пользователь
 *
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-03-20
 *                 description: Срок выполнения
 *
 *               priority:
 *                 type: integer
 *                 example: 2
 *                 description: Приоритет задачи
 * 
 *               status:
 *                 type: integer
 *                 example: 1
 *                 description: Статус
 *
 *     responses:
 *       201:
 *         description: Задача успешно создана
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createTask);

/**
 * @swagger
 * /api/tasks/update/{id}:
 *   put:
 *     summary: Обновление задачи
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               responsible_user_id:
 *                 type: integer
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: integer
 *               priority:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Задача успешно обновлена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Задача не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateTask);

/**
 * @swagger
 * /api/tasks/delete/{id}:
 *   delete:
 *     summary: Удаление задачи
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Задача успешно удалена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Задача не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteTask);

module.exports = router;