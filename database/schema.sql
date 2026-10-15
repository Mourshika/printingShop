-- Printing & Photocopy Shop - MySQL schema
CREATE DATABASE IF NOT EXISTS printshop CHARACTER SET utf8mb4;
USE printshop;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS users;

-- Staff / admin accounts (Practical 02)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services with pricing (bulk price applies when quantity >= bulk_qty)
CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  unit VARCHAR(20) NOT NULL DEFAULT 'page',
  price DECIMAL(10,2) NOT NULL,
  bulk_qty INT NULL,
  bulk_price DECIMAL(10,2) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(20) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  status ENUM('pending','processing','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes VARCHAR(255),
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  service_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

-- Mock payment records (Practical 02)
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  method ENUM('cash','card','online') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('success','failed') NOT NULL,
  transaction_ref VARCHAR(40) NOT NULL,
  card_last4 CHAR(4) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_customers_name ON customers(name);

-- Sample services
INSERT INTO services (name, category, description, unit, price, bulk_qty, bulk_price) VALUES
('Photocopy - A4 Black & White', 'Photocopy', 'Standard single-sided B/W copy', 'page', 5.00, 100, 3.50),
('Photocopy - A4 Colour', 'Photocopy', 'Full colour A4 copy', 'page', 25.00, 50, 20.00),
('Print - A4 Black & White', 'Printing', 'Document printing from file/USB', 'page', 10.00, 100, 7.00),
('Print - A4 Colour', 'Printing', 'Colour document printing', 'page', 40.00, 50, 32.00),
('Print - A3 Colour', 'Printing', 'Large format colour print', 'page', 90.00, NULL, NULL),
('Spiral Binding', 'Finishing', 'Plastic spiral binding', 'book', 150.00, NULL, NULL),
('Lamination - A4', 'Finishing', 'A4 hot lamination', 'sheet', 60.00, 20, 45.00),
('Passport Photo Print', 'Photo', 'Set of 6 passport photos', 'set', 350.00, NULL, NULL),
('Business Cards (100)', 'Design & Print', 'Full-colour, 100 cards', 'pack', 1800.00, NULL, NULL),
('Banner Printing', 'Design & Print', 'Vinyl banner per sq. ft', 'sq.ft', 120.00, 50, 100.00);
