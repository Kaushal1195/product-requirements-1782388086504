const { Pool } = require('pg');

// Database connection string from environment variables
// Default to the specified connection string if not provided in .env
const connectionString = process.env.PG_CONNECTION_STRING || 'postgresql://postgres:postgres@localhost:5433/generated_db';

const pool = new Pool({
  connectionString: connectionString,
});

// Export the pool to be used in controllers
module.exports = {
  pool,
};
