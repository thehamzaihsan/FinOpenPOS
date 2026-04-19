# Fixing "invalid input value for enum order_status: \"paid\"" Error

## Issue
Your Supabase database has an old `order_status` enum that doesn't include `'paid'` and `'partial'` values.

## Solution

### Option 1: Quick Fix (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL:

```sql
-- Add the missing enum values
ALTER TYPE order_status ADD VALUE 'paid' IF NOT EXISTS;
ALTER TYPE order_status ADD VALUE 'partial' IF NOT EXISTS;
ALTER TYPE order_status ADD VALUE 'refunded' IF NOT EXISTS;
```

3. Click **RUN**
4. Refresh your app and try creating an order again

---

### Option 2: Check Current Enum Values

If the quick fix doesn't work, check what's currently in your enum:

```sql
-- Check current enum values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'order_status'::regtype 
ORDER BY enumsortorder;
```

Expected output:
```
pending
paid
partial
refunded
```

---

### Option 3: Full Reset (if enum is corrupted)

**WARNING: This deletes all data. Only do this on a fresh database!**

```sql
-- Drop all dependent tables
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS khata_transactions CASCADE;
DROP TABLE IF EXISTS khata_accounts CASCADE;
DROP TABLE IF EXISTS deal_items CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop old enum
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS customer_type CASCADE;
DROP TYPE IF EXISTS unit_type CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Re-run the full migration from: migrations/001_pos_complete_schema.sql
```

---

## After Fixing

1. Clear browser cache: DevTools → Application → Local Storage → Clear All
2. Refresh the app: `Ctrl+R` (or `Cmd+R` on Mac)
3. Try creating an order again

---

## Verify the Fix Works

Test in browser console:

```javascript
// Check if orders can be created
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    total_amount: 100,
    amount_paid: 100,
    status: 'paid',
    payment_method: 'cash'
  })
});
console.log(await response.json());
```

Should return an order object with `id`, NOT an error.

---

## Still Having Issues?

Check these:

1. **Is the migration running on the correct project?**
   - Verify your `.env.local` has the right Supabase URL and keys
   - Run: `echo $NEXT_PUBLIC_SUPABASE_URL`

2. **Did you apply migration to the right database?**
   - Supabase Dashboard → SQL Editor
   - Look at the project name in top-left

3. **Is there a typo in the SQL?**
   - Copy-paste directly, don't retype

---

## API Test After Enum Fix

Once fixed, test the order creation endpoint:

```bash
# Test order creation
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "total_amount": 100.00,
    "amount_paid": 100.00,
    "status": "paid",
    "payment_method": "cash"
  }'
```

Should return:
```json
{
  "id": "...",
  "total_amount": 100,
  "amount_paid": 100,
  "status": "paid",
  ...
}
```
