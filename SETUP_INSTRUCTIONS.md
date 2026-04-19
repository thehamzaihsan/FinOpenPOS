# POS System - Database Setup Instructions

## Overview
This document outlines how to set up the complete POS database schema using the Supabase SQL migration file.

## Prerequisites
- Supabase project initialized
- Access to Supabase SQL Editor
- `.env.local` file with Supabase credentials

## Setup Steps

### 1. Connect to Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query

### 2. Run the Migration
1. Copy the entire contents of `migrations/001_complete_pos_schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" button
4. Wait for all tables to be created successfully

### 3. Verify Creation
Run these verification queries:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check walk-in customer was created
SELECT * FROM customers WHERE customer_type = 'walk_in';

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

## Database Schema Overview

### Core Tables

#### Users (Authentication)
- `id` (UUID): Primary key
- `email` (VARCHAR): Unique user email
- `role` (TEXT): 'admin' or 'salesman'
- `is_active` (BOOLEAN): User status
- Timestamps: created_at, updated_at

#### Customers
- `id` (UUID): Primary key
- `customer_type` (TEXT): 'walk_in' or 'retail'
- `name` (VARCHAR): Customer name (nullable for walk-in)
- `phone` (VARCHAR): Contact number
- `address` (TEXT): Customer address
- `is_active` (BOOLEAN): Soft delete flag

**Special Rules:**
- One system-level walk-in customer is auto-seeded
- Only retail customers can have Khata accounts
- Walk-in orders cannot be linked to Khata

#### Products
- `id` (UUID): Primary key
- `name` (VARCHAR): Product name
- `purchase_price` (DECIMAL): Cost price
- `sale_price` (DECIMAL): Selling price
- `quantity` (INTEGER): Stock level
- `unit` (TEXT): 'piece', 'dozen', 'kg', or 'packet'
- `min_discount` (DECIMAL %): Minimum allowed discount
- `max_discount` (DECIMAL %): Maximum allowed discount
- `is_active` (BOOLEAN): Soft delete flag

#### Product Variants
- Shopify-style variant architecture
- Each variant has unique `item_code`
- Independent pricing and stock
- Inherits min/max discount from parent or has own limits

#### Orders
- `status` (TEXT): 'pending', 'paid', 'partial', or 'refunded'
- `amount_paid` (DECIMAL): Cash received
- `balance_due` (DECIMAL): Remaining amount
- Links to customer for retail; walk-in has no customer link
- Payment method tracking

#### Order Items
- Per-item discount tracking
- Supports both products and product variants
- Line total calculation: (unit_price × quantity) - discount_amount

#### Khata (Credit Ledger)
- `khata_accounts`: Main credit account linked to retail customers
- `khata_transactions`: Transaction log (debit/credit)
- Only retail customers can have accounts
- Auto-triggers on underpaid orders

#### Expenses & Cash Summary
- Daily expense tracking with categories
- Daily cash summary with in/out/net calculations

## Key Features

### Soft Deletes
All records use `is_active = false` instead of hard deletion. This preserves audit trails and historical data.

### RLS (Row Level Security)
Basic RLS policies are included but may need customization:
- **Admin**: Full read/write access
- **Salesman**: Read access to customers, orders; can create orders
- **Public**: Read access to active products/deals only

### Indexes
Strategic indexes on frequently queried columns:
- Product searches: `is_active`, `item_code`
- Order lookups: `customer_id`, `status`, `created_at`
- Khata reports: `customer_id`, transaction lookups
- Daily reports: `expense_date`, `summary_date`

## Important Notes

1. **Walk-in Enforcement**: The `customers` table has a unique walk-in record. All walk-in orders should link to this customer or NULL.

2. **Discount Validation**: Application code must enforce min/max discount constraints before inserting order items.

3. **Khata Trigger**: When `amount_paid < total_amount` on an order:
   - Application prompts user to select/create a Khata account
   - A khata_transaction (debit) is auto-created
   - Order status set to 'partial'

4. **Stock Management**: Application must decrement product/variant quantities when orders are finalized.

5. **No Hard Deletes**: All delete operations should set `is_active = false` via UPDATE, not DELETE.

## Seed Data

Default seed after migration:
- **Customers**: One walk-in customer (name: "Walk-in Customer", type: "walk_in")
- **Admin User**: Must be seeded manually or via application setup (see Admin Seeding section below)

## Admin Seeding

To seed an admin user from environment variables:

1. Add to `.env.local`:
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=securepassword123
```

2. Run admin seeding script (create in app initialization):
```typescript
// lib/supabase/seed-admin.ts
import { createClient } from '@/lib/supabase/server'

export async function seedAdminUser() {
  const supabase = createClient()
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.log('Admin credentials not set in env')
    return
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    })

    if (error) throw error

    // Insert into users table with admin role
    await supabase.from('users').insert({
      id: data.user.id,
      email: adminEmail,
      role: 'admin',
      is_active: true,
    })

    console.log('✅ Admin user seeded successfully')
  } catch (err) {
    console.error('❌ Failed to seed admin:', err)
  }
}
```

## Troubleshooting

### "Relation does not exist"
- Ensure migration ran completely without errors
- Check table names match (case-sensitive)

### RLS Policy Errors
- Verify auth.jwt() has correct role claim
- Check user is authenticated before inserting data

### Foreign Key Constraint Errors
- Ensure parent records exist before inserting children
- Check UUIDs match exactly (no string/UUID type mismatches)

### Index Already Exists
- If running migration multiple times, add IF NOT EXISTS to index creation
- Already included in migration file

## Next Steps

1. ✅ **Database**: Migration complete
2. ⏭️ **Auth Setup**: Seed admin account
3. ⏭️ **API Routes**: Update endpoints for new schema
4. ⏭️ **UI**: Update components for new data structures
5. ⏭️ **Business Logic**: Implement discount validation, Khata triggers, etc.

---

For detailed implementation tasks, see `IMPLEMENTATION_ASSESSMENT.md`
