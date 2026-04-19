# Fixing Common Database Errors

## Error 1: "invalid input value for enum order_status: \"paid\""

**Cause**: Supabase database has old enum that doesn't include 'paid' and 'partial' values

**Fix**: Run this SQL in Supabase SQL Editor:

```sql
ALTER TYPE order_status ADD VALUE 'paid' IF NOT EXISTS;
ALTER TYPE order_status ADD VALUE 'partial' IF NOT EXISTS;
ALTER TYPE order_status ADD VALUE 'refunded' IF NOT EXISTS;
```

---

## Error 2: "null value in column \"customer_id\" of relation \"orders\" violates not-null constraint"

**Cause**: Old database schema has customer_id marked as NOT NULL, but walk-in sales need NULL customer_id

**Fix**: Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE orders 
ALTER COLUMN customer_id DROP NOT NULL;
```

This allows walk-in sales (where customer_id is NULL) to work properly.

---
