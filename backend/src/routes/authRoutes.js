const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Register a new user
router.post('/register', authController.register);

// POST /api/auth/login - Log in a user
router.post('/login', authController.login);

// POST /api/auth/token - Refresh access token using refresh token
router.post('/token', authController.refreshAccessToken);

// POST /api/auth/logout - Log out a user (revoke refresh token)
router.post('/logout', authController.logout);

module.exports = router;
