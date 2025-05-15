-- Create tables with some intentional data quality issues
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP,
    last_purchase_date TIMESTAMP,
    total_spent DECIMAL(10,2),
    status VARCHAR(20) -- active, inactive, pending
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    inventory_count INTEGER,
    supplier_id INTEGER,
    last_restock_date TIMESTAMP
);

CREATE TABLE regions (
    region_id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    country VARCHAR(50),
    manager VARCHAR(100),
    target_sales DECIMAL(10,2)
);

CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    product_id INTEGER REFERENCES products(product_id),
    region_id INTEGER REFERENCES regions(region_id),
    sale_date TIMESTAMP,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    payment_method VARCHAR(20),
    status VARCHAR(20) -- completed, pending, refunded
);

-- Insert sample data with intentional issues
INSERT INTO customers (first_name, last_name, email, phone, created_at, last_purchase_date, total_spent, status)
VALUES 
    ('John', 'Doe', 'john.doe@email.com', '555-0123', '2023-01-01', '2023-12-15', 1500.00, 'active'),
    ('Jane', NULL, 'jane.smith@email.com', NULL, '2023-02-15', '2023-12-10', 2300.50, 'active'),
    ('Bob', 'Johnson', NULL, '555-0124', '2023-03-20', NULL, 0.00, 'inactive'),
    ('Alice', 'Brown', 'alice.brown@email.com', '555-0125', '2023-04-10', '2023-12-01', 750.25, 'pending');

INSERT INTO products (name, category, price, cost, inventory_count, supplier_id, last_restock_date)
VALUES 
    ('Laptop Pro', 'Electronics', 1299.99, 800.00, 50, 1, '2023-12-01'),
    ('Wireless Mouse', 'Accessories', 29.99, 10.00, 200, 2, '2023-11-15'),
    ('Monitor 27"', 'Electronics', 299.99, 150.00, 30, 1, '2023-12-05'),
    ('Keyboard', 'Accessories', 79.99, 25.00, 100, 2, NULL);

INSERT INTO regions (name, country, manager, target_sales)
VALUES 
    ('North', 'USA', 'Mike Wilson', 1000000.00),
    ('South', 'USA', 'Sarah Lee', 800000.00),
    ('East', 'USA', NULL, 750000.00),
    ('West', 'USA', 'David Chen', 900000.00);

INSERT INTO sales (customer_id, product_id, region_id, sale_date, quantity, unit_price, total_amount, payment_method, status)
VALUES 
    (1, 1, 1, '2023-12-15', 1, 1299.99, 1299.99, 'credit_card', 'completed'),
    (2, 2, 2, '2023-12-10', 2, 29.99, 59.98, 'paypal', 'completed'),
    (3, 3, 3, '2023-12-01', 1, 299.99, 299.99, 'credit_card', 'refunded'),
    (4, 4, 4, '2023-12-05', 1, 79.99, 79.99, 'credit_card', 'pending'),
    (1, 2, 1, '2023-11-20', 1, 29.99, 29.99, 'credit_card', 'completed'); 