const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getAllUsers, createUser, searchUsers, getUserById, updateUser, resetPassword, changeOwnPassword, deleteUser } = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API для управления пользователями
 */

/**
 * @swagger
 * /api/users/gets:
 *   get:
 *     summary: Получение списка пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllUsers);


/**
 * @swagger
 * /api/users/search:
 *   post:
 *     summary: Поиск пользователей
 *     description: Выполняет поиск пользователей по имени, фамилии, email, телефону, username, а также фильтрацию по роли и активности.
 *     tags:
 *       - Users
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
 *                 example: "ivan"
 *               role_id:
 *                 type: integer
 *                 description: Фильтр по ID роли
 *                 example: 1
 *               page:
 *                 type: integer
 *                 description: Номер страницы
 *                 example: 1
 *               size:
 *                 type: integer
 *                 description: Количество записей на странице
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       username:
 *                         type: string
 *                         example: "ivanov"
 *                       email:
 *                         type: string
 *                         example: "ivanov@example.com"
 *                       first_name:
 *                         type: string
 *                         example: "Иван"
 *                       last_name:
 *                         type: string
 *                         example: "Иванов"
 *                       phone:
 *                         type: string
 *                         example: "+996700123456"
 *                       role_id:
 *                         type: integer
 *                         example: 2
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     size:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     pages:
 *                       type: integer
 *                       example: 5
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, authorizeRole(1), searchUsers);

/**
 * @swagger
 * /api/users/createUser:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role_id
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 description: Имя пользователя
 *               email:
 *                 type: string
 *                 description: Email пользователя
 *               password:
 *                 type: string
 *                 description: Пароль
 *               first_name:
 *                 type: string
 *                 description: Имя
 *               last_name:
 *                 type: string
 *                 description: Фамилия
 *               middle_name:
 *                 type: string
 *                 description: Отчество
 *               phone:
 *                 type: string
 *                 description: Тел
 *               role_id:
 *                 type: integer
 *                 description: ID роли пользователя
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Ошибка сервера
 */
router.post('/createUser', createUser);


/**
 * @swagger
 * /api/users/getById/{id}:
 *   get:
 *     summary: Получение пользователя по ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getUserById);

/**
 * @swagger
 * /api/users/update/{id}:
 *   put:
 *     summary: Обновление данных пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Пользователь успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateUser);

/**
 * @swagger
 * /api/users/resetPassword/{id}:
 *   put:
 *     summary: Сброс пароля пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пароль успешно обновлён
 *       400:
 *         description: Неверные данные
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/resetPassword/:id', authenticateToken, authorizeRole(1), resetPassword);

/**
 * @swagger
 * /api/users/changeOwnPassword:
 *   put:
 *     summary: Изменение собственного пароля
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: CurrentPassword123
 *               newPassword:
 *                 type: string
 *                 example: NewStrongPassword456
 *     responses:
 *       200:
 *         description: Пароль успешно изменён
 *       400:
 *         description: Неверные данные или неправильный текущий пароль
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */

router.put('/changeOwnPassword', authenticateToken, changeOwnPassword);


/**
 * @swagger
 * /api/users/delete/{id}:
 *   delete:
 *     summary: Удаление пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1), deleteUser);

module.exports = router;