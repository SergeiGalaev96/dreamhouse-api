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
 *               entity_type:
 *                 type: string
 *                 example: task
 *                 description: Тип объекта (task, project, purchase_order и т.д.)
 *               entity_id:
 *                 type: integer
 *                 example: 12
 *                 description: ID объекта
 *               status:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Договор"
 *               description:
 *                 type: string
 *                 example: "Техническая документация"
 *               page:
 *                 type: integer
 *                 default: 1
 *                 example: 1
 *               size:
 *                 type: integer
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
 *               - entity_type
 *               - entity_id
 *               - name
 *             properties:
 *               entity_type:
 *                 type: string
 *                 example: task
 *                 description: Тип объекта
 *               entity_id:
 *                 type: integer
 *                 example: 12
 *                 description: ID объекта
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 example: Договор
 *               status:
 *                 type: integer
 *                 example: 1
 *               description:
 *                 type: string
 *                 example: Техническая документация
 *               deadline:
 *                 type: string
 *                 example: 2026-03-01
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
 *               name:
 *                 type: string
 *                 example: Обновленный документ
 *               status:
 *                 type: integer
 *                 example: 2
 *               description:
 *                 type: string
 *                 example: Новое описание
 *               deadline:
 *                 type: string
 *                 example: 2026-04-01
 *     responses:
 *       200:
 *         description: Документ успешно обновлён
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