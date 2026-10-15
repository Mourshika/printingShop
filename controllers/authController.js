const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ message: 'Invalid username or password.' });
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
      res.json({ message: 'Login successful', user: req.session.user });
    });
  } catch (e) { next(e); }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
};

exports.me = (req, res) => res.json({ user: req.session.user });
