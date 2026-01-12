const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  getAllContracts,
  searchContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
} = require('../controllers/contractController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contracts
 *   description: API для управления контрактами
 */

/**
 * @swagger
 * /api/contracts/gets:
 *   get:
 *     summary: Получение списка контрактов
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список контрактов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllContracts);


/**
 * @swagger
 * /api/contracts/search:
 *   post:
 *     summary: Поиск и фильтрация контрактов
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
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
 *         description: Список контрактов с фильтрацией
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchContracts);




/**
 * @swagger
 * /api/contracts/getById/{id}:
 *   get:
 *     summary: Получение контракта по ID
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID контракта
 *     responses:
 *       200:
 *         description: Данные контракта
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Контракт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getContractById);

/**
 * @swagger
 * /api/contracts/create:
 *   post:
 *     summary: Создание нового контракта
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - type
 *             properties:
 *               number:
 *                 type: string
 *                 description: № контракта
 *               type:
 *                 type: string
 *                 description: Тип контракта
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Дата контракта
 *               project_id:
 *                 type: integer
 *                 description: ID проекта
 *               contract_id:
 *                 type: integer
 *                 description: ID договора
 *               file_path:
 *                 type: string
 *                 description: Путь к файлу
 *               file_size:
 *                 type: integer
 *                 description: Размер файла
 *               mime_type:
 *                 type: string
 *                 description: MIME-тип файла
 *               status:
 *                 type: integer
 *                 description: Статус контракта
 *               version:
 *                 type: integer
 *                 description: Версия контракта
 *               description:
 *                 type: string
 *                 description: Описание контракта
 *     responses:
 *       201:
 *         description: Контракт успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createContract);

/**
 * @swagger
 * /api/contracts/update/{id}:
 *   put:
 *     summary: Обновление контракта
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID контракта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               number:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               project_id:
 *                 type: integer
 *               contractor_id:
 *                 type: integer
 *               file_path:
 *                 type: string
 *               file_size:
 *                 type: integer
 *               mime_type:
 *                 type: string
 *               status:
 *                 type: integer
 *               version:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Контракт успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Контракт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateContract);

/**
 * @swagger
 * /api/contracts/delete/{id}:
 *   delete:
 *     summary: Удаление контракта
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID контракта
 *     responses:
 *       200:
 *         description: Контракт успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Контракт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, deleteContract);

module.exports = router;