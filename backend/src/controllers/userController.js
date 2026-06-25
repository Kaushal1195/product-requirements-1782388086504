const { pool } = require('../db');

// View Employees (Manager)
exports.getEmployees = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, first_name, last_name, role, created_at, updated_at
             FROM users
             WHERE role = 'EMPLOYEE'
             ORDER BY last_name, first_name`
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Server error fetching employees.' });
    }
};
