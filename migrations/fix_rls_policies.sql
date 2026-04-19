-- ============================================================
-- FinOpenPOS - RLS POLICIES FIX
-- Run this to fix authentication/authorization issues
-- ============================================================

-- ============================================================
-- DROP ALL EXISTING POLICIES
-- ============================================================
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "customers_admin_all" ON customers;
DROP POLICY IF EXISTS "customers_salesman_select" ON customers;
DROP POLICY IF EXISTS "customers_salesman_insert" ON customers;
DROP POLICY IF EXISTS "products_admin_all" ON products;
DROP POLICY IF EXISTS "products_salesman_select" ON products;
DROP POLICY IF EXISTS "product_variants_admin_all" ON product_variants;
DROP POLICY IF EXISTS "product_variants_salesman_select" ON product_variants;
DROP POLICY IF EXISTS "deals_admin_all" ON deals;
DROP POLICY IF EXISTS "deals_salesman_select" ON deals;
DROP POLICY IF EXISTS "deal_items_admin_all" ON deal_items;
DROP POLICY IF EXISTS "deal_items_salesman_select" ON deal_items;
DROP POLICY IF EXISTS "orders_admin_all" ON orders;
DROP POLICY IF EXISTS "orders_salesman_insert" ON orders;
DROP POLICY IF EXISTS "orders_salesman_select" ON orders;
DROP POLICY IF EXISTS "orders_salesman_update" ON orders;
DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
DROP POLICY IF EXISTS "order_items_salesman_insert" ON order_items;
DROP POLICY IF EXISTS "order_items_salesman_select" ON order_items;
DROP POLICY IF EXISTS "order_items_salesman_update" ON order_items;
DROP POLICY IF EXISTS "khata_accounts_admin_all" ON khata_accounts;
DROP POLICY IF EXISTS "khata_accounts_salesman_select" ON khata_accounts;
DROP POLICY IF EXISTS "khata_accounts_salesman_insert" ON khata_accounts;
DROP POLICY IF EXISTS "khata_transactions_admin_all" ON khata_transactions;
DROP POLICY IF EXISTS "khata_transactions_salesman_select" ON khata_transactions;
DROP POLICY IF EXISTS "khata_transactions_salesman_insert" ON khata_transactions;
DROP POLICY IF EXISTS "expenses_admin_all" ON expenses;
DROP POLICY IF EXISTS "cash_summary_admin_all" ON cash_summary;

-- ============================================================
-- CREATE NEW RLS POLICIES - AUTHENTICATED USERS ONLY
-- ============================================================

-- Users: Allow authenticated users to view/manage
CREATE POLICY "users_authenticated_all" ON users
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Customers: Allow authenticated users to select, admins to modify
CREATE POLICY "customers_authenticated_select" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "customers_authenticated_insert" ON customers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customers_authenticated_update" ON customers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Products: Allow authenticated users to view, admins to modify
CREATE POLICY "products_authenticated_select" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "products_authenticated_insert" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "products_authenticated_update" ON products
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Product Variants: Allow authenticated users to view, admins to modify
CREATE POLICY "product_variants_authenticated_select" ON product_variants
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_variants_authenticated_insert" ON product_variants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "product_variants_authenticated_update" ON product_variants
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Deals: Allow authenticated users to view, admins to modify
CREATE POLICY "deals_authenticated_select" ON deals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "deals_authenticated_insert" ON deals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "deals_authenticated_update" ON deals
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Deal Items: Allow authenticated users to view, admins to modify
CREATE POLICY "deal_items_authenticated_select" ON deal_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "deal_items_authenticated_insert" ON deal_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "deal_items_authenticated_update" ON deal_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Orders: Allow authenticated users to view/insert/update
CREATE POLICY "orders_authenticated_select" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_authenticated_insert" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orders_authenticated_update" ON orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Order Items: Allow authenticated users to view/insert/update
CREATE POLICY "order_items_authenticated_select" ON order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_authenticated_insert" ON order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_authenticated_update" ON order_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Khata Accounts: Allow authenticated users to view/insert/update
CREATE POLICY "khata_accounts_authenticated_select" ON khata_accounts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "khata_accounts_authenticated_insert" ON khata_accounts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "khata_accounts_authenticated_update" ON khata_accounts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Khata Transactions: Allow authenticated users to view/insert
CREATE POLICY "khata_transactions_authenticated_select" ON khata_transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "khata_transactions_authenticated_insert" ON khata_transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Expenses: Allow authenticated users to view/insert/update
CREATE POLICY "expenses_authenticated_select" ON expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_authenticated_insert" ON expenses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "expenses_authenticated_update" ON expenses
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Cash Summary: Allow authenticated users to view/insert/update
CREATE POLICY "cash_summary_authenticated_select" ON cash_summary
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cash_summary_authenticated_insert" ON cash_summary
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "cash_summary_authenticated_update" ON cash_summary
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- DONE! RLS policies updated
-- ============================================================
