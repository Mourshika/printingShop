const db = require('../config/db');
const { httpError } = require('../middleware/error');

const STATUSES = ['pending', 'processing', 'ready', 'completed', 'cancelled'];

exports.list = async (req, res, next) => {
  try {
    const { search = '', status = '', payment = '', from = '', to = '' } = req.query;
    let sql = `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
               FROM orders o JOIN customers c ON c.id = o.customer_id WHERE 1=1`;
    const params = [];
    if (search) {
      sql += ' AND (o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    if (payment) { sql += ' AND o.payment_status = ?'; params.push(payment); }
    if (from) { sql += ' AND DATE(o.created_at) >= ?'; params.push(from); }
    if (to) { sql += ' AND DATE(o.created_at) <= ?'; params.push(to); }
    sql += ' ORDER BY o.created_at DESC, o.id DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
       FROM orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = ?`, [req.params.id]);
    if (!orders[0]) throw httpError(404, 'Order not found');
    const [items] = await db.query(
      `SELECT oi.*, s.name AS service_name, s.unit FROM order_items oi
       JOIN services s ON s.id = oi.service_id WHERE oi.order_id = ?`, [req.params.id]);
    const [payments] = await db.query('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC', [req.params.id]);
    res.json({ ...orders[0], items, payments });
  } catch (e) { next(e); }
};

// Prices are always calculated on the server (never trust the browser).
exports.create = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { customer_id, notes, items } = req.body;
    await conn.beginTransaction();

    const [cust] = await conn.query('SELECT id FROM customers WHERE id = ?', [customer_id]);
    if (!cust[0]) throw httpError(400, 'Customer not found');

    let total = 0;
    const rows = [];
    for (const it of items) {
      const [[s]] = await conn.query('SELECT * FROM services WHERE id = ? AND is_active = 1', [it.service_id]);
      if (!s) throw httpError(400, 'Invalid or inactive service selected');
      const qty = parseInt(it.quantity, 10);
      const unit = s.bulk_qty && s.bulk_price != null && qty >= s.bulk_qty ? s.bulk_price : s.price;
      const sub = Math.round(unit * qty * 100) / 100;
      total += sub;
      rows.push([s.id, qty, unit, sub]);
    }

    const orderNo = 'PS' + Date.now().toString().slice(-8) + Math.floor(10 + Math.random() * 90);
    const [r] = await conn.query(
      'INSERT INTO orders (order_no, customer_id, total, notes, created_by) VALUES (?,?,?,?,?)',
      [orderNo, customer_id, Math.round(total * 100) / 100, notes || null, req.session.user.id]
    );
    await conn.query(
      'INSERT INTO order_items (order_id, service_id, quantity, unit_price, subtotal) VALUES ?',
      [rows.map(x => [r.insertId, ...x])]
    );
    await conn.commit();
    res.status(201).json({ id: r.insertId, order_no: orderNo, total, message: 'Order created' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) throw httpError(400, 'Invalid status');
    const [r] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!r.affectedRows) throw httpError(404, 'Order not found');
    res.json({ message: 'Status updated' });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const [r] = await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) throw httpError(404, 'Order not found');
    res.json({ message: 'Order deleted' });
  } catch (e) { next(e); }
};

// Public order tracking: needs order number + customer phone
exports.track = async (req, res, next) => {
  try {
    const { order_no, phone } = req.query;
    const [rows] = await db.query(
      `SELECT o.order_no, o.status, o.payment_status, o.total, o.created_at, o.updated_at, c.name AS customer_name
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE o.order_no = ? AND c.phone = ?`, [order_no, phone]);
    if (!rows[0]) throw httpError(404, 'No order found. Check your order number and phone number.');
    const [items] = await db.query(
      `SELECT s.name, oi.quantity, oi.subtotal FROM order_items oi
       JOIN services s ON s.id = oi.service_id
       JOIN orders o ON o.id = oi.order_id WHERE o.order_no = ?`, [order_no]);
    res.json({ ...rows[0], items });
  } catch (e) { next(e); }
};
