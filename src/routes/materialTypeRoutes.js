const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { 
  getAllMaterialTypes,
  searchMaterialTypes,
  getMaterialTypeById, 
  createMaterialType, 
  updateMaterialType, 
  deleteMaterialType 
} = require('../controllers/materialTypeController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialTypes
 *   description: API для управления Типами материалов
 */

/**
 * @swagger
 * /api/materialTypes/gets:
 *   get:
 *     summary: Получение списка типов материалов
 *     tags: [MaterialTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список типов материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialTypes);

/**
 * @swagger
 * /api/materialTypes/search:
 *   post:
 *     summary: Поиск и фильтрация типов материалов
 *     tags: [MaterialTypes]
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
 *         description: Список типов материалов
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterialTypes);

/**
 * @swagger
 * /api/materialTypes/getById/{id}:
 *   get:
 *     summary: Получение типа материала по ID
 *     tags: [MaterialTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID типа материала
 *     responses:
 *       200:
 *         description: Данные типа материала
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Тип материала не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialTypeById);

/**
 * @swagger
 * /api/materialTypes/create:
 *   post:
 *     summary: Создание нового типа материала
 *     tags: [MaterialTypes]
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
 *                 description: Название типа материалов
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
router.post('/create', authenticateToken, authorizeRole(1, 2, 3), createMaterialType);

/**
 * @swagger
 * /api/materialTypes/update/{id}:
 *   put:
 *     summary: Обновление материала
 *     tags: [MaterialTypes]
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
 *         description: Тип материала успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Тип материала не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, authorizeRole(1, 2, 3), updateMaterialType);

/**
 * @swagger
 * /api/materialTypes/delete/{id}:
 *   delete:
 *     summary: Удаление материала
 *     tags: [MaterialTypes]
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
 *         description: Тип материала успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Тип материала не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialType);

module.exports = router;