const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { register } = require('../controllers/pushTokenController');

const router = express.Router();

router.post('/register', authenticateToken, register);

module.exports = router;
