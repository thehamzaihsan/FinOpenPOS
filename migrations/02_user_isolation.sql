-- ============================================================
-- POS-SY Isolation & Multi-User Support Migration
-- This migration updates the schema to support per-user data isolation.
-- ============================================================

-- STEP 1: ADD user_id COLUMN TO ALL TABLES
DO $$ 
BEGIN
    -- List of tables that need a user_id for isolation
    -- We skip 'users' table because 'id' is already the user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id') THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id') THEN
        ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'user_id') THEN
        ALTER TABLE product_variants ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'user_id') THEN
        ALTER TABLE deals ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_items' AND column_name = 'user_id') THEN
        ALTER TABLE deal_items ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'user_id') THEN
        ALTER TABLE order_items ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'khata_accounts' AND column_name = 'user_id') THEN
        ALTER TABLE khata_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'khata_transactions' AND column_name = 'user_id') THEN
        ALTER TABLE khata_transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id') THEN
        ALTER TABLE expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_summary' AND column_name = 'user_id') THEN
        ALTER TABLE cash_summary ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
END $$;

-- STEP 2: CREATE INDEXES FOR user_id
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- STEP 3: RESET AND RECREATE RLS POLICIES FOR ISOLATION
-- Helper function to drop existing policies safely
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        -- Enable RLS
        EXECUTE 'ALTER TABLE public.' || quote_ident(t) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

DO $$ 
DECLARE 
    t TEXT;
    p TEXT;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        FOR p IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(p) || ' ON ' || quote_ident(t);
        END LOOP;
    END LOOP;
END $$;

-- Define a reusable check for admin role
-- We'll use a subquery to check the users table
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RECREATE POLICIES

-- Users Table
CREATE POLICY "admin_all_users" ON users FOR ALL USING (is_admin());
CREATE POLICY "user_own_profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "user_update_own_profile" ON users FOR UPDATE USING (id = auth.uid());

-- Customers Table
CREATE POLICY "admin_all_customers" ON customers FOR ALL USING (is_admin());
CREATE POLICY "user_own_customers" ON customers FOR ALL USING (user_id = auth.uid());

-- Products Table
CREATE POLICY "admin_all_products" ON products FOR ALL USING (is_admin());
CREATE POLICY "user_own_products" ON products FOR ALL USING (user_id = auth.uid());

-- Product Variants
CREATE POLICY "admin_all_product_variants" ON product_variants FOR ALL USING (is_admin());
CREATE POLICY "user_own_product_variants" ON product_variants FOR ALL USING (user_id = auth.uid());

-- Deals
CREATE POLICY "admin_all_deals" ON deals FOR ALL USING (is_admin());
CREATE POLICY "user_own_deals" ON deals FOR ALL USING (user_id = auth.uid());

-- Deal Items
CREATE POLICY "admin_all_deal_items" ON deal_items FOR ALL USING (is_admin());
CREATE POLICY "user_own_deal_items" ON deal_items FOR ALL USING (user_id = auth.uid());

-- Orders
CREATE POLICY "admin_all_orders" ON orders FOR ALL USING (is_admin());
CREATE POLICY "user_own_orders" ON orders FOR ALL USING (user_id = auth.uid());

-- Order Items
CREATE POLICY "admin_all_order_items" ON order_items FOR ALL USING (is_admin());
CREATE POLICY "user_own_order_items" ON order_items FOR ALL USING (user_id = auth.uid());

-- Khata Accounts
CREATE POLICY "admin_all_khata_accounts" ON khata_accounts FOR ALL USING (is_admin());
CREATE POLICY "user_own_khata_accounts" ON khata_accounts FOR ALL USING (user_id = auth.uid());

-- Khata Transactions
CREATE POLICY "admin_all_khata_transactions" ON khata_transactions FOR ALL USING (is_admin());
CREATE POLICY "user_own_khata_transactions" ON khata_transactions FOR ALL USING (user_id = auth.uid());

-- Expenses
CREATE POLICY "admin_all_expenses" ON expenses FOR ALL USING (is_admin());
CREATE POLICY "user_own_expenses" ON expenses FOR ALL USING (user_id = auth.uid());

-- Cash Summary
CREATE POLICY "admin_all_cash_summary" ON cash_summary FOR ALL USING (is_admin());
CREATE POLICY "user_own_cash_summary" ON cash_summary FOR ALL USING (user_id = auth.uid());
