const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateSupplier } = require('../middleware/validation');
const { 
  getAllSuppliers,
  searchSuppliers,
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} = require('../controllers/supplierController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: API для управления поставщиками
 */

/**
 * @swagger
 * /api/suppliers/gets:
 *   get:
 *     summary: Получение списка поставщиков
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список поставщиков
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllSuppliers);


/**
 * @swagger
 * /api/suppliers/search:
 *   post:
 *     summary: Поиск поставщиков
 *     description: Выполняет поиск поставщиков
 *     tags:
 *       - Suppliers
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
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск поставщиков
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchSuppliers);

/**
 * @swagger
 * /api/suppliers/getById/{id}:
 *   get:
 *     summary: Получение поставщика по ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID поставщика
 *     responses:
 *       200:
 *         description: Данные поставщика
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Поставщик не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getSupplierById);

/**
 * @swagger
 * /api/suppliers/create:
 *   post:
 *     summary: Создание нового поставщика
 *     tags: [Suppliers]
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
 *                 example: "ОсОО СтройСнаб"
 *                 description: Название поставщика
 *
 *               inn:
 *                 type: string
 *                 example: "01234567890123"
 *                 description: ИНН поставщика
 *
 *               kpp:
 *                 type: string
 *                 example: "012345678"
 *                 description: КПП
 *
 *               ogrn:
 *                 type: string
 *                 example: "1234567890123"
 *                 description: ОГРН
 *
 *               address:
 *                 type: string
 *                 example: "г. Бишкек, ул. Ленина, 10"
 *                 description: Юридический адрес
 *
 *               phone:
 *                 type: string
 *                 example: "+996700123456"
 *                 description: Телефон
 *
 *               email:
 *                 type: string
 *                 example: "info@stroysnab.kg"
 *                 description: Email
 *
 *               contact_person:
 *                 type: string
 *                 example: "Иванов Иван"
 *                 description: Контактное лицо
 *
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 4.5
 *                 description: Рейтинг поставщика
 *     responses:
 *       201:
 *         description: Поставщик успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createSupplier);

/**
 * @swagger
 * /api/suppliers/update/{id}:
 *   put:
 *     summary: Обновление поставщика
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID поставщика
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
 *               type:
 *                 type: integer
 *               address:
 *                 type: string
 *               customer_id:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               planned_budget:
 *                 type: number
 *                 format: decimal
 *               actual_budget:
 *                 type: number
 *                 format: decimal
 *               status:
 *                 type: integer
 *               manager_id:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Поставщик успешно обновлен
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Поставщик не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateSupplier);

/**
 * @swagger
 * /api/suppliers/delete/{id}:
 *   delete:
 *     summary: Удаление поставщика
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID поставщика
 *     responses:
 *       200:
 *         description: Поставщик успешно удален
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Поставщик не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteSupplier);

module.exports = router;