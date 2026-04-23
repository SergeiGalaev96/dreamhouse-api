const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const {
  getWorkPerformedReport,
  getForm29Report,
  getForm2Report,
  getForm19Report,
  getMbpWriteOffReport,
  getEstimateStageReport,
  getScheduleReport,
  getMaterialScheduleReport
} = require('../controllers/reportController');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API для отчетов
 */

/**
 * @swagger
 * /api/reports/workPerformed/{id}:
 *   get:
 *     summary: Отчет по акту выполненных работ
 *     tags: [Reports]
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
 *         description: Данные отчета
 *       404:
 *         description: Акт не найден
 *       500:
 *         description: Ошибка сервера
 */
router.get('/workPerformed/:id', authenticateToken, getWorkPerformedReport);

/**
 * @swagger
 * /api/reports/form29:
 *   post:
 *     summary: Отчет Форма 29 по блоку и периоду
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - block_id
 *               - date_from
 *               - date_to
 *             properties:
 *               block_id:
 *                 type: integer
 *               date_from:
 *                 type: string
 *                 format: date
 *               date_to:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Данные отчета Форма 29
 *       400:
 *         description: Некорректные параметры
 */
router.post('/form29', authenticateToken, getForm29Report);

/**
 * @swagger
 * /api/reports/form2:
 *   post:
 *     summary: Отчет Форма 2 по блоку и периоду
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - block_id
 *               - date_from
 *               - date_to
 *             properties:
 *               block_id:
 *                 type: integer
 *               date_from:
 *                 type: string
 *                 format: date
 *               date_to:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Данные отчета Форма 2
 *       400:
 *         description: Некорректные параметры
 */
router.post('/form2', authenticateToken, getForm2Report);

/**
 * @swagger
 * /api/reports/form19:
 *   post:
 *     summary: Отчет Ф-19 по складу и периоду
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - warehouse_id
 *               - date_from
 *               - date_to
 *             properties:
 *               warehouse_id:
 *                 type: integer
 *               date_from:
 *                 type: string
 *                 format: date
 *               date_to:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Данные отчета Ф-19
 */
router.post('/form19', authenticateToken, getForm19Report);

/**
 * @swagger
 * /api/reports/mbp-write-off:
 *   post:
 *     summary: Отчет по списаниям МБП по объекту и периоду
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *               - date_from
 *               - date_to
 *             properties:
 *               project_id:
 *                 type: integer
 *               warehouse_id:
 *                 type: integer
 *               date_from:
 *                 type: string
 *                 format: date
 *               date_to:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Данные отчета по списаниям МБП
 */
router.post('/mbp-write-off', authenticateToken, getMbpWriteOffReport);

/**
 * @swagger
 * /api/reports/estimate-stage:
 *   post:
 *     summary: Сметный отчет по этапам и подэтапам блока
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - block_id
 *             properties:
 *               block_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Данные сметного отчета
 *       400:
 *         description: Некорректные параметры
 */
router.post('/estimate-stage', authenticateToken, getEstimateStageReport);

/**
 * @swagger
 * /api/reports/schedule:
 *   post:
 *     summary: График работ по объекту
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *             properties:
 *               project_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Данные календарного графика
 */
router.post('/schedule', authenticateToken, getScheduleReport);

/**
 * @swagger
 * /api/reports/material-schedule:
 *   post:
 *     summary: Календарный график поставки материалов по объекту
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_id
 *             properties:
 *               project_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Данные календарного графика поставки материалов
 */
router.post('/material-schedule', authenticateToken, getMaterialScheduleReport);

module.exports = router;
