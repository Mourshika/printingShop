require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const routes = require('./routes');
const { requirePage } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Security headers (CSP allows only our own scripts/styles)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      formAction: ["'self'"]
    }
  }
}));

app.use(express.json({ limit: '100kb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 4 }
}));

// jQuery served locally from node_modules
app.use('/vendor/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));

// Public site + assets
app.use(express.static(path.join(__dirname, 'public')));

// Protected admin pages (login required)
app.use('/admin', requirePage, express.static(path.join(__dirname, 'views/admin')));

// REST API
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PrintShop running at http://localhost:${PORT}`));
