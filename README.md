# EMORA DIGITAL - Printing & Photocopy Shop Management System
**Project 24** | Practical 01 (Core System) + Practical 02 (Enhancement)

A web application for a printing & photocopy shop: manage services and pricing, customers and orders, track order progress, take (mock) payments, and view sales reports.

## Tech Stack
| Layer | Technology |
|---|---|
| Front-end | HTML5, CSS3 (Flexbox, Grid, media queries), JavaScript (DOM, events), jQuery (effects + AJAX) |
| Back-end | Node.js, Express.js (REST API, controllers, middleware) |
| Database | MySQL (mysql2 driver, parameterised queries) |
| Security | bcryptjs, express-session, helmet, express-validator, express-rate-limit |

## Features
### Practical 01 - Core System
- **Services CRUD** with pricing (unit price + optional bulk price) and categories
- **Customers CRUD** with search
- **Orders**: multi-item orders, live total, automatic bulk pricing (calculated on the server), invoice view, status updates
- **Public website**: service list with live AJAX search and category filter
- Client-side form validation with DOM error messages
- jQuery effects (fade, slide) and AJAX data loading (no page reloads)

### Practical 02 - Enhancements
- **Authentication**: login / logout, session-based, protected admin area (pages and API)
- **Security**: bcrypt password hashing, server-side input validation, role-based access (admin / staff), login rate limiting, helmet + CSP, parameterised SQL, HTML escaping, httpOnly cookies
- **Order tracking**: public page - order number + phone shows progress
- **Mock payment workflow**: cash / card / online (sandbox). Card uses Luhn check; test card `4242 4242 4242 4242` approves, `4000 0000 0000 0002` declines. Every attempt is stored in `payments`.
- **Reports**: daily sales, top services, revenue by payment method, date filters, CSV export, print
- **Dashboard**: KPIs, 7-day revenue chart, status counts, recent orders
- **Additional CRUD module**: Staff Users (admin only)
- Search/filter on orders (text, status, payment, date range)
- Improved UI: responsive sidebar, dialogs, toasts, status badges, printable invoice

## Setup
1. Install Node.js (v18+) and MySQL.
2. `npm install`
3. Create database + tables: `mysql -u root -p < database/schema.sql`
4. Copy `.env.example` to `.env`; set `DB_PASSWORD` and a long `SESSION_SECRET`.
5. Create default users + sample customers: `npm run seed`
6. Start: `npm start`
7. Open http://localhost:3000

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@123` |
| Staff | `staff` | `Staff@123` |

## Project Structure
```
printshop/
├── server.js              # Express app, security middleware, static routes
├── config/db.js           # MySQL connection pool
├── routes/index.js        # API routes + validation rules
├── controllers/           # auth, services, customers, orders, payments, reports, users
├── middleware/            # auth guards, validation, error handling
├── database/schema.sql    # tables, relationships, sample services
├── database/seed.js       # default users (hashed passwords) + sample customers
├── public/                # public site: index.html, login.html, css/, js/
└── views/admin/           # protected admin pages (login required)
```

## Database relationships
- customers 1-N orders; orders 1-N order_items N-1 services; orders 1-N payments; users 1-N orders (created_by)

## REST API (summary)
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/login, /api/auth/logout | public / logged in |
| GET | /api/services, /api/services/categories, /api/track | public |
| POST/PUT | /api/services | staff, admin |
| DELETE | /api/services/:id | admin |
| GET/POST/PUT | /api/customers | staff, admin |
| DELETE | /api/customers/:id | admin |
| GET/POST | /api/orders, PUT /api/orders/:id/status | staff, admin |
| DELETE | /api/orders/:id | admin |
| POST | /api/orders/:id/pay | staff, admin |
| GET | /api/payments, /api/reports/* | staff, admin |
| GET/POST/PUT/DELETE | /api/users | admin |

## Notes
- Sessions use the in-memory store (fine for coursework; use a persistent store in production).
- Payments are simulated only; only the last 4 card digits are stored.
