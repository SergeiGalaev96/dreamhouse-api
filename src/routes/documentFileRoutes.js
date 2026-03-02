const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/uploadDocumentFile');
const {
  uploadDocumentFile,
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
 *     summary: Загрузить файл в документ
 *     tags: [DocumentFiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: document_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Файл загружен
 *       409:
 *         description: Файл с таким именем уже существует
 */
router.post('/upload/:document_id',  authenticateToken, upload.single('file'), uploadDocumentFile);

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
