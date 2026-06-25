const { pool } = require('../db');

// Manager Dashboard
exports.getManagerDashboard = async (req, res) => {
    try {
        // Total Tasks
        const totalTasksResult = await pool.query('SELECT COUNT(*) FROM tasks');
        const totalTasks = parseInt(totalTasksResult.rows[0].count);

        // Completed Tasks
        const completedTasksResult = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'COMPLETED'");
        const completedTasks = parseInt(completedTasksResult.rows[0].count);

        // Pending Tasks
        const pendingTasksResult = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'PENDING'");
        const pendingTasks = parseInt(pendingTasksResult.rows[0].count);

        // Number of Employees
        const employeesResult = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'EMPLOYEE'");
        const numEmployees = parseInt(employeesResult.rows[0].count);

        // Task Status Distribution
        const statusDistributionResult = await pool.query("SELECT status, COUNT(*) FROM tasks GROUP BY status");
        const taskStatusDistribution = statusDistributionResult.rows.reduce((acc, row) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, {});

        // Employee Performance (tasks completed per employee)
        const employeePerformanceResult = await pool.query(`
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                COUNT(t.id) AS completed_tasks_count
            FROM users u
            LEFT JOIN tasks t ON u.id = t.assigned_to_user_id AND t.status = 'COMPLETED'
            WHERE u.role = 'EMPLOYEE'
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY completed_tasks_count DESC, u.last_name, u.first_name;
        `);
        const employeePerformance = employeePerformanceResult.rows.map(row => ({
            id: row.id,
            first_name: row.first_name,
            last_name: row.last_name,
            completed_tasks_count: parseInt(row.completed_tasks_count)
        }));

        res.status(200).json({
            totalTasks,
            completedTasks,
            pendingTasks,
            numEmployees,
            taskStatusDistribution,
            employeePerformance,
            // Recent activity could be added here if an audit log table was implemented
        });
    } catch (error) {
        console.error('Error fetching manager dashboard data:', error);
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
};

// Employee Dashboard
exports.getEmployeeDashboard = async (req, res) => {
    const employeeId = req.user.id;

    try {
        // Total Assigned Tasks
        const totalAssignedTasksResult = await pool.query(
            'SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = $1',
            [employeeId]
        );
        const totalAssignedTasks = parseInt(totalAssignedTasksResult.rows[0].count);

        // Completed Tasks
        const completedTasksResult = await pool.query(
            "SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = $1 AND status = 'COMPLETED'",
            [employeeId]
        );
        const completedTasks = parseInt(completedTasksResult.rows[0].count);

        // Pending Tasks
        const pendingTasksResult = await pool.query(
            "SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = $1 AND status = 'PENDING'",
            [employeeId]
        );
        const pendingTasks = parseInt(pendingTasksResult.rows[0].count);

        // Tasks Due Today
        const tasksDueTodayResult = await pool.query(
            "SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = $1 AND due_date = CURRENT_DATE AND status IN ('PENDING', 'IN_PROGRESS', 'BLOCKED')",
            [employeeId]
        );
        const tasksDueToday = parseInt(tasksDueTodayResult.rows[0].count);

        // Recent Tasks (e.g., last 5 updated or created)
        const recentTasksResult = await pool.query(
            `SELECT id, title, description, priority, status, due_date, created_at, updated_at
             FROM tasks
             WHERE assigned_to_user_id = $1
             ORDER BY updated_at DESC, created_at DESC
             LIMIT 5`,
            [employeeId]
        );
        const recentTasks = recentTasksResult.rows;

        res.status(200).json({
            totalAssignedTasks,
            completedTasks,
            pendingTasks,
            tasksDueToday,
            recentTasks,
        });
    } catch (error) {
        console.error('Error fetching employee dashboard data:', error);
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
};
