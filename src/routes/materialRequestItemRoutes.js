express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
    getAllMaterialRequestItems,
    searchMaterialRequestItems,
    getMaterialRequestItemById,
    createMaterialRequestItem,
    updateMaterialRequestItem,
    deleteMaterialRequestItem
} = require('../controllers/materialRequestItemController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MaterialRequestItems
 *   description: API для управления списком материалов в заявках
 */

/**
 * @swagger
 * /api/materialRequestItems/gets:
 *   get:
 *     summary: Получить список материалов в заявках
 *     tags: [MaterialRequestItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список материалов в заявках
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllMaterialRequestItems);

/**
 * @swagger
 * /api/materialRequestItems/search:
 *   post:
 *     summary: Поиск материалов для снабженца с подсчетом заказанного
 *     description: Возвращает материалы из заявок, поддерживает поиск по названию материала и ID, фильтрацию по статусам заявки, а также считает количество уже заказанного
 *     tags:
 *       - MaterialRequestItems
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
 *                 description: Поиск по названию материала или ID материала
 *                 example: "цемент"
 *               material_type:
 *                 type: integer
 *                 example: 2
 *               material_id:
 *                 type: integer
 *                 example: 15
 *               project_id:
 *                 type: integer
 *                 example: 1
 *               block_id:
 *                 type: integer
 *                 example: 3
 *               statuses:
 *                 oneOf:
 *                   - type: integer
 *                   - type: array
 *                     items:
 *                       type: integer
 *                 description: Фильтр по статусам заявки (можно передать один или массив)
 *                 example: [2, 3]
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Успешный поиск материалов для снабженца
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       material_request_id:
 *                         type: integer
 *                       material_id:
 *                         type: integer
 *                       material_type:
 *                         type: integer
 *                       quantity:
 *                         type: number
 *                       total_ordered:
 *                         type: number
 *                       remaining_quantity:
 *                         type: number
 *                       material:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     size:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Доступ запрещён
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchMaterialRequestItems);

/**
 * @swagger
 * /api/materialRequestItems/getById/{id}:
 *   get:
 *     summary: Получить материал в заявке по ID
 *     tags: [MaterialRequestItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала в заявке
 *     responses:
 *       200:
 *         description: Материал в заявке
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал в заявке не найден
 *       500:
 *         description: Ошибка сервера
 */

router.get('/getById/:id', authenticateToken, getMaterialRequestItemById);

/**
 * @swagger
 * /api/materialRequestItems/create:
 *   post:
 *     summary: Создать материал в заявке
 *     tags: [MaterialRequestItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - material_request_id
 *               - material_type
 *               - material_id
 *               - quantity
 *             properties:
 *               material_request_id:
 *                 type: integer
 *               material_type:
 *                 type: integer
 *               material_id:
 *                 type: integer
 *               unit_of_measure:
 *                 type: number
 *                 format: double
 *               quantity:
 *                 type: number
 *                 format: double
 *               price:
 *                 type: number
 *                 format: double
 *               summ:
 *                 type: number
 *                 format: double
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Материал в заявке создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createMaterialRequestItem);

/**
 * @swagger
 * /api/materialRequestItems/update/{id}:
 *   put:
 *     summary: Обновить материал в заявке
 *     tags: [MaterialRequestItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала в заявке
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - material_request_id
 *             properties:
 *               material_request_id:
 *                 type: integer
 *               material_type:
 *                 type: integer
 *               material_id:
 *                 type: integer
 *               unit_of_measure:
 *                 type: number
 *                 format: double
 *               quantity:
 *                 type: number
 *                 format: double
 *               price:
 *                 type: number
 *                 format: double
 *               summ:
 *                 type: number
 *                 format: double
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Материал в заявке обновлён
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал в заявке не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateMaterialRequestItem);

/**
 * @swagger
 * /api/materialRequestItems/delete/{id}:
 *   delete:
 *     summary: Удалить материал в заявке
 *     tags: [MaterialRequestItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID материала в заявке
 *     responses:
 *       200:
 *         description: Материал в заявке удалён
 *       401:
 *         description: Неавторизованный доступ
 *       404:
 *         description: Материал в заявке не найден
 *       500:
 *         description: Ошибка сервера
 */

router.delete('/delete/:id', authenticateToken, authorizeRole(1), deleteMaterialRequestItem);

module.exports = router;