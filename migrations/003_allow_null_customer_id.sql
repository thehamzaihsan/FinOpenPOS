-- ============================================================
-- Fix orders table - allow NULL customer_id for walk-in sales
-- ============================================================

-- Drop the NOT NULL constraint on customer_id
ALTER TABLE orders 
ALTER COLUMN customer_id DROP NOT NULL;

-- Verify the change
-- SELECT column_name, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'orders' AND column_name = 'customer_id';
