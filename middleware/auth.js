// Protects API routes
exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.status(401).json({ message: 'Please log in first.' });
};

exports.requireAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required.' });
};

// Protects admin HTML pages (redirects to login)
exports.requirePage = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.redirect('/login.html');
};
