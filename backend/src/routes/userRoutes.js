const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Manager-only route to view employees
router.get('/employees', authenticateToken, authorizeRoles(['MANAGER']), userController.getEmployees); // View Employees (Manager)

module.exports = router;
