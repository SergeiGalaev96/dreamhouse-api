const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const {
  getAllWorkPerformed,
  searchWorkPerformed,
  getWorkPerformedById,
  createWorkPerformed,
  updateWorkPerformed,
  deleteWorkPerformed
} = require('../controllers/workPerformedController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkPerformed
 *   description: API для управления актами выполненных работ
 */


/**
 * @swagger
 * /api/workPerformed/gets:
 *   get:
 *     summary: Получение списка актов выполненных работ
 *     tags: [WorkPerformed]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список актов выполненных работ
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get('/gets', authenticateToken, getAllWorkPerformed);

/**
 * @swagger
 * /api/workPerformed/search:
 *   post:
 *     summary: Поиск актов выполненных работ
 *     description: Поиск по коду акта, исполнителю и подписантам
 *     tags: [WorkPerformed]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               block_id:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 example: ACT-001
 *               status:
 *                 type: integer
 *                 example: 1
 *               page:
 *                 type: integer
 *                 example: 1
 *               size:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Результаты поиска актов выполненных работ
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/search', authenticateToken, searchWorkPerformed);


/**
 * @swagger
 * /api/workPerformed/getById/{id}:
 *   get:
 *     summary: Получение акта выполненных работ по ID
 *     tags: [WorkPerformed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта
 *     responses:
 *       200:
 *         description: Данные акта
 *       404:
 *         description: Акт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/getById/:id', authenticateToken, getWorkPerformedById);


/**
 * @swagger
 * /api/workPerformed/create:
 *   post:
 *     summary: Создание акта выполненных работ
 *     description: Создаёт акт выполненных работ вместе с позициями (items)
 *     tags: [WorkPerformed]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 20
 *               block_id:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 example: ACT-001
 *               foreman_user_id:
 *                 type: integer
 *                 example: 5
 *               signed_by_foreman:
 *                 type: boolean
 *                 example: false
 *               planning_engineer_user_id:
 *                 type: integer
 *                 example: 8
 *               signed_by_planning_engineer:
 *                 type: boolean
 *                 example: false
 *               main_engineer_user_id:
 *                 type: integer
 *                 example: 3
 *               signed_by_main_engineer:
 *                 type: boolean
 *                 example: false
 *               performed_person_name:
 *                 type: string
 *                 example: Бригада №2
 *               items:
 *                 type: array
 *                 description: Список выполненных работ
 *                 items:
 *                   type: object
 *                   properties:
 *                     material_estimate_item_id:
 *                       type: integer
 *                       example: 85
 *                     service_type:
 *                       type: integer
 *                       example: 1
 *                     service_id:
 *                       type: integer
 *                       example: 1
 *                     unit_of_measure:
 *                       type: integer
 *                       example: 12
 *                     stage_id:
 *                       type: integer
 *                       example: 12
 *                     subsection_id:
 *                       type: integer
 *                       example: 14
 *                     quantity:
 *                       type: number
 *                       example: 20
 *                     price:
 *                       type: number
 *                       example: 5000
 *                     currency:
 *                       type: integer
 *                       example: 1
 *                     currency_rate:
 *                       type: number
 *                       nullable: true
 *                       example: null
 *                     item_type:
 *                       type: integer
 *                       example: 1
 *                     comment:
 *                       type: string
 *                       example: ""
 *     responses:
 *       201:
 *         description: Акт успешно создан
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/create', authenticateToken, createWorkPerformed);


/**
 * @swagger
 * /api/workPerformed/update/{id}:
 *   put:
 *     summary: Обновление акта выполненных работ
 *     tags: [WorkPerformed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Акт успешно обновлен
 *       404:
 *         description: Акт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.put('/update/:id', authenticateToken, updateWorkPerformed);


/**
 * @swagger
 * /api/workPerformed/delete/{id}:
 *   delete:
 *     summary: Удаление акта выполненных работ
 *     tags: [WorkPerformed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID акта
 *     responses:
 *       200:
 *         description: Акт успешно удалён
 *       404:
 *         description: Акт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteWorkPerformed);

module.exports = router;