-- CLOAKDATA RELATIONAL DATABASE DUMP: retail_db
-- Generated with Zero Orphan Foreign Key Guarantee

CREATE TABLE customers (
  customer_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80),
  segment VARCHAR(40)
);

CREATE TABLE products (
  product_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80),
  price NUMERIC(10,2)
);

CREATE TABLE orders (
  order_id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) REFERENCES customers(customer_id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(product_id),
  order_date DATE,
  total NUMERIC(12,2)
);

CREATE TABLE payments (
  payment_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(order_id) ON DELETE CASCADE,
  method VARCHAR(50),
  amount NUMERIC(12,2)
);
