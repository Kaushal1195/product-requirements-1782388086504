const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d' }
  );

  return { accessToken, refreshToken };
};

// Register a new user
const register = async (req, res) => {
  const { email, password, first_name, last_name, role } = req.body;

  // Basic validation
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: 'All fields (email, password, first_name, last_name) are required.' });
  }

  // Validate role if provided, otherwise default to EMPLOYEE
  const userRole = role && ['MANAGER', 'EMPLOYEE'].includes(role.toUpperCase()) ? role.toUpperCase() : 'EMPLOYEE';

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user into the database
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
      [email, passwordHash, first_name, last_name, userRole]
    );

    const user = newUser.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in the database
    const refreshTokenExpiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXPIRATION_MS) || 7 * 24 * 60 * 60 * 1000)); // 7 days default
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshTokenExpiresAt]
    );

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Log in a user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const userResult = await pool.query('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token in the database (or update if existing and not revoked)
    const refreshTokenExpiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXPIRATION_MS) || 7 * 24 * 60 * 60 * 1000)); // 7 days default
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at, revoked_at = NULL',
      [user.id, refreshToken, refreshTokenExpiresAt]
    );

    res.status(200).json({
      message: 'Logged in successfully.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Refresh access token using refresh token
const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required.' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if refresh token exists in DB and is not revoked
    const tokenRecord = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()',
      [refreshToken, decoded.id]
    );

    if (tokenRecord.rows.length === 0) {
      return res.status(403).json({ message: 'Invalid, expired, or revoked refresh token.' });
    }

    // Get user details to generate new access token
    const userResult = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(403).json({ message: 'User not found for refresh token.' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '15m' }
    );

    res.status(200).json({ accessToken: newAccessToken });

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: 'Refresh token has expired. Please log in again.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: 'Invalid refresh token.' });
    }
    console.error('Error refreshing token:', error);
    res.status(500).json({ message: 'Server error during token refresh.' });
  }
};

// Log out a user (revoke refresh token)
const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required for logout.' });
  }

  try {
    // Mark the refresh token as revoked
    const result = await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1 AND revoked_at IS NULL RETURNING id',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Refresh token not found or already revoked.' });
    }

    res.status(200).json({ message: 'Logged out successfully.' });

  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Server error during logout.' });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
};
