const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getAllMaterialMovements,
  searchMaterialMovements,
  getMaterialMovementById,
  createMaterialMovement,
  updateMaterialMovement,
  deleteMaterialMovement
} = require('../controllers/materialMovementController');

const router = express.Router();

router.get('/gets', authenticateToken, getAllMaterialMovements);
router.post('/search', authenticateToken, searchMaterialMovements);
router.get('/getById/:id', authenticateToken, getMaterialMovementById);
router.post('/create', authenticateToken, createMaterialMovement);
router.put('/update/:id', authenticateToken, updateMaterialMovement);
router.delete('/delete/:id', authenticateToken, authorizeRole(1, 2, 3), deleteMaterialMovement);

module.exports = router;
