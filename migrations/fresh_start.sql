-- ============================================================
-- FinOpenPOS - Complete Fresh Start Migration
-- Supabase Compatible - PostgreSQL 14+
-- Drop everything and recreate cleanly
-- ============================================================

-- ============================================================
-- STEP 1: DROP ALL EXISTING TABLES & TYPES
-- ============================================================
DROP TRIGGER IF EXISTS enforce_no_walkin_khata ON khata_accounts CASCADE;
DROP TRIGGER IF EXISTS set_order_khata_flag ON orders CASCADE;

DROP FUNCTION IF EXISTS block_walkin_khata() CASCADE;
DROP FUNCTION IF EXISTS flag_order_as_khata() CASCADE;

DROP TABLE IF EXISTS khata_transactions CASCADE;
DROP TABLE IF EXISTS khata_accounts CASCADE;
DROP TABLE IF EXISTS cash_summary CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS deal_items CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS customer_type CASCADE;
DROP TYPE IF EXISTS unit_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================================
-- STEP 2: CREATE ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'salesman');
CREATE TYPE customer_type AS ENUM ('walk_in', 'retail');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'partial', 'refunded');
CREATE TYPE unit_type AS ENUM ('piece', 'dozen', 'kg', 'packet', 'litre', 'meter');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'khata');
CREATE TYPE transaction_type AS ENUM ('debit', 'credit');

-- ============================================================
-- STEP 3: CREATE USERS TABLE
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'salesman',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- STEP 4: CREATE CUSTOMERS TABLE
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  customer_type customer_type NOT NULL DEFAULT 'retail',
  is_walk_in BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_is_active ON customers(is_active);

-- Insert system walk-in customer
INSERT INTO customers (name, customer_type, is_walk_in, is_active)
VALUES ('Walk-in Customer', 'walk_in', true, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 5: CREATE PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit unit_type NOT NULL DEFAULT 'piece',
  item_code VARCHAR(255) UNIQUE,
  min_discount DECIMAL(5, 2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(5, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_item_code ON products(item_code);

-- ============================================================
-- STEP 6: CREATE PRODUCT VARIANTS TABLE
-- ============================================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(255) UNIQUE,
  purchase_price DECIMAL(10, 2),
  sale_price DECIMAL(10, 2),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_discount DECIMAL(5, 2),
  max_discount DECIMAL(5, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_item_code ON product_variants(item_code);

-- ============================================================
-- STEP 7: CREATE DEALS TABLE
-- ============================================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_is_active ON deals(is_active);

-- ============================================================
-- STEP 8: CREATE DEAL ITEMS TABLE
-- ============================================================
CREATE TABLE deal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_items_deal_id ON deal_items(deal_id);

-- ============================================================
-- STEP 9: CREATE ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status order_status NOT NULL DEFAULT 'pending',
  payment_method payment_method NOT NULL DEFAULT 'cash',
  notes TEXT,
  is_khata BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_is_khata ON orders(is_khata);

-- ============================================================
-- STEP 10: CREATE ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_pct DECIMAL(5, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================
-- STEP 11: CREATE KHATA ACCOUNTS TABLE
-- ============================================================
CREATE TABLE khata_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE RESTRICT,
  opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_khata_accounts_customer_id ON khata_accounts(customer_id);

-- ============================================================
-- STEP 12: CREATE KHATA TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE khata_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  khata_account_id UUID NOT NULL REFERENCES khata_accounts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  description TEXT,
  balance_after DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_khata_transactions_khata_id ON khata_transactions(khata_account_id);
CREATE INDEX idx_khata_transactions_order_id ON khata_transactions(order_id);

-- ============================================================
-- STEP 13: CREATE EXPENSES TABLE
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================================
-- STEP 14: CREATE CASH SUMMARY TABLE
-- ============================================================
CREATE TABLE cash_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE NOT NULL UNIQUE,
  total_cash_in DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cash_out DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(10, 2) NOT NULL DEFAULT 0,
  net_cash DECIMAL(10, 2) GENERATED ALWAYS AS (total_cash_in - total_cash_out - total_expenses) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_summary_date ON cash_summary(summary_date);

-- ============================================================
-- STEP 15: ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE khata_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE khata_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 16: CREATE RLS POLICIES
-- ============================================================

-- Users policies
CREATE POLICY "users_admin_all" ON users
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "users_view_own" ON users
  FOR SELECT USING (id = auth.uid());

-- Customers policies
CREATE POLICY "customers_admin_all" ON customers
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "customers_salesman_select" ON customers
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

CREATE POLICY "customers_salesman_insert" ON customers
  FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Products policies
CREATE POLICY "products_admin_all" ON products
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "products_salesman_select" ON products
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Product variants policies
CREATE POLICY "product_variants_admin_all" ON product_variants
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "product_variants_salesman_select" ON product_variants
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Deals policies
CREATE POLICY "deals_admin_all" ON deals
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "deals_salesman_select" ON deals
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Deal items policies
CREATE POLICY "deal_items_admin_all" ON deal_items
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "deal_items_salesman_select" ON deal_items
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Orders policies
CREATE POLICY "orders_admin_all" ON orders
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "orders_salesman_insert" ON orders
  FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

CREATE POLICY "orders_salesman_select" ON orders
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

CREATE POLICY "orders_salesman_update" ON orders
  FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Order items policies
CREATE POLICY "order_items_admin_all" ON order_items
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "order_items_salesman_insert" ON order_items
  FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

CREATE POLICY "order_items_salesman_select" ON order_items
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

CREATE POLICY "order_items_salesman_update" ON order_items
  FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Khata accounts policies
CREATE POLICY "khata_accounts_admin_all" ON khata_accounts
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "khata_accounts_salesman_select" ON khata_accounts
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

CREATE POLICY "khata_accounts_salesman_insert" ON khata_accounts
  FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Khata transactions policies
CREATE POLICY "khata_transactions_admin_all" ON khata_transactions
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "khata_transactions_salesman_select" ON khata_transactions
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

CREATE POLICY "khata_transactions_salesman_insert" ON khata_transactions
  FOR INSERT WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'salesman'));

-- Expenses policies
CREATE POLICY "expenses_admin_all" ON expenses
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Cash summary policies
CREATE POLICY "cash_summary_admin_all" ON cash_summary
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ============================================================
-- STEP 17: CREATE USEFUL VIEWS FOR REPORTING
-- ============================================================

-- View: Order details with customer info
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.id,
  o.customer_id,
  c.name AS customer_name,
  c.phone AS customer_phone,
  o.subtotal,
  o.discount_total,
  o.total_amount,
  o.amount_paid,
  o.balance_due,
  o.status,
  o.payment_method,
  o.is_khata,
  o.created_at,
  o.updated_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id;

-- View: Daily sales summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT 
  DATE(o.created_at) AS sale_date,
  COUNT(*) AS total_orders,
  COUNT(CASE WHEN o.customer_id IS NULL THEN 1 END) AS walk_in_orders,
  COUNT(CASE WHEN o.customer_id IS NOT NULL THEN 1 END) AS retail_orders,
  SUM(o.subtotal) AS total_subtotal,
  SUM(o.discount_total) AS total_discounts,
  SUM(o.total_amount) AS total_sales,
  SUM(o.amount_paid) AS total_paid,
  SUM(o.balance_due) AS total_balance_due,
  COUNT(CASE WHEN o.status = 'paid' THEN 1 END) AS paid_orders,
  COUNT(CASE WHEN o.status = 'partial' THEN 1 END) AS partial_orders,
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders
FROM orders o
GROUP BY DATE(o.created_at);

-- View: Product sales with totals
CREATE OR REPLACE VIEW product_sales AS
SELECT 
  p.id,
  p.name,
  p.item_code,
  p.sale_price,
  SUM(oi.quantity) AS units_sold,
  SUM(oi.line_total) AS total_revenue,
  COUNT(DISTINCT oi.order_id) AS orders_count
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY p.id, p.name, p.item_code, p.sale_price;

-- View: Khata customer status
CREATE OR REPLACE VIEW khata_customer_status AS
SELECT 
  c.id,
  c.name,
  c.phone,
  ka.opening_balance,
  ka.current_balance,
  (ka.current_balance - ka.opening_balance) AS total_credit_used,
  ka.is_active,
  ka.created_at,
  ka.updated_at
FROM khata_accounts ka
LEFT JOIN customers c ON ka.customer_id = c.id;

-- ============================================================
-- DONE! All tables created with proper Supabase compatibility
-- ============================================================
-- Summary:
-- - 12 main tables created
-- - All enums defined
-- - All indexes created for performance
-- - RLS policies enabled and configured
-- - 4 useful views created for reporting
-- - 1 system Walk-in customer inserted
-- - Ready for production use
-- ============================================================
