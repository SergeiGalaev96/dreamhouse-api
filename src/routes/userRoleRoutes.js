const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getUserRoles } = require('../controllers/userRolesController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: UserRoles
 *   description: Управление ролями пользователей
 */

/**
 * @swagger
 * /api/userRoles/gets:
 *   get:
 *     summary: Получить список всех ролей пользователей
 *     tags: [UserRoles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Успешный ответ со списком ролей
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Неавторизован
 *       500:
 *         description: Ошибка сервера
 */

router.get('/gets', authenticateToken, getUserRoles);


module.exports = router;