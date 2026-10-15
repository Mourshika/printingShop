// Creates the default admin + staff users and sample customers.
// Run once after importing schema.sql:  npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

(async () => {
  try {
    const users = [
      ['admin', 'System Administrator', 'Admin@123', 'admin'],
      ['staff', 'Counter Staff', 'Staff@123', 'staff']
    ];
    for (const [u, n, p, r] of users) {
      const hash = await bcrypt.hash(p, 10);
      await db.query(
        'INSERT INTO users (username, full_name, password_hash, role) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)',
        [u, n, hash, r]
      );
    }
    const [[{ c }]] = await db.query('SELECT COUNT(*) c FROM customers');
    if (c === 0) {
      await db.query(
        'INSERT INTO customers (name, phone, email, address) VALUES ?',
        [[
          ['Nimal Perera', '0771234567', 'nimal@example.com', 'Colombo 05'],
          ['Kavya Silva', '0712345678', 'kavya@example.com', 'Nugegoda'],
          ['Ruwan Fernando', '0753456789', null, 'Dehiwala']
        ]]
      );
    }
    console.log('Seed complete.\n  admin / Admin@123\n  staff / Staff@123');
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(1);
  }
})();
