const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const { 
  getAllUnitsOfMeasure,
  searchUnitsOfMeasure,
  getUnitOfMeasureById, 
  createUnitOfMeasure, 
  updateUnitOfMeasure, 
  deleteUnitOfMeasure 
} = require('../controllers/UnitOfMeasureController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: UnitsOfMeasure
 *   description: API для управления Единицами измерения
 */

/**
 * @swagger
 * /api/unitsOfMeasure/gets:
 *   get:
 *     summary: Получение списка единиц измерения
 *     tags: [UnitsOfMeasure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список единиц измерения
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllUnitsOfMeasure);

/**
 * @swagger
 * /api/unitsOfMeasure/search:
 *   post:
 *     summary: Поиск и фильтрация единиц измерения
 *     tags: [UnitsOfMeasure]
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
 *               page:
 *                 type: integer
 *                 default: 1
 *               size:
 *                 type: integer
 *                 default: 10
 *     responses:
 *       200:
 *         description: Список единиц измерения
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchUnitsOfMeasure);

/**
 * @swagger
 * /api/unitsOfMeasure/getById/{id}:
 *   get:
 *     summary: Получение единицы измерения по ID
 *     tags: [UnitsOfMeasure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID единицы измерения
 *     responses:
 *       200:
 *         description: Данные единицы измерения
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Единица измерения не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getUnitOfMeasureById);

/**
 * @swagger
 * /api/unitsOfMeasure/create:
 *   post:
 *     summary: Создание новой единицы измерения
 *     tags: [UnitsOfMeasure]
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
 *                 description: Название единицы измерения
 *     responses:
 *       201:
 *         description: Тп материала успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, authorizeRole(1, 2, 3), createUnitOfMeasure);

/**
 * @swagger
 * /api/unitsOfMeasure/update/{id}:
 *   put:
 *     summary: Обновление материала
 *     tags: [UnitsOfMeasure]
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Единица измерения успешно обновлена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Единица измерения не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateUnitOfMeasure);

/**
 * @swagger
 * /api/unitsOfMeasure/delete/{id}:
 *   delete:
 *     summary: Удаление материала
 *     tags: [UnitsOfMeasure]
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
 *         description: Единица измерения успешно удалена
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Единица измерения не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteUnitOfMeasure);

module.exports = router;