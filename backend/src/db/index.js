const { Pool } = require('pg');
require('dotenv').config();

// Use mock database by default for development without PostgreSQL
const useMockDb = process.env.USE_MOCK_DB !== 'false' && process.env.NODE_ENV === 'development';

if (useMockDb) {
  console.log('⚠️  Using mock in-memory database for development');
  module.exports = require('./mock');
} else {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'puff_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.warn('⚠️  PostgreSQL connection failed, switching to mock database');
    // Fallback to mock
    module.exports = require('./mock');
  });

  module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool
  };
}
