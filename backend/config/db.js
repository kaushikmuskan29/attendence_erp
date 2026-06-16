/**
 * config/db.js
 * MySQL2 connection pool using environment variables.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'erp_attendance',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
  dateStrings:        true,   // Return DATE columns as strings
});

// Verify connection on startup
pool.getConnection()
  .then(async conn => {
    console.log('✅  MySQL connected successfully');
    conn.release();

    // Auto-migration for admin forgot password fields
    try {
      const [columns] = await pool.query('SHOW COLUMNS FROM admins');
      const columnNames = columns.map(c => c.Field);
      
      if (!columnNames.includes('reset_token')) {
        await pool.query('ALTER TABLE admins ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL AFTER password');
        console.log('✅ Added column reset_token to admins table');
      }
      if (!columnNames.includes('reset_token_expires')) {
        await pool.query('ALTER TABLE admins ADD COLUMN reset_token_expires DATETIME DEFAULT NULL AFTER reset_token');
        console.log('✅ Added column reset_token_expires to admins table');
      }
    } catch (migErr) {
      console.error('❌ Failed to run auto-migration for admins columns:', migErr.message);
    }
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
