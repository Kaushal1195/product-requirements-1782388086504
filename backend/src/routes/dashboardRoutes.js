const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Manager Dashboard
router.get('/manager', authenticateToken, authorizeRoles(['MANAGER']), dashboardController.getManagerDashboard);

// Employee Dashboard
router.get('/employee', authenticateToken, authorizeRoles(['EMPLOYEE']), dashboardController.getEmployeeDashboard);

module.exports = router;
