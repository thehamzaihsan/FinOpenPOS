# POS-SY Supabase Setup Guide

## Overview
This guide walks you through setting up the complete POS-SY database schema in Supabase.

## Prerequisites
- Active Supabase project
- Admin access to Supabase dashboard
- Supabase API credentials (.env.local configured)

## Step 1: Prepare Environment Variables

Update your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Account Seed (optional - used during migration)
ADMIN_EMAIL=admin@pos-sy.dev
ADMIN_NAME=POS-SY Admin
```

## Step 2: Apply Migration

### Option A: Via Supabase Dashboard (Recommended for first-time setup)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **SQL Editor** → **New Query**
4. Copy entire contents of `migrations/001_pos_complete_schema.sql`
5. Paste into the SQL editor
6. Click **Run**
7. Verify all tables created successfully

### Option B: Via SQL File Upload
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query** → **Create from template** → **Upload SQL file**
3. Select `migrations/001_pos_complete_schema.sql`
4. Click **Run**

### Option C: Via Supabase CLI (if installed)

```bash
supabase migration new pos_complete_schema
# Copy the SQL migration contents into the new file
supabase migration up
```

## Step 3: Verify Schema Creation

After running migration, verify tables exist:

```sql
-- Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should return 12 tables:
-- cash_summary
-- customers
-- deal_items
-- deals
-- expenses
-- khata_accounts
-- khata_transactions
-- order_items
-- orders
-- product_variants
-- products
-- users
```

Run this in Supabase SQL Editor to verify.

## Step 4: Seed Default Data

The migration automatically creates:
- ✅ Walk-in customer record
- ✅ Admin user (using environment variables or defaults)

To verify:

```sql
-- Check walk-in customer
SELECT id, name, customer_type, is_walk_in FROM customers;

-- Check admin user
SELECT id, email, name, role FROM users;
```

## Step 5: Update TypeScript Types

Once schema is created, generate TypeScript types:

```bash
npm install
# Types are auto-generated in src/types/database.types.ts
```

## Step 6: Test Connection

Run a test query to verify everything works:

```bash
npm run dev
```

Visit: `http://localhost:3000/api/test-db` to verify connection

## Database Schema Summary

### Core Tables (12 Total)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | Admin + Salesman roles | Role-based access control |
| `customers` | Walk-in + Retail customers | Walk-in system record, retail with details |
| `products` | Parent products | Shopify-style with variants, discount ranges |
| `product_variants` | Product sizes/colors | Per-variant pricing, stock, item codes |
| `deals` | Product bundles | Quick order templates |
| `deal_items` | Items in deals | Links products to deals with quantities |
| `orders` | Customer transactions | Auto-calculated balance_due, is_khata flag |
| `order_items` | Line items | Per-item discounts, line totals |
| `khata_accounts` | Customer credit accounts | Opening balance, current balance |
| `khata_transactions` | Credit ledger | Debit/credit transactions, running balance |
| `expenses` | Expense tracking | Categories, dates, amounts |
| `cash_summary` | Daily cash reconciliation | Daily totals, net cash calculation |

### Business Logic (Automatic)

#### Triggers
1. **Auto-Khata Flagging**: When order.amount_paid < order.total_amount, automatically sets `is_khata = true`
2. **Walk-in Protection**: Prevents khata account creation for walk-in customers
3. **Balance Calculation**: `balance_due` computed automatically as (total_amount - amount_paid)

#### Constraints
- Discount ranges enforced (min_discount ≤ max_discount ≤ 100)
- Order quantities must be > 0
- One walk-in customer only
- Unique item codes per product/variant

### Row Level Security (RLS)

All tables have RLS enabled:
- **Admins**: Full access to all records
- **Salesman**: Read-only for customers, products, orders
- **Users**: Can only view their own profile

## Troubleshooting

### Error: "Table already exists"
Solution: Migration has `IF NOT EXISTS` clauses. Safe to re-run.

### Error: "Trigger already exists"
Solution: Migration drops triggers before recreating. Safe to re-run.

### Walk-in customer not created
Solution: Check if INSERT was skipped due to existing record:
```sql
INSERT INTO customers (name, customer_type, is_walk_in, is_active)
VALUES ('Walk-in Customer', 'walk_in', true, true)
ON CONFLICT DO NOTHING;
```

### Admin user not created
Solution: Ensure ADMIN_EMAIL env var is set, or use default:
```sql
SELECT * FROM users WHERE role = 'admin';
```

## Next Steps

After schema setup:

1. ✅ Run migration (this step)
2. ⏭️ [Create TypeScript types](../src/types/database.types.ts)
3. ⏭️ [Implement product APIs](../src/app/api/products/)
4. ⏭️ [Build product UI](../src/app/dashboard/products/)
5. ⏭️ [Set up authentication middleware](../src/middleware.ts)

## Security Notes

- RLS policies enabled on all tables
- Admin password stored in Supabase Auth only (never in DB)
- Service role key should never be exposed to frontend
- All user queries scoped to their role

## Support

If you encounter issues:
1. Check Supabase dashboard for SQL errors
2. Verify environment variables are set
3. Ensure Supabase project is active
4. Check database quota not exceeded

---

**Last Updated**: 2025-04-19  
**Schema Version**: 1.0  
**Compatible With**: Supabase v2.0+
