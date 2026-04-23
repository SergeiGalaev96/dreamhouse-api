const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllProjectBlocks,
  searchProjectBlocks,
  getProjectBlockById,
  createProjectBlock,
  updateProjectBlock,
  deleteProjectBlock
} = require('../controllers/projectBlockController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ProjectBlocks
 *   description: API для управления блоками проекта
 */


/**
 * @swagger
 * /api/projectBlocks/gets:
 *   get:
 *     summary: Получение списка блоков проектов
 *     tags: [ProjectBlocks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список блоков
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllProjectBlocks);


/**
 * @swagger
 * /api/projectBlocks/search:
 *   post:
 *     summary: Поиск блоков проекта
 *     tags: [ProjectBlocks]
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
 *               project_id:
 *                 type: integer
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск блоков
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchProjectBlocks);


/**
 * @swagger
 * /api/projectBlocks/getById/{id}:
 *   get:
 *     summary: Получение блока проекта по ID
 *     tags: [ProjectBlocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID блока
 *     responses:
 *       200:
 *         description: Данные блока
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Блок не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getProjectBlockById);


/**
 * @swagger
 * /api/projectBlocks/create:
 *   post:
 *     summary: Создание нового блока проекта
 *     tags: [ProjectBlocks]
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
 *               - project_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название блока (например, Блок А)
 *               project_id:
 *                 type: integer
 *                 description: ID проекта
 *     responses:
 *       201:
 *         description: Блок успешно создан
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 10), createProjectBlock);


/**
 * @swagger
 * /api/projectBlocks/update/{id}:
 *   put:
 *     summary: Обновление блока проекта
 *     tags: [ProjectBlocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID блока
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               comment:
 *                 type: string
 *                 description: Комментарий для аудита изменений
 *     responses:
 *       200:
 *         description: Блок успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Блок не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 10), updateProjectBlock);


/**
 * @swagger
 * /api/projectBlocks/delete/{id}:
 *   delete:
 *     summary: Удаление блока проекта (soft delete)
 *     tags: [ProjectBlocks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID блока
 *     responses:
 *       200:
 *         description: Блок успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Блок не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 10), deleteProjectBlock);

module.exports = router;
