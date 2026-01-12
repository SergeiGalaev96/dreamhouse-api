const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');
const { 
  getAllProjects,
  searchProjects,
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject 
} = require('../controllers/projectController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: API для управления проектами
 */

/**
 * @swagger
 * /api/projects/gets:
 *   get:
 *     summary: Получение списка проектов
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список проектов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllProjects);


/**
 * @swagger
 * /api/projects/search:
 *   post:
 *     summary: Поиск проектов
 *     description: Выполняет поиск проектов
 *     tags:
 *       - Projects
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
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск проектов
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchProjects);

/**
 * @swagger
 * /api/projects/getById/{id}:
 *   get:
 *     summary: Получение проекта по ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Данные проекта
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Проект не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getProjectById);

/**
 * @swagger
 * /api/projects/create:
 *   post:
 *     summary: Создание нового проекта
 *     tags: [Projects]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название проекта
 *               code:
 *                 type: string
 *                 description: Код проекта
 *               type:
 *                 type: integer
 *                 description: Тип проекта
 *               address:
 *                 type: string
 *                 description: Адрес проекта
 *               customer_id:
 *                 type: integer
 *                 description: ID заказчика
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Дата начала
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Дата окончания
 *               planned_budget:
 *                 type: number
 *                 format: decimal
 *                 description: Планируемый бюджет
 *               actual_budget:
 *                 type: number
 *                 format: decimal
 *                 description: Фактический бюджет
 *               status:
 *                 type: integer
 *                 description: Статус проекта
 *               manager_id:
 *                 type: integer
 *                 description: ID менеджера проекта
 *               description:
 *                 type: string
 *                 description: Описание проекта
 *     responses:
 *       201:
 *         description: Проект успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 2, 3), createProject);

/**
 * @swagger
 * /api/projects/update/{id}:
 *   put:
 *     summary: Обновление проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID проекта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: integer
 *               address:
 *                 type: string
 *               customer_id:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               planned_budget:
 *                 type: number
 *                 format: decimal
 *               actual_budget:
 *                 type: number
 *                 format: decimal
 *               status:
 *                 type: integer
 *               manager_id:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Проект успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Проект не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateProject);

/**
 * @swagger
 * /api/projects/delete/{id}:
 *   delete:
 *     summary: Удаление проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Проект успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Проект не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteProject);

module.exports = router;