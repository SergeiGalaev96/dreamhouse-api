const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  getAllContractors,
  searchContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor
} = require('../controllers/contractorController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contractors
 *   description: API для управления контракторами
 */

/**
 * @swagger
 * /api/contractors/gets:
 *   get:
 *     summary: Получение списка контракторов
 *     tags: [Contractors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список контракторов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllContractors);


/**
 * @swagger
 * /api/contractors/search:
 *   post:
 *     summary: Поиск и фильтрация контракторов
 *     tags: [Contractors]
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
 *                 description: Номер страницы
 *                 default: 1
 *                 example: 1
 *               size:
 *                 type: integer
 *                 description: Количество записей на странице
 *                 default: 10
 *                 example: 10
 *     responses:
 *       200:
 *         description: Список контракторов с фильтрацией
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchContractors);




/**
 * @swagger
 * /api/contractors/getById/{id}:
 *   get:
 *     summary: Получение контрактора по ID
 *     tags: [Contractors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID контрактора
 *     responses:
 *       200:
 *         description: Данные контрактора
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Контрактор не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getContractorById);

/**
 * @swagger
 * /api/contractors/create:
 *   post:
 *     summary: Создание нового контрактора
 *     tags: [Contractors]
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
 *               - inn
 *             properties:
 *               name:
 *                 type: string
 *                 description: № контрактора
 *               inn:
 *                 type: string
 *                 description: Тип контрактора
 *     responses:
 *       201:
 *         description: Контрактор успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createContractor);

/**
 * @swagger
 * /api/contractors/update/{id}:
 *   put:
 *     summary: Обновление контрактора
 *     tags: [Contractors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID контрактора
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               inn:
 *                 type: string
 *     responses:
 *       200:
 *         description: Контрактор успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Контрактор не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateContractor);

/**
 * @swagger
 * /api/contractors/delete/{id}:
 *   delete:
 *     summary: Удаление контрактора
 *     tags: [Contractors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID контрактора
 *     responses:
 *       200:
 *         description: Контрактор успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Контрактор не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, deleteContractor);

module.exports = router;