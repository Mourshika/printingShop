exports.httpError = (status, message) => {
  const e = new Error(message);
  e.status = status;
  return e;
};

exports.notFound = (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Route not found' });
  res.status(404).send('404 - Page not found');
};

exports.errorHandler = (err, req, res, next) => {
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'Cannot delete: this record is used by other records.' });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Duplicate value: that record already exists.' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
};
