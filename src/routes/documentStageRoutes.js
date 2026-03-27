const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
    getAllDocumentStages,
    searchDocumentStages,
    getDocumentStageById,
    createDocumentStage,
    updateDocumentStage,
    deleteDocumentStage
} = require('../controllers/documentStageController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DocumentStages
 *   description: API для управления этапами юридических документов
 */


/**
 * @swagger
 * /api/documentStages/gets:
 *   get:
 *     summary: Получить список этапов документов
 *     tags: [DocumentStages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список этапов
 */
router.get('/gets', authenticateToken, getAllDocumentStages);


/**
 * @swagger
 * /api/documentStages/search:
 *   post:
 *     summary: Поиск этапов документов
 *     tags: [DocumentStages]
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
 *                 example: Подписание
 *               project_id:
 *                 type: integer
 *                 example: 3
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Результат поиска
 */
router.post('/search', authenticateToken, searchDocumentStages);


/**
 * @swagger
 * /api/documentStages/getById/{id}:
 *   get:
 *     summary: Получить этап документа по ID
 *     tags: [DocumentStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Этап найден
 *       404:
 *         description: Этап не найден
 */
router.get('/getById/:id', authenticateToken, getDocumentStageById);


/**
 * @swagger
 * /api/documentStages/create:
 *   post:
 *     summary: Создание нового этапа документа
 *     tags: [DocumentStages]
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
 *                 example: Подписание договора
 *               project_id:
 *                 type: integer
 *                 example: 2
 *                 description: ID проекта
 *     responses:
 *       201:
 *         description: Этап успешно создан
 */
router.post('/create', authenticateToken, createDocumentStage);


/**
 * @swagger
 * /api/documentStages/update/{id}:
 *   put:
 *     summary: Обновление этапа документа
 *     tags: [DocumentStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Проверка договора
 *               project_id:
 *                 type: integer
 *                 example: 2
 *               comment:
 *                 type: string
 *                 example: Переименовали этап
 *     responses:
 *       200:
 *         description: Этап обновлён
 */
router.put('/update/:id', authenticateToken, updateDocumentStage);


/**
 * @swagger
 * /api/documentStages/delete/{id}:
 *   delete:
 *     summary: Удаление этапа документа
 *     tags: [DocumentStages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteDocumentStage);

module.exports = router;