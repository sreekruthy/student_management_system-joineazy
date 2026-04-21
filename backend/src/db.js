const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

pool.connect((err, client, release) => {
  if (err) {
    console.error('DB connection failed:', err.message);
    // Don't process.exit(1) — let the server start and fail gracefully per-request
    return;
  }
  release();
  console.log('Database connected');
});

module.exports = pool;