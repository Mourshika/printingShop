const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { httpError } = require('../middleware/error');

exports.list = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, username, full_name, role, created_at FROM users ORDER BY id');
    res.json(rows);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { username, full_name, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO users (username, full_name, password_hash, role) VALUES (?,?,?,?)',
      [username, full_name, hash, role]
    );
    res.status(201).json({ id: r.insertId, message: 'User created' });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { full_name, role, password } = req.body;
    if (Number(req.params.id) === req.session.user.id && role !== 'admin') {
      throw httpError(400, 'You cannot remove your own admin role.');
    }
    const [r] = await db.query('UPDATE users SET full_name = ?, role = ? WHERE id = ?', [full_name, role, req.params.id]);
    if (!r.affectedRows) throw httpError(404, 'User not found');
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    }
    res.json({ message: 'User updated' });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.session.user.id) throw httpError(400, 'You cannot delete your own account.');
    const [r] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) throw httpError(404, 'User not found');
    res.json({ message: 'User deleted' });
  } catch (e) { next(e); }
};
