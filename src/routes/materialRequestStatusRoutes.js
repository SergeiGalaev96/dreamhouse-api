express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getAllMaterialRequestStatuses, searchMaterialRequestStatuses, getMaterialRequestStatusById, createMaterialRequestStatus, updateMaterialRequestStatus, deleteMaterialRequestStatus } = require('../controllers/materialRequestStatusController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialRequestStatuses
 *   description: API для управления Статусами заявок
 */

/**
 * @swagger
 * /api/materialRequestStatuses/gets:
 *   get:
 *     summary: Получить список статусов заявок
 *     tags: [MaterialRequestStatuses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список статусов заявок
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialRequestStatuses);

// /**
//  * @swagger
//  * /api/materialRequestStatuses/search:
//  *   post:
//  *     summary: Поиск статусов заявок
//  *     description: Выполняет поиск статусов заявок
//  *     tags:
//  *       - MaterialRequestStatuses
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
//  *         description: Успешный поиск статусов заявок
//  *       401:
//  *         description: Неавторизован
//  *       403:
//  *         description: Доступ запрещён
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.post('/search', authenticateToken, searchMaterialRequestStatuses);


// /**
//  * @swagger
//  * /api/materialRequestStatuses/getById/{id}:
//  *   get:
//  *     summary: Получить статус заявки по ID
//  *     tags: [MaterialRequestStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса заявки
//  *     responses:
//  *       200:
//  *         description: Заявка найдена
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Заявка не найдена
//  *       500:
//  *         description: Ошибка сервера
//  */

// router.get('/getById/:id', authenticateToken, getMaterialRequestStatusById);

// /**
//  * @swagger
//  * /api/materialRequestStatuses/create:
//  *   post:
//  *     summary: Создать статус заявки
//  *     tags: [MaterialRequestStatuses]
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
//  *         description: Статус заявки создан
//  *       400:
//  *         description: Ошибка валидации
//  *       401:
//  *         description: Неавторизованный доступ
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.post('/create', authenticateToken, authorizeRole(1), createMaterialRequestStatus);

// /**
//  * @swagger
//  * /api/materialRequestStatuses/update/{id}:
//  *   put:
//  *     summary: Обновить статус заявки
//  *     tags: [MaterialRequestStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса заявки
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 description: Название статуса заявки
//  *                 example: "В работе"
//  *     responses:
//  *       200:
//  *         description: Статус заявки обновлён
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Статус заявки не найден
//  *       500:
//  *         description: Ошибка сервера
//  */
// router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateMaterialRequestStatus);

// /**
//  * @swagger
//  * /api/materialRequestStatuses/delete/{id}:
//  *   delete:
//  *     summary: Удалить статус заявки
//  *     tags: [MaterialRequestStatuses]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: ID статуса заявки
//  *     responses:
//  *       200:
//  *         description: Статус заявки удалён
//  *       401:
//  *         description: Неавторизованный доступ
//  *       404:
//  *         description: Статус заявки не найден
//  *       500:
//  *         description: Ошибка сервера
//  */

// router.delete('/delete/:id', authenticateToken, authorizeRole(1), deleteMaterialRequestStatus);

module.exports = router;