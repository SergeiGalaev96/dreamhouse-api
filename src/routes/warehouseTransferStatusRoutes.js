const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAllWarehouseTransferStatuses } = require('../controllers/warehouseTransferStatusController');

const router = express.Router();

router.get('/gets', authenticateToken, getAllWarehouseTransferStatuses);

module.exports = router;
