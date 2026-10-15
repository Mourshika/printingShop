const mysql = require('mysql2/promise');

module.exports = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'mourshi#624',
  database: process.env.DB_NAME || 'printshop',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true
});
