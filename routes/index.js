const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const auth = require('../controllers/authController');
const services = require('../controllers/serviceController');
const customers = require('../controllers/customerController');
const orders = require('../controllers/orderController');
const payments = require('../controllers/paymentController');
const reports = require('../controllers/reportController');
const users = require('../controllers/userController');

const id = param('id').isInt({ min: 1 }).withMessage('Invalid id');

// ---------- Auth ----------
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: 'Too many login attempts. Try again in 15 minutes.' } });
router.post('/auth/login', loginLimiter,
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate, auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', requireLogin, auth.me);

// ---------- Public ----------
router.get('/services', services.list);
router.get('/services/categories', services.categories);
router.get('/track', orders.track);

// ---------- Services (protected) ----------
const serviceRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('unit').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('bulk_qty').optional({ checkFalsy: true }).isInt({ min: 2 }).withMessage('Bulk quantity must be 2 or more'),
  body('bulk_price').optional({ checkFalsy: true }).isFloat({ gt: 0 }).withMessage('Bulk price must be greater than 0'),
  validate
];
router.get('/services/:id', requireLogin, id, validate, services.get);
router.post('/services', requireLogin, serviceRules, services.create);
router.put('/services/:id', requireLogin, id, serviceRules, services.update);
router.delete('/services/:id', requireAdmin, id, validate, services.remove);

// ---------- Customers ----------
const customerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('phone').trim().matches(/^[0-9+\-\s]{7,20}$/).withMessage('Enter a valid phone number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email'),
  body('address').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  validate
];
router.get('/customers', requireLogin, customers.list);
router.get('/customers/:id', requireLogin, id, validate, customers.get);
router.post('/customers', requireLogin, customerRules, customers.create);
router.put('/customers/:id', requireLogin, id, customerRules, customers.update);
router.delete('/customers/:id', requireAdmin, id, validate, customers.remove);

// ---------- Orders ----------
router.get('/orders', requireLogin, orders.list);
router.get('/orders/:id', requireLogin, id, validate, orders.get);
router.post('/orders', requireLogin,
  body('customer_id').isInt({ min: 1 }).withMessage('Select a customer'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body('items').isArray({ min: 1 }).withMessage('Add at least one item'),
  body('items.*.service_id').isInt({ min: 1 }).withMessage('Select a service for every item'),
  body('items.*.quantity').isInt({ min: 1, max: 100000 }).withMessage('Quantity must be at least 1'),
  validate, orders.create);
router.put('/orders/:id/status', requireLogin, id, validate, orders.updateStatus);
router.delete('/orders/:id', requireAdmin, id, validate, orders.remove);

// ---------- Payments (mock) ----------
router.post('/orders/:id/pay', requireLogin, id,
  body('method').isIn(['cash', 'card', 'online']).withMessage('Choose a payment method'),
  validate, payments.pay);
router.get('/payments', requireLogin, payments.list);

// ---------- Reports ----------
router.get('/reports/summary', requireLogin, reports.summary);
router.get('/reports/sales', requireLogin, reports.sales);
router.get('/reports/top-services', requireLogin, reports.topServices);
router.get('/reports/payment-methods', requireLogin, reports.paymentMethods);
router.get('/reports/sales.csv', requireLogin, reports.salesCsv);

// ---------- Staff users (admin only) - additional CRUD module ----------
const passRule = body('password').matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/).withMessage('Password needs 8+ characters with letters and numbers');
router.get('/users', requireAdmin, users.list);
router.post('/users', requireAdmin,
  body('username').trim().matches(/^[A-Za-z0-9_]{3,30}$/).withMessage('Username: 3-30 letters, numbers or _'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['admin', 'staff']).withMessage('Invalid role'),
  passRule, validate, users.create);
router.put('/users/:id', requireAdmin, id,
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['admin', 'staff']).withMessage('Invalid role'),
  body('password').optional({ checkFalsy: true }).matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/).withMessage('Password needs 8+ characters with letters and numbers'),
  validate, users.update);
router.delete('/users/:id', requireAdmin, id, validate, users.remove);

module.exports = router;
