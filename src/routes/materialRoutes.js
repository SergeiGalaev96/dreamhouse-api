const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateMaterial } = require('../middleware/validation');
const {
  getAllMaterials,
  searchMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial
} = require('../controllers/materialController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: API для управления материалами
 */

/**
 * @swagger
 * /api/materials/gets:
 *   get:
 *     summary: Получение списка материалов
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterials);

/**
 * @swagger
 * /api/materials/search:
 *   post:
 *     summary: Поиск и фильтрация материалов
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: integer
 *               unit_of_measure:
 *                 type: integer
 *               page:
 *                 type: integer
 *                 default: 1
 *               size:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Список материалов
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterials);

/**
 * @swagger
 * /api/materials/getById/{id}:
 *   get:
 *     summary: Получение материала по ID
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала
 *     responses:
 *       200:
 *         description: Данные материала
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialById);

/**
 * @swagger
 * /api/materials/create:
 *   post:
 *     summary: Создание нового материала
 *     tags: [Materials]
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
 *               - unit_of_measure
 *             properties:
 *               code:
 *                 type: string
 *                 description: Код материала
 *               name:
 *                 type: string
 *                 description: Название материала
 *               type:
 *                 type: integer
 *                 description: Тип материала
 *               unit_of_measure:
 *                 type: integer
 *                 description: Единица измерения
 *               description:
 *                 type: string
 *                 description: Описание материала
 *     responses:
 *       201:
 *         description: Материал успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 2, 3), validateMaterial, createMaterial);

/**
 * @swagger
 * /api/materials/update/{id}:
 *   put:
 *     summary: Обновление материала
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: integer
 *               unit_of_measure:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Материал успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateMaterial);

/**
 * @swagger
 * /api/materials/delete/{id}:
 *   delete:
 *     summary: Удаление материала
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала
 *     responses:
 *       200:
 *         description: Материал успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterial);

module.exports = router;