-- ============================================================
-- POS-SYS | Complete Supabase Migration
-- Version: 1.0
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- SECTION 0: CLEAN SLATE (Optional - uncomment to reset)
-- ============================================================
-- DROP TABLE IF EXISTS cash_summary CASCADE;
-- DROP TABLE IF EXISTS expenses CASCADE;
-- DROP TABLE IF EXISTS khata_transactions CASCADE;
-- DROP TABLE IF EXISTS khata_accounts CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS deal_items CASCADE;
-- DROP TABLE IF EXISTS deals CASCADE;
-- DROP TABLE IF EXISTS product_variants CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TYPE IF EXISTS customer_type;
-- DROP TYPE IF EXISTS order_status;
-- DROP TYPE IF EXISTS unit_type;
-- DROP TYPE IF EXISTS payment_method;
-- DROP TYPE IF EXISTS transaction_type;

-- ============================================================
-- SECTION 0: DROP OLD ENUMS & RESET (if needed)
-- Uncomment if you get enum conflicts
-- ============================================================
-- DROP TYPE IF EXISTS order_status CASCADE;
-- DROP TYPE IF EXISTS payment_method CASCADE;
-- DROP TYPE IF EXISTS customer_type CASCADE;
-- DROP TYPE IF EXISTS unit_type CASCADE;
-- DROP TYPE IF EXISTS transaction_type CASCADE;
-- DROP TYPE IF EXISTS user_role CASCADE;

-- ============================================================
-- SECTION 1: ENUMS
-- ============================================================
CREATE TYPE IF NOT EXISTS customer_type AS ENUM ('walk_in', 'retail');
CREATE TYPE IF NOT EXISTS order_status AS ENUM ('pending', 'paid', 'partial', 'refunded');
CREATE TYPE IF NOT EXISTS unit_type AS ENUM ('piece', 'dozen', 'kg', 'packet', 'litre', 'meter');
CREATE TYPE IF NOT EXISTS payment_method AS ENUM ('cash', 'card', 'bank_transfer', 'khata');
CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('debit', 'credit');
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'salesman');

-- ============================================================
-- SECTION 2: USERS & ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'salesman',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================
-- SECTION 3: CUSTOMERS
-- Two types: walk_in (system-level, one record) and retail
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    customer_type customer_type NOT NULL DEFAULT 'retail',
    is_walk_in BOOLEAN NOT NULL DEFAULT false,  -- TRUE only for system Walk-in record
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_walk_in CHECK (
        CASE WHEN is_walk_in = true THEN 1 ELSE 0 END <= 1
    )
);

-- Create system Walk-in customer (one permanent record)
INSERT INTO customers (name, customer_type, is_walk_in, is_active)
VALUES ('Walk-in Customer', 'walk_in', true, true)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_is_walk_in ON customers(is_walk_in);

-- ============================================================
-- SECTION 4: PRODUCTS & VARIANTS (Shopify-style)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    purchase_price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit unit_type NOT NULL DEFAULT 'piece',
    item_code VARCHAR(255) UNIQUE,
    min_discount DECIMAL(5, 2) NOT NULL DEFAULT 0,
    max_discount DECIMAL(5, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT discount_range CHECK (
        min_discount >= 0 
        AND max_discount >= min_discount 
        AND max_discount <= 100
    )
);

CREATE TABLE IF NOT EXISTS product_variants (
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT variant_quantity CHECK (quantity >= 0),
    CONSTRAINT variant_discount_range CHECK (
        (min_discount IS NULL OR min_discount >= 0)
        AND (max_discount IS NULL OR max_discount <= 100)
        AND (min_discount IS NULL OR max_discount IS NULL OR max_discount >= min_discount)
    )
);

CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_item_code ON products(item_code);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_item_code ON product_variants(item_code);

-- ============================================================
-- SECTION 5: DEALS (Product Bundles)
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT deal_item_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deal_items_deal_id ON deal_items(deal_id);

-- ============================================================
-- SECTION 6: ORDERS & ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_pct DECIMAL(5, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    line_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT item_quantity CHECK (quantity > 0),
    CONSTRAINT discount_applied CHECK (
        discount_pct >= 0 AND discount_pct <= 100
    )
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_is_khata ON orders(is_khata);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================================
-- SECTION 7: KHATA (Credit Ledger)
-- One Khata account per retail customer. Walk-in blocked.
-- ============================================================
CREATE TABLE IF NOT EXISTS khata_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE RESTRICT,
    opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS khata_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    khata_account_id UUID NOT NULL REFERENCES khata_accounts(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type transaction_type NOT NULL,
    description TEXT,
    balance_after DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_khata_accounts_customer_id ON khata_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_khata_transactions_khata_id ON khata_transactions(khata_account_id);
CREATE INDEX IF NOT EXISTS idx_khata_transactions_order_id ON khata_transactions(order_id);

-- ============================================================
-- SECTION 8: EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================================
-- SECTION 9: CASH SUMMARY
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL UNIQUE,
    total_cash_in DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_cash_out DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_expenses DECIMAL(10, 2) NOT NULL DEFAULT 0,
    net_cash DECIMAL(10, 2) GENERATED ALWAYS AS (total_cash_in - total_cash_out - total_expenses) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_summary_date ON cash_summary(summary_date);

-- ============================================================
-- SECTION 10: BUSINESS RULE TRIGGERS
-- ============================================================

-- Block Walk-in customers from having Khata account
CREATE OR REPLACE FUNCTION block_walkin_khata()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT is_walk_in FROM customers WHERE id = NEW.customer_id) = TRUE THEN
        RAISE EXCEPTION 'Walk-in customers cannot have a Khata account.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_no_walkin_khata ON khata_accounts;
CREATE TRIGGER enforce_no_walkin_khata
BEFORE INSERT ON khata_accounts
FOR EACH ROW EXECUTE FUNCTION block_walkin_khata();

-- Auto-flag order as Khata if balance_due > 0
CREATE OR REPLACE FUNCTION flag_order_as_khata()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_amount > NEW.amount_paid THEN
        NEW.is_khata := TRUE;
    ELSE
        NEW.is_khata := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_khata_flag ON orders;
CREATE TRIGGER set_order_khata_flag
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION flag_order_as_khata();

-- ============================================================
-- SECTION 11: SEED ADMIN ACCOUNT (Via SQL)
-- Note: Configure ADMIN_EMAIL and ADMIN_NAME via environment
-- ============================================================
INSERT INTO users (email, name, role, is_active)
VALUES (
    COALESCE(current_setting('app.admin_email', true), 'admin@pos-sy.dev'),
    COALESCE(current_setting('app.admin_name', true), 'POS-SYS Admin'),
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SECTION 12: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- RLS policies removed here, they are handled in 02_user_isolation.sql

-- ============================================================
-- DOCUMENTATION
-- ============================================================
-- Tables Created:
--   1. users (admin + salesman roles)
--   2. customers (walk_in + retail types)
--   3. products (parent products)
--   4. product_variants (Shopify-style variants)
--   5. deals (product bundles)
--   6. deal_items (items in deals)
--   7. orders (transactions)
--   8. order_items (line items in orders)
--   9. khata_accounts (customer credit accounts)
--   10. khata_transactions (credit ledger)
--   11. expenses (expense tracking)
--   12. cash_summary (daily cash reconciliation)
--
-- Features:
--   - Soft delete via is_active flags
--   - Automatic balance_due calculation
--   - Automatic is_khata flagging
--   - Walk-in customer protection (no khata)
--   - Shopify-style product variants
--   - Discount range enforcement
--   - Comprehensive RLS policies
--   - Performance indexes on all foreign keys and frequent query columns
--
-- ============================================================
