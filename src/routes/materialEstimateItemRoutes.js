const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
  getAllMaterialEstimateItems,
  searchMaterialEstimateItems,
  getMaterialEstimateItemById,
  createMaterialEstimateItems,
  updateMaterialEstimateItem,
  deleteMaterialEstimateItem
} = require('../controllers/materialEstimateItemController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialEstimateItems
 *   description: API для управления позициями смет материалов
 */

/**
 * @swagger
 * /api/materialEstimateItems/gets:
 *   get:
 *     summary: Получение списка позиций смет материалов
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Позиции смет материалов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialEstimateItems);

/**
 * @swagger
 * /api/materialEstimateItems/search:
 *   post:
 *     summary: Получение списка материалов из смет с подсчетом заказанного количества
 *     tags: [MaterialEstimateItems]
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
 *               block_id:
 *                 type: integer
 *                 example: 2
 *               item_type:
 *                 type: integer
 *                 example: 1
 *               material_name:
 *                 type: string
 *                 example: "Бетон"
 *               service_name:
 *                 type: string
 *                 example: "Заливка"
 * 
 *          
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       200:
 *         description: Список материалов сметы
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterialEstimateItems);

/**
 * @swagger
 * /api/materialEstimateItems/getById/{id}:
 *   get:
 *     summary: Получение позиции сметы по ID
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции сметы
 *     responses:
 *       200:
 *         description: Данные позиции сметы
 *       404:
 *         description: Позиция сметы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getMaterialEstimateItemById);

/**
 * @swagger
 * /api/materialEstimateItems/create:
 *   post:
 *     summary: Массовое создание или объединение позиций сметы
 *     description: 
 *       Создаёт новые позиции сметы или объединяет с существующими (увеличивает quantity_planned).
 *       Поддерживает материалы и услуги.
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             description: Список позиций сметы
 *             items:
 *               type: object
 *               required:
 *                 - material_estimate_id
 *                 - stage_id
 *                 - subsection_id
 *                 - item_type
 *                 - entry_type
 *                 - quantity_planned
 *               properties:
 *                 material_estimate_id:
 *                   type: integer
 *                   example: 1
 *                 stage_id:
 *                   type: integer
 *                   description: Этап
 *                   example: 10
 *                 subsection_id:
 *                   type: integer
 *                   description: Подэтап
 *                   example: 15
 *                 item_type:
 *                   type: integer
 *                   description: 1 = материал, 2 = услуга
 *                   example: 1
 *                 entry_type:
 *                   type: integer
 *                   description: 1 = основной, 2 = дополнительный
 *                   example: 1
 *                 service_type:
 *                   type: integer
 *                   nullable: true
 *                   example: 2
 *                 service_id:
 *                   type: integer
 *                   nullable: true
 *                   example: 5
 *                 material_type:
 *                   type: integer
 *                   nullable: true
 *                   example: 1
 *                 material_id:
 *                   type: integer
 *                   nullable: true
 *                   example: 12
 *                 unit_of_measure:
 *                   type: integer
 *                   example: 3
 *                 quantity_planned:
 *                   type: number
 *                   example: 150.5
 *                 coefficient:
 *                   type: number
 *                   nullable: true
 *                   example: 1.2
 *                 currency:
 *                   type: integer
 *                   nullable: true
 *                   example: 1
 *                 currency_rate:
 *                   type: number
 *                   nullable: true
 *                   example: 1
 *                 price:
 *                   type: number
 *                   nullable: true
 *                   example: 500
 *                 comment:
 *                   type: string
 *                   example: На фундамент
 *     responses:
 *       201:
 *         description: Позиции сметы успешно обработаны (созданы или объединены)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   description: Список созданных и обновлённых позиций
 *                   items:
 *                     type: object
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createMaterialEstimateItems);

/**
 * @swagger
 * /api/materialEstimateItems/update/{id}:
 *   put:
 *     summary: Обновление позиции сметы материалов
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции сметы
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Позиция сметы успешно обновлена
 *       404:
 *         description: Позиция сметы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialEstimateItem);

/**
 * @swagger
 * /api/materialEstimateItems/delete/{id}:
 *   delete:
 *     summary: Удаление позиции сметы материалов
 *     tags: [MaterialEstimateItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции сметы
 *     responses:
 *       200:
 *         description: Позиция сметы успешно удалена
 *       404:
 *         description: Позиция сметы не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialEstimateItem);

module.exports = router;