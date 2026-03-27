const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/uploadDocumentFile');
const {
  uploadDocumentFiles,
  getDocumentFiles,
  downloadDocumentFile,
  deleteDocumentFile
} = require('../controllers/documentFileController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DocumentFiles
 *   description: Файлы документов (загрузка, скачивание, удаление)
 */

/**
 * @swagger
 * /api/documentFiles/files/{document_id}:
 *   get:
 *     summary: Получить список файлов документа
 *     tags: [DocumentFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список файлов
 */
router.get('/files/:document_id', authenticateToken, getDocumentFiles);

/**
 * @swagger
 * /api/documentFiles/upload/{document_id}:
 *   post:
 *     summary: Загрузить файлы в документ
 *     tags: [DocumentFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID документа
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Файлы успешно загружены
 *       400:
 *         description: Файлы не переданы или тип файла запрещён
 *       403:
 *         description: Нельзя добавлять файлы в текущем статусе документа
 *       404:
 *         description: Документ не найден
 *       409:
 *         description: Один из файлов уже существует
 *       500:
 *         description: Ошибка сервера
 */
router.post('/upload/:document_id',  authenticateToken, upload.array('files', 20), uploadDocumentFiles);

/**
 * @swagger
 * /api/documentFiles/download/{file_id}:
 *   get:
 *     summary: Скачать файл
 *     tags: [DocumentFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: file_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ID Файла
 */
router.get('/download/:file_id', authenticateToken, downloadDocumentFile);

/**
 * @swagger
 * /api/documentFiles/{file_id}:
 *   delete:
 *     summary: Удалить файл документа
 *     tags: [DocumentFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: file_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Файл удалён
 */
router.delete('/:file_id', authenticateToken, deleteDocumentFile);

module.exports = router;
