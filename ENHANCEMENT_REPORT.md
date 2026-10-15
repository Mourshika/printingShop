# Enhancement Report - Practical 02
**Project:** PrintShop - Printing & Photocopy Shop (Project 24)

## 1. Introduction
Practical 01 delivered the core system (services, customers, orders, pricing) without access control. Practical 02 extends the same project with authentication, security, reporting, a payment workflow and UI improvements.

## 2. Enhancements Implemented
| Requirement | What was added | Where |
|---|---|---|
| Authentication | Login/logout with sessions; protected admin pages and API | authController.js, middleware/auth.js, login.html |
| Security | bcrypt, express-validator, role-based access, rate limiting, helmet + CSP, parameterised queries, output escaping | routes/index.js, server.js, common.js |
| Reports | Daily sales, top services, payment-method summary, date filters, CSV export, print | reportController.js, reports.html |
| Search/filter | Orders by text/status/payment/date; customers; services | orders/customers/services pages |
| Dashboard | KPI cards, 7-day revenue chart, status counts, recent orders | dashboard.html |
| Additional CRUD | Staff Users module (admin only) | userController.js, staff.html |
| Payment workflow | Mock gateway (cash/card/online), Luhn check, decline test card, payment history, auto-mark paid | paymentController.js |
| Order tracking | Public tracking by order number + phone | index.html, orderController.track |
| UI improvements | Responsive sidebar, dialogs, toasts, badges, printable invoice | style.css |
| Documentation | Updated README + this report | root folder |

## 3. Security Measures
1. Password hashing with bcrypt (10 salt rounds); plain passwords never stored.
2. Protected routes: /admin pages redirect to login; API returns 401 / 403.
3. Role-based access: staff can create/edit; only admin can delete and manage users.
4. Input validation on client (instant feedback) and server (express-validator).
5. SQL injection prevention: all queries use placeholders.
6. XSS prevention: dynamic data escaped; CSP allows only own scripts.
7. Brute-force protection: login limited to 10 attempts per 15 minutes.
8. Session security: httpOnly, SameSite=Lax cookie, session regenerated on login.
9. Price integrity: totals calculated on the server only.

## 4. Payment Workflow
Order created (unpaid) -> Pay dialog -> method chosen -> mock gateway result -> payment row saved (success/failed + reference) -> order marked paid on success -> invoice and reports updated.

## 5. Testing Summary
| Test | Result |
|---|---|
| Admin page without login | Redirected to login |
| Wrong password | Rejected (401) |
| Order with 0 items | Rejected (400) |
| 120 copies bulk pricing | Bulk price applied on server |
| Declined / approved card | Failed payment recorded / order marked paid |
| Weak password for new user | Rejected |
| Staff deleting a customer or listing users | Blocked (403) |
| Access after logout | Blocked (401) |
| Report and CSV output | Matches paid orders |

## 6. Conclusion
The system progresses from a simple CRUD application to a secure, role-based business application with payments, tracking and reporting, meeting the Practical 02 requirements.
