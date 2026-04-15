const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const {
  getWorkPerformedReport,
  getForm29Report,
  getForm2Report
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

module.exports = router;
