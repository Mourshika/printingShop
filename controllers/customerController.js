const db = require('../config/db');
const { httpError } = require('../middleware/error');

exports.list = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const [rows] = await db.query(
      `SELECT c.*, COUNT(o.id) AS order_count
       FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
       WHERE c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?
       GROUP BY c.id ORDER BY c.name`,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );
    res.json(rows);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows[0]) throw httpError(404, 'Customer not found');
    res.json(rows[0]);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;
    const [r] = await db.query(
      'INSERT INTO customers (name, phone, email, address) VALUES (?,?,?,?)',
      [name, phone, email || null, address || null]
    );
    res.status(201).json({ id: r.insertId, message: 'Customer created' });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, phone, email, address } = req.body;
    const [r] = await db.query(
      'UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?',
      [name, phone, email || null, address || null, req.params.id]
    );
    if (!r.affectedRows) throw httpError(404, 'Customer not found');
    res.json({ message: 'Customer updated' });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const [r] = await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) throw httpError(404, 'Customer not found');
    res.json({ message: 'Customer deleted' });
  } catch (e) { next(e); }
};
