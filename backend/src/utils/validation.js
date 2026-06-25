const { pool } = require('../db');

// Helper to validate UUID format
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Helper to check if a user exists and has a specific role
const userExistsAndHasRole = async (userId, requiredRole = null) => {
    if (!isValidUUID(userId)) {
        return { exists: false, role: null, error: 'Invalid user ID format.' };
    }
    const query = requiredRole
        ? 'SELECT id, role FROM users WHERE id = $1 AND role = $2'
        : 'SELECT id, role FROM users WHERE id = $1';
    const values = requiredRole ? [userId, requiredRole] : [userId];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
        return { exists: false, role: null, error: `User with ID ${userId} not found or does not have the required role.` };
    }
    return { exists: true, role: result.rows[0].role, error: null };
};

// Helper to validate task status transitions
const isValidStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        'PENDING': ['IN_PROGRESS', 'COMPLETED', 'CANCELED'],
        'IN_PROGRESS': ['COMPLETED', 'BLOCKED', 'CANCELED'],
        'COMPLETED': [], // Cannot transition from completed
        'BLOCKED': ['IN_PROGRESS', 'CANCELED'],
        'CANCELED': [], // Cannot transition from canceled
    };

    if (currentStatus === newStatus) {
        return true; // No change is always valid
    }

    return validTransitions[currentStatus] && validTransitions[currentStatus].includes(newStatus);
};

module.exports = {
    isValidUUID,
    userExistsAndHasRole,
    isValidStatusTransition,
};
