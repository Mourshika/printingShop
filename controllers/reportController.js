const db = require('../config/db');

const range = q => {
  const from = q.from || '1970-01-01';
  const to = q.to || '2999-12-31';
  return [from, to];
};

exports.summary = async (req, res, next) => {
  try {
    const [[orders]] = await db.query(
      `SELECT COUNT(*) AS total_orders,
              SUM(status = 'pending') AS pending,
              SUM(status = 'processing') AS processing,
              SUM(status = 'ready') AS ready,
              SUM(status = 'completed') AS completed,
              SUM(status = 'cancelled') AS cancelled,
              SUM(DATE(created_at) = CURDATE()) AS today_orders
       FROM orders`);
    const [[money]] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN payment_status='paid' THEN total END),0) AS revenue,
              COALESCE(SUM(CASE WHEN payment_status='unpaid' AND status<>'cancelled' THEN total END),0) AS outstanding
       FROM orders`);
    const [[{ customers }]] = await db.query('SELECT COUNT(*) AS customers FROM customers');
    const [[{ services }]] = await db.query('SELECT COUNT(*) AS services FROM services WHERE is_active = 1');
    const [last7] = await db.query(
      `SELECT DATE_FORMAT(created_at,'%Y-%m-%d') AS day, COALESCE(SUM(total),0) AS revenue
       FROM orders WHERE payment_status='paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY day ORDER BY day`);
    const [recent] = await db.query(
      `SELECT o.id, o.order_no, o.status, o.payment_status, o.total, c.name AS customer_name
       FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.id DESC LIMIT 5`);
    res.json({ orders, ...money, customers, services, last7, recent });
  } catch (e) { next(e); }
};

exports.sales = async (req, res, next) => {
  try {
    const [from, to] = range(req.query);
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(created_at,'%Y-%m-%d') AS day, COUNT(*) AS orders, SUM(total) AS revenue
       FROM orders WHERE payment_status='paid' AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY day ORDER BY day DESC`, [from, to]);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.topServices = async (req, res, next) => {
  try {
    const [from, to] = range(req.query);
    const [rows] = await db.query(
      `SELECT s.name, s.category, SUM(oi.quantity) AS qty_sold, SUM(oi.subtotal) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN services s ON s.id = oi.service_id
       WHERE o.status <> 'cancelled' AND DATE(o.created_at) BETWEEN ? AND ?
       GROUP BY s.id ORDER BY revenue DESC LIMIT 10`, [from, to]);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.paymentMethods = async (req, res, next) => {
  try {
    const [from, to] = range(req.query);
    const [rows] = await db.query(
      `SELECT method, COUNT(*) AS payments, SUM(amount) AS amount FROM payments
       WHERE status='success' AND DATE(created_at) BETWEEN ? AND ? GROUP BY method`, [from, to]);
    res.json(rows);
  } catch (e) { next(e); }
};

const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

exports.salesCsv = async (req, res, next) => {
  try {
    const [from, to] = range(req.query);
    const [rows] = await db.query(
      `SELECT o.order_no, c.name AS customer, o.status, o.payment_status, o.total, o.created_at
       FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE DATE(o.created_at) BETWEEN ? AND ? ORDER BY o.created_at`, [from, to]);
    const head = ['Order No', 'Customer', 'Status', 'Payment', 'Total', 'Date'];
    const lines = [head.map(csvCell).join(',')].concat(
      rows.map(r => [r.order_no, r.customer, r.status, r.payment_status, r.total, new Date(r.created_at).toISOString()].map(csvCell).join(','))
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
    res.send(lines.join('\n'));
  } catch (e) { next(e); }
};
