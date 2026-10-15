const crypto = require('crypto');
const db = require('../config/db');
const { httpError } = require('../middleware/error');

// Luhn check for the mock card gateway
function luhn(num) {
  let sum = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

/*
 * MOCK PAYMENT WORKFLOW
 *  cash   -> always succeeds
 *  online -> always succeeds (simulates a sandbox gateway)
 *  card   -> Luhn check; test card 4000000000000002 is DECLINED, others approved
 */
exports.pay = async (req, res, next) => {
  try {
    const { method, card_number } = req.body;
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const order = rows[0];
    if (!order) throw httpError(404, 'Order not found');
    if (order.status === 'cancelled') throw httpError(400, 'Cannot pay for a cancelled order');
    if (order.payment_status === 'paid') throw httpError(400, 'Order is already paid');

    let success = true, last4 = null, reason = null;
    if (method === 'card') {
      const digits = String(card_number || '').replace(/\s+/g, '');
      if (!/^\d{13,19}$/.test(digits) || !luhn(digits)) throw httpError(400, 'Invalid card number');
      last4 = digits.slice(-4);
      if (digits === '4000000000000002') { success = false; reason = 'Card declined by mock gateway'; }
    }

    const ref = 'TXN' + crypto.randomBytes(5).toString('hex').toUpperCase();
    await db.query(
      'INSERT INTO payments (order_id, method, amount, status, transaction_ref, card_last4) VALUES (?,?,?,?,?,?)',
      [order.id, method, order.total, success ? 'success' : 'failed', ref, last4]
    );
    if (!success) return res.status(402).json({ message: reason, transaction_ref: ref });

    await db.query("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [order.id]);
    res.json({ message: 'Payment successful', transaction_ref: ref, amount: order.total });
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, o.order_no FROM payments p JOIN orders o ON o.id = p.order_id
       ORDER BY p.created_at DESC LIMIT 200`);
    res.json(rows);
  } catch (e) { next(e); }
};
