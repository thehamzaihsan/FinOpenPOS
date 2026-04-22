-- ============================================================
-- POS-SY Fix Missing user_id Columns
-- This migration ensures all multi-tenant tables have a user_id column.
-- ============================================================

DO $$ 
BEGIN
    -- List of tables that need a user_id for isolation
    
    -- products table (Reported as missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id') THEN
        ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
    END IF;

    -- customers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id') THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
    END IF;

    -- product_variants table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'user_id') THEN
        ALTER TABLE product_variants ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- deals table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'user_id') THEN
        ALTER TABLE deals ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- deal_items table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deal_items' AND column_name = 'user_id') THEN
        ALTER TABLE deal_items ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- orders table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    END IF;

    -- order_items table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'user_id') THEN
        ALTER TABLE order_items ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- khata_accounts table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'khata_accounts' AND column_name = 'user_id') THEN
        ALTER TABLE khata_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- khata_transactions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'khata_transactions' AND column_name = 'user_id') THEN
        ALTER TABLE khata_transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;

    -- expenses table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id') THEN
        ALTER TABLE expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
    END IF;

    -- cash_summary table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_summary' AND column_name = 'user_id') THEN
        ALTER TABLE cash_summary ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
END $$;

-- Refresh RLS Policies (Ensure they exist and use user_id)
DO $$ 
BEGIN
    -- Products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'user_own_products') THEN
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "user_own_products" ON products FOR ALL USING (user_id = auth.uid());
    END IF;

    -- Customers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'user_own_customers') THEN
        ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "user_own_customers" ON customers FOR ALL USING (user_id = auth.uid());
    END IF;

    -- Orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'user_own_orders') THEN
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "user_own_orders" ON orders FOR ALL USING (user_id = auth.uid());
    END IF;

    -- Deals
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'user_own_deals') THEN
        ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "user_own_deals" ON deals FOR ALL USING (user_id = auth.uid());
    END IF;
END $$;
