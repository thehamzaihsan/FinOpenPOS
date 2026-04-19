-- ============================================================
-- Fix order_status enum to include 'paid' and 'partial'
-- Run this migration if you get: 
-- "invalid input value for enum order_status: \"paid\""
-- ============================================================

-- Step 1: Alter existing enum to add missing values
ALTER TYPE order_status ADD VALUE 'paid' IF NOT EXISTS;
ALTER TYPE order_status ADD VALUE 'partial' IF NOT EXISTS;
ALTER TYPE order_status ADD VALUE 'refunded' IF NOT EXISTS;

-- Step 2: Verify the enum now has all correct values
-- SELECT enum_range(NULL::order_status);

-- Step 3: Update any existing orders with old status values
UPDATE orders SET status = 'pending' WHERE status NOT IN ('pending', 'paid', 'partial', 'refunded');

-- Done!
