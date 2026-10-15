const db = require('../config/db');
const { httpError } = require('../middleware/error');

// Public: active services only. Logged-in users can request ?all=1
exports.list = async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const showAll = req.query.all === '1' && req.session && req.session.user;
    let sql = 'SELECT * FROM services WHERE 1=1';
    const params = [];
    if (!showAll) sql += ' AND is_active = 1';
    if (search) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY category, name';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.categories = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM services ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (!rows[0]) throw httpError(404, 'Service not found');
    res.json(rows[0]);
  } catch (e) { next(e); }
};

const fields = b => [
  b.name, b.category, b.description || null, b.unit || 'page', b.price,
  b.bulk_qty || null, b.bulk_price || null, b.is_active === false || b.is_active === 0 ? 0 : 1
];

exports.create = async (req, res, next) => {
  try {
    const [r] = await db.query(
      'INSERT INTO services (name, category, description, unit, price, bulk_qty, bulk_price, is_active) VALUES (?,?,?,?,?,?,?,?)',
      fields(req.body)
    );
    res.status(201).json({ id: r.insertId, message: 'Service created' });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const [r] = await db.query(
      'UPDATE services SET name=?, category=?, description=?, unit=?, price=?, bulk_qty=?, bulk_price=?, is_active=? WHERE id=?',
      [...fields(req.body), req.params.id]
    );
    if (!r.affectedRows) throw httpError(404, 'Service not found');
    res.json({ message: 'Service updated' });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const [r] = await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) throw httpError(404, 'Service not found');
    res.json({ message: 'Service deleted' });
  } catch (e) { next(e); }
};
