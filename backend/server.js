require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const taskRoutes = require('./src/routes/taskRoutes'); // New: Task routes
const userRoutes = require('./src/routes/userRoutes'); // New: User routes (for employees list)
const dashboardRoutes = require('./src/routes/dashboardRoutes'); // New: Dashboard routes
const { authenticateToken, authorizeRoles } = require('./src/middleware/authMiddleware');
const { pool } = require('./src/db'); // Import the database pool

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON request bodies

// Database connection test (optional, but good for initial setup)
pool.connect()
  .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    console.error('Error connecting to PostgreSQL database:', err.stack);
    process.exit(1); // Exit if DB connection fails
  });

// Auth Routes
app.use('/api/auth', authRoutes);

// New: Core Application Routes
app.use('/api/tasks', taskRoutes); // Mount task routes
app.use('/api/users', userRoutes); // Mount user routes (e.g., /api/users/employees)
app.use('/api/dashboard', dashboardRoutes); // Mount dashboard routes

// Example Protected Route (for demonstration of middleware)
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.email}! You are a ${req.user.role}. This is a protected route.` });
});

// Example Manager-only Protected Route
app.get('/api/manager-dashboard-example', authenticateToken, authorizeRoles(['MANAGER']), (req, res) => {
  res.json({ message: `Welcome, Manager ${req.user.email}! This is your manager dashboard.` });
});

// Example Employee-only Protected Route
app.get('/api/employee-tasks-example', authenticateToken, authorizeRoles(['EMPLOYEE']), (req, res) => {
  res.json({ message: `Welcome, Employee ${req.user.email}! Here are your tasks.` });
});


// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
