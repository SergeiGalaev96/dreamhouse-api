const express = require("express");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const {
  getAllWorkPerformedItems,
  searchWorkPerformedItems,
  getWorkPerformedItemById,
  createWorkPerformedItem,
  updateWorkPerformedItem,
  deleteWorkPerformedItem
} = require("../controllers/workPerformedItemController");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WorkPerformedItems
 *   description: API для управления позициями актов выполненных работ
 */


/**
 * @swagger
 * /api/workPerformedItems/gets:
 *   get:
 *     summary: Получение списка позиций актов выполненных работ
 *     tags: [WorkPerformedItems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список позиций актов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.get("/gets", authenticateToken, getAllWorkPerformedItems);


/**
 * @swagger
 * /api/workPerformedItems/search:
 *   post:
 *     summary: Поиск позиций актов выполненных работ
 *     tags: [WorkPerformedItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               work_performed_id:
 *                 type: integer
 *                 example: 1
 *               material_estimate_item_id:
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
 *         description: Результаты поиска позиций актов
 *       401:
 *         description: Неавторизованный доступ
 *       500:
 *         description: Ошибка сервера
 */
router.post("/search", authenticateToken, searchWorkPerformedItems);


/**
 * @swagger
 * /api/workPerformedItems/getById/{id}:
 *   get:
 *     summary: Получение позиции акта по ID
 *     tags: [WorkPerformedItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции акта
 *     responses:
 *       200:
 *         description: Данные позиции акта
 *       404:
 *         description: Позиция не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.get("/getById/:id", authenticateToken, getWorkPerformedItemById);


/**
 * @swagger
 * /api/workPerformedItems/create:
 *   post:
 *     summary: Создание позиции акта выполненных работ
 *     tags: [WorkPerformedItems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - work_performed_id
 *               - unit_of_measure
 *               - quantity
 *               - price
 *             properties:
 *               work_performed_id:
 *                 type: integer
 *                 example: 1
 *               material_estimate_item_id:
 *                 type: integer
 *                 example: 5
 *               unit_of_measure:
 *                 type: integer
 *                 example: 3
 *               quantity:
 *                 type: number
 *                 example: 1
 *               price:
 *                 type: number
 *                 example: 2500
 *               currency:
 *                 type: integer
 *                 example: 1
 *               currency_rate:
 *                 type: number
 *                 example: 90
 *     responses:
 *       201:
 *         description: Позиция акта успешно создана
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Ошибка сервера
 */
router.post("/create", authenticateToken, createWorkPerformedItem);


/**
 * @swagger
 * /api/workPerformedItems/update/{id}:
 *   put:
 *     summary: Обновление позиции акта выполненных работ
 *     tags: [WorkPerformedItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции акта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unit_of_measure:
 *                 type: integer
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               currency:
 *                 type: integer
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Позиция акта успешно обновлена
 *       404:
 *         description: Позиция не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.put("/update/:id", authenticateToken, updateWorkPerformedItem);


/**
 * @swagger
 * /api/workPerformedItems/delete/{id}:
 *   delete:
 *     summary: Удаление позиции акта выполненных работ
 *     tags: [WorkPerformedItems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID позиции акта
 *     responses:
 *       200:
 *         description: Позиция акта успешно удалена
 *       404:
 *         description: Позиция не найдена
 *       500:
 *         description: Ошибка сервера
 */
router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeRole(1, 2, 3),
  deleteWorkPerformedItem
);

module.exports = router;