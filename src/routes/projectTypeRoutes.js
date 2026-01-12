express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
// const { validateProjectType } = require('../middleware/validation');
const { getAllProjectTypes, searchProjectTypes, getProjectTypeById, createProjectType, updateProjectType, deleteProjectType } = require('../controllers/projectTypesController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectTypes
 *   description: API для управления типами проектов
 */

/**
 * @swagger
 * /api/projectTypes/gets:
 *   get:
 *     summary: Получить список типов проектов
 *     tags: [ProjectTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список типов проектов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllProjectTypes);

// /**
//  * @swagger
//  * /api/projectTypes/search:
//  *   post:
//  *     summary: Поиск типов проектов
//  *     description: Выполняет поиск типов проектов
//  *     tags:
//  *       - ProjectTypes
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
//  *         description: Успешный поиск типов проектов
//  *       401:
//  *         description: Неавторизован
//  *       403:
//  *         description: Доступ запрещён
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.post('/search', authenticateToken, searchProjectTypes);

// /**
//  * @swagger
//  * /api/projectTypes/getById/{id}:
//  *   get:
//  *     summary: Получить тип проекта по ID
//  *     tags: [ProjectTypes]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID типа проекта
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

// router.get('/getById/:id', authenticateToken, getProjectTypeById);

// /**
//  * @swagger
//  * /api/projectTypes/create:
//  *   post:
//  *     summary: Создать тип проекта
//  *     tags: [ProjectTypes]
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
//  *                 description: Название типа проекта
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
// router.post('/create', authenticateToken, authorizeRole(1), createProjectType);

// /**
//  * @swagger
//  * /api/projectTypes/update/{id}:
//  *   put:
//  *     summary: Обновить тип проекта
//  *     tags: [ProjectTypes]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID типа проекта
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 description: Название типа проекта
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
// router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateProjectType);

// /**
//  * @swagger
//  * /api/projectTypes/delete/{id}:
//  *   delete:
//  *     summary: Удалить тип проекта
//  *     tags: [ProjectTypes]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID типа проекта
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

// router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteProjectType);

module.exports = router;