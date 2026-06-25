const { pool } = require('../db');
const { isValidUUID, userExistsAndHasRole, isValidStatusTransition } = require('../utils/validation');

// --- Manager Actions ---

// AC6: Manager Creates Task
exports.createTask = async (req, res) => {
    const { title, description, priority, status, due_date, assigned_to_user_id } = req.body;
    const created_by_user_id = req.user.id; // Manager's ID from JWT

    // 1. Basic Input Validation
    if (!title || !due_date || !assigned_to_user_id) {
        return res.status(400).json({ message: 'Title, due date, and assigned employee are required.' });
    }

    // Validate priority and status enums
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELED'];
    const taskPriority = priority ? priority.toUpperCase() : 'MEDIUM';
    const taskStatus = status ? status.toUpperCase() : 'PENDING';

    if (!validPriorities.includes(taskPriority)) {
        return res.status(400).json({ message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}.` });
    }
    if (!validStatuses.includes(taskStatus)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
    }

    // AC11: Invalid Due Date (not in past)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const dueDate = new Date(due_date);
    dueDate.setHours(0, 0, 0, 0); // Normalize to start of day

    if (dueDate < today) {
        return res.status(400).json({ message: 'Due date cannot be in the past.' });
    }

    // 2. Validate assigned_to_user_id
    const assignedUserCheck = await userExistsAndHasRole(assigned_to_user_id, 'EMPLOYEE');
    if (!assignedUserCheck.exists) {
        return res.status(400).json({ message: assignedUserCheck.error || 'Assigned employee not found or is not an EMPLOYEE.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO tasks (title, description, priority, status, due_date, assigned_to_user_id, created_by_user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, title, description, priority, status, due_date, assigned_to_user_id, created_by_user_id, created_at, updated_at`,
            [title, description, taskPriority, taskStatus, due_date, assigned_to_user_id, created_by_user_id]
        );
        res.status(201).json({ message: 'Task created successfully.', task: result.rows[0] });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error creating task.' });
    }
};

// View All Tasks (Manager) & Search/Filter Tasks (Manager)
exports.getAllTasks = async (req, res) => {
    const { assigned_to_user_id, status, priority, due_date_before, due_date_after, search } = req.query;
    let query = `
        SELECT
            t.id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at, t.updated_at,
            json_build_object('id', au.id, 'first_name', au.first_name, 'last_name', au.last_name, 'email', au.email) AS assigned_to,
            json_build_object('id', cu.id, 'first_name', cu.first_name, 'last_name', cu.last_name, 'email', cu.email) AS created_by
        FROM tasks t
        JOIN users au ON t.assigned_to_user_id = au.id
        JOIN users cu ON t.created_by_user_id = cu.id
        WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (assigned_to_user_id) {
        if (!isValidUUID(assigned_to_user_id)) {
            return res.status(400).json({ message: 'Invalid assigned_to_user_id format.' });
        }
        query += ` AND t.assigned_to_user_id = $${paramIndex++}`;
        values.push(assigned_to_user_id);
    }
    if (status) {
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELED'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
        }
        query += ` AND t.status = $${paramIndex++}`;
        values.push(status.toUpperCase());
    }
    if (priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (!validPriorities.includes(priority.toUpperCase())) {
            return res.status(400).json({ message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}.` });
        }
        query += ` AND t.priority = $${paramIndex++}`;
        values.push(priority.toUpperCase());
    }
    if (due_date_before) {
        query += ` AND t.due_date <= $${paramIndex++}`;
        values.push(due_date_before);
    }
    if (due_date_after) {
        query += ` AND t.due_date >= $${paramIndex++}`;
        values.push(due_date_after);
    }
    if (search) {
        query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC`;

    try {
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching all tasks:', error);
        res.status(500).json({ message: 'Server error fetching tasks.' });
    }
};

// Task Editing (Manager)
exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, status, due_date, assigned_to_user_id } = req.body;

    if (!isValidUUID(id)) {
        return res.status(400).json({ message: 'Invalid task ID format.' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
    }
    if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
    }
    if (priority !== undefined) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const taskPriority = priority.toUpperCase();
        if (!validPriorities.includes(taskPriority)) {
            return res.status(400).json({ message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}.` });
        }
        updates.push(`priority = $${paramIndex++}`);
        values.push(taskPriority);
    }
    if (status !== undefined) {
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELED'];
        const taskStatus = status.toUpperCase();
        if (!validStatuses.includes(taskStatus)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
        }
        // Manager can change status freely, no transition validation needed here
        updates.push(`status = $${paramIndex++}`);
        values.push(taskStatus);
    }
    if (due_date !== undefined) {
        // AC11: Invalid Due Date (not in past)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newDueDate = new Date(due_date);
        newDueDate.setHours(0, 0, 0, 0);

        if (newDueDate < today) {
            return res.status(400).json({ message: 'Due date cannot be in the past.' });
        }
        updates.push(`due_date = $${paramIndex++}`);
        values.push(due_date);
    }
    if (assigned_to_user_id !== undefined) {
        const assignedUserCheck = await userExistsAndHasRole(assigned_to_user_id, 'EMPLOYEE');
        if (!assignedUserCheck.exists) {
            return res.status(400).json({ message: assignedUserCheck.error || 'Assigned employee not found or is not an EMPLOYEE.' });
        }
        updates.push(`assigned_to_user_id = $${paramIndex++}`);
        values.push(assigned_to_user_id);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    values.push(id); // Add task ID for WHERE clause

    try {
        const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        res.status(200).json({ message: 'Task updated successfully.', task: result.rows[0] });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error updating task.' });
    }
};

// Task Deletion (Manager)
exports.deleteTask = async (req, res) => {
    const { id } = req.params;

    if (!isValidUUID(id)) {
        return res.status(400).json({ message: 'Invalid task ID format.' });
    }

    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found.' });
        }
        res.status(200).json({ message: 'Task deleted successfully.', id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error deleting task.' });
    }
};

// --- Employee Actions ---

// AC7: Employee Views Assigned Tasks Only
exports.getEmployeeTasks = async (req, res) => {
    const employeeId = req.user.id; // Employee's ID from JWT
    const { status, priority, due_date_before, due_date_after, search } = req.query;

    let query = `
        SELECT
            t.id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at, t.updated_at,
            json_build_object('id', au.id, 'first_name', au.first_name, 'last_name', au.last_name, 'email', au.email) AS assigned_to,
            json_build_object('id', cu.id, 'first_name', cu.first_name, 'last_name', cu.last_name, 'email', cu.email) AS created_by
        FROM tasks t
        JOIN users au ON t.assigned_to_user_id = au.id
        JOIN users cu ON t.created_by_user_id = cu.id
        WHERE t.assigned_to_user_id = $1
    `;
    const values = [employeeId];
    let paramIndex = 2; // Start from 2 because $1 is already employeeId

    if (status) {
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELED'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
        }
        query += ` AND t.status = $${paramIndex++}`;
        values.push(status.toUpperCase());
    }
    if (priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (!validPriorities.includes(priority.toUpperCase())) {
            return res.status(400).json({ message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}.` });
        }
        query += ` AND t.priority = $${paramIndex++}`;
        values.push(priority.toUpperCase());
    }
    if (due_date_before) {
        query += ` AND t.due_date <= $${paramIndex++}`;
        values.push(due_date_before);
    }
    if (due_date_after) {
        query += ` AND t.due_date >= $${paramIndex++}`;
        values.push(due_date_after);
    }
    if (search) {
        query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
    }

    query += ` ORDER BY t.due_date ASC, t.priority DESC`;

    try {
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
        res.status(500).json({ message: 'Server error fetching tasks.' });
    }
};

// AC8: Employee Updates Task Status
// AC9: Employee Cannot Edit Other Task Details (handled by separate endpoint)
// AC12: Invalid Status Transition
exports.updateTaskStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const employeeId = req.user.id; // Employee's ID from JWT

    if (!isValidUUID(id)) {
        return res.status(400).json({ message: 'Invalid task ID format.' });
    }
    if (!status) {
        return res.status(400).json({ message: 'New status is required.' });
    }

    const newStatus = status.toUpperCase();
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELED'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
    }

    try {
        // 1. Fetch current task to validate assignment and status transition
        const currentTaskResult = await pool.query(
            'SELECT id, status, assigned_to_user_id FROM tasks WHERE id = $1',
            [id]
        );
        const currentTask = currentTaskResult.rows[0];

        if (!currentTask) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        // Ensure employee is assigned to this task
        if (currentTask.assigned_to_user_id !== employeeId) {
            return res.status(403).json({ message: 'Forbidden: You can only update status for tasks assigned to you.' });
        }

        // AC12: Validate status transition
        if (!isValidStatusTransition(currentTask.status, newStatus)) {
            return res.status(400).json({ message: `Invalid status transition from '${currentTask.status}' to '${newStatus}'.` });
        }

        // 2. Update task status
        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [newStatus, id]
        );

        res.status(200).json({ message: 'Task status updated successfully.', task: result.rows[0] });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ message: 'Server error updating task status.' });
    }
};

// Get a single task (Manager can view any, Employee can view assigned)
exports.getTaskById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!isValidUUID(id)) {
        return res.status(400).json({ message: 'Invalid task ID format.' });
    }

    try {
        let query = `
            SELECT
                t.id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at, t.updated_at,
                json_build_object('id', au.id, 'first_name', au.first_name, 'last_name', au.last_name, 'email', au.email) AS assigned_to,
                json_build_object('id', cu.id, 'first_name', cu.first_name, 'last_name', cu.last_name, 'email', cu.email) AS created_by
            FROM tasks t
            JOIN users au ON t.assigned_to_user_id = au.id
            JOIN users cu ON t.created_by_user_id = cu.id
            WHERE t.id = $1
        `;
        const values = [id];

        if (userRole === 'EMPLOYEE') {
            query += ` AND t.assigned_to_user_id = $2`;
            values.push(userId);
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Task not found or you do not have permission to view it.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching task by ID:', error);
        res.status(500).json({ message: 'Server error fetching task.' });
    }
};
