-- Drop tables if they exist
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS payment_methods;

-- Create Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    in_stock INTEGER NOT NULL,
    user_uid VARCHAR(255) NOT NULL,
    category VARCHAR(50)
);
-- Create Customers table
CREATE TABLE shops(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    owner VARCHAR(255),
    Address TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2),
    user_uid VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('full', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Create OrderItems table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);





-- Table for Khata
CREATE TABLE Khata (
    KhataID SERIAL PRIMARY KEY,
    ShopID INT NOT NULL REFERENCES Shops(ShopID) ON DELETE CASCADE,
    Balance DECIMAL(10, 2) NOT NULL, 
    TransactionDate DATE NOT NULL DEFAULT  CURRENT_TIMESTAMP
);
