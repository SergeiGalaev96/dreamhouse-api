const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  getAllDocuments,
  searchDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument
} = require('../controllers/documentController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: API для управления документами
 */

/**
 * @swagger
 * /api/documents/gets:
 *   get:
 *     summary: Получение списка документов
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список документов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllDocuments);


/**
 * @swagger
 * /api/documents/search:
 *   post:
 *     summary: Поиск и фильтрация документов
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 1
 *               stage_id:
 *                 type: integer
 *                 example: 1
 *               status:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "string"
 *               description:
 *                 type: string
 *                 example: "string"
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
 *         description: Список документов с фильтрацией
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchDocuments);

/**
 * @swagger
 * /api/documents/getById/{id}:
 *   get:
 *     summary: Получение документа по ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID документа
 *     responses:
 *       200:
 *         description: Данные документа
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Документ не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getDocumentById);

/**
 * @swagger
 * /api/documents/create:
 *   post:
 *     summary: Создание нового документа
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document_name
 *               - document_type
 *             properties:
 *               document_name:
 *                 type: string
 *                 description: Название документа
 *               document_date:
 *                 type: string
 *                 format: date
 *                 description: Дата документа
 *               project_id:
 *                 type: integer
 *                 description: ID проекта
 *               status:
 *                 type: string
 *                 description: Статус документа
 *               version:
 *                 type: integer
 *                 description: Версия документа
 *               description:
 *                 type: string
 *                 description: Описание документа
 *     responses:
 *       201:
 *         description: Документ успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createDocument);

/**
 * @swagger
 * /api/documents/update/{id}:
 *   put:
 *     summary: Обновление документа
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID документа
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *               status:
 *                 type: string
 *               version:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Документ успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Документ не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateDocument);

/**
 * @swagger
 * /api/documents/delete/{id}:
 *   delete:
 *     summary: Удаление документа
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID документа
 *     responses:
 *       200:
 *         description: Документ успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Документ не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, deleteDocument);

module.exports = router;