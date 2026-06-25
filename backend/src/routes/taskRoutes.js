const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Manager-only routes
router.post('/', authenticateToken, authorizeRoles(['MANAGER']), taskController.createTask); // AC6
router.get('/', authenticateToken, authorizeRoles(['MANAGER']), taskController.getAllTasks); // View All Tasks & Search/Filter (Manager)
router.put('/:id', authenticateToken, authorizeRoles(['MANAGER']), taskController.updateTask); // AC6 (edit any detail)
router.delete('/:id', authenticateToken, authorizeRoles(['MANAGER']), taskController.deleteTask); // AC6

// Shared route (Manager can view any, Employee can view assigned)
router.get('/:id', authenticateToken, taskController.getTaskById);

// Employee-specific routes
// Employee can only view tasks assigned to them, handled by controller logic
router.get('/my-tasks', authenticateToken, authorizeRoles(['EMPLOYEE']), taskController.getEmployeeTasks); // AC7
router.patch('/:id/status', authenticateToken, authorizeRoles(['EMPLOYEE']), taskController.updateTaskStatus); // AC8, AC9, AC12

module.exports = router;
