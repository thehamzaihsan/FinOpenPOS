# POS-SY Setup & Getting Started Guide

## ⚡ Quick Start (5 minutes)

### 1. Clone & Install
```bash
cd /media/hamzaihsan/projects_drive/Work/POS-SYS/FinOpenPOS
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Apply Database Migration
- Go to: https://app.supabase.com → Your Project → SQL Editor
- Create new query
- Copy entire contents of `migrations/001_pos_complete_schema.sql`
- Run the migration
- Verify all 12 tables are created

### 4. Verify Setup
```bash
npm run dev
# Visit: http://localhost:3000/api/db/test
```

You should see:
```json
{
  "success": true,
  "setup_status": {
    "fully_configured": true
  }
}
```

### 5. Start Using POS-SY
Visit: `http://localhost:3000/login`

---

## 📋 Detailed Setup Steps

### Step 1: Environment Variables

**File**: `.env.local`

Get these from Supabase Dashboard:
1. Go to: Project Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ADMIN_EMAIL=admin@pos-sy.dev
ADMIN_NAME=POS-SY Admin
```

### Step 2: Database Migration

The migration file includes:
- ✅ 12 complete tables with proper schema
- ✅ 6 enums for type safety
- ✅ Automatic triggers (khata flagging, balance calculation)
- ✅ Row Level Security (RLS) policies
- ✅ Performance indexes
- ✅ System walk-in customer record
- ✅ Admin user seeding

**Apply migration**:

Option A (Recommended - Via Dashboard):
1. Supabase Dashboard → SQL Editor → New Query
2. Paste entire `migrations/001_pos_complete_schema.sql`
3. Click "Run"
4. Wait for completion (usually < 30 seconds)

Option B (Via CLI):
```bash
supabase migration up
```

Option C (Manual):
```bash
# Copy SQL migration
cat migrations/001_pos_complete_schema.sql | pbcopy  # macOS
# Or on Linux: cat migrations/001_pos_complete_schema.sql | xclip

# Paste in Supabase SQL Editor and run
```

### Step 3: Verify Setup

Run the database test endpoint:

```bash
npm run dev
```

Visit: `http://localhost:3000/api/db/test`

**Expected response**:
```json
{
  "success": true,
  "checks": {
    "database_connection": { "status": "ok" },
    "tables": { "status": "ok", "verified": 12 },
    "walk_in_customer": { "status": "ok" },
    "admin_users": { "status": "ok", "count": 1 },
    "sample_products": { "status": "ok", "count": 0 }
  },
  "setup_status": {
    "fully_configured": true
  }
}
```

### Step 4: Create Products (Optional)

Via API or dashboard when ready.

### Step 5: Login

Visit: `http://localhost:3000/login`

Use your admin credentials:
- Email: admin@pos-sy.dev (or ADMIN_EMAIL env var)
- Password: Set via Supabase Auth dashboard

---

## 📂 File Structure

```
FinOpenPOS/
├── migrations/
│   └── 001_pos_complete_schema.sql    ← Database schema (RUN THIS FIRST)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── db/test/route.ts       ← Database verification endpoint
│   │   │   ├── products/              ← Product CRUD APIs
│   │   │   ├── orders/                ← Order APIs
│   │   │   ├── customers/             ← Customer APIs
│   │   │   └── khata/                 ← Khata APIs
│   │   ├── dashboard/                 ← Main dashboard
│   │   ├── login/                     ← Login page
│   │   └── salesman/                  ← POS interface
│   ├── lib/
│   │   ├── db.ts                      ← Database utilities
│   │   └── supabase/                  ← Supabase clients
│   ├── types/
│   │   └── database.types.ts          ← TypeScript types (auto from schema)
│   └── components/                    ← Reusable UI components
├── .env.example                        ← Copy to .env.local
├── .env.local                          ← Add your credentials here
├── SUPABASE_SETUP_GUIDE.md            ← Detailed setup guide
└── POS_SY_SPECIFICATION.md            ← Full specification
```

---

## 🔍 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: 
```bash
# Verify .env.local exists and has values
cat .env.local

# Both these must be set:
grep NEXT_PUBLIC_SUPABASE_URL .env.local
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

### Issue: "Table doesn't exist" error
**Solution**:
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Should return 12 tables
-- If not, reapply migration from migrations/001_pos_complete_schema.sql
```

### Issue: Walk-in customer not found
**Solution**:
```sql
-- Run in Supabase SQL Editor to recreate
INSERT INTO customers (name, customer_type, is_walk_in, is_active)
VALUES ('Walk-in Customer', 'walk_in', true, true)
ON CONFLICT DO NOTHING;
```

### Issue: Admin user not created
**Solution**:
```sql
-- Check if admin exists
SELECT * FROM users WHERE role = 'admin';

-- If not, create one:
INSERT INTO users (email, name, role, is_active)
VALUES ('admin@pos-sy.dev', 'POS-SY Admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;
```

### Issue: "CORS error" or "401 Unauthorized"
**Solution**:
1. Check SUPABASE_SERVICE_ROLE_KEY is set in .env.local
2. Verify keys haven't expired in Supabase dashboard
3. Regenerate keys if needed: Settings → API → Regenerate

---

## 📊 Database Schema Overview

### Core Tables (12 Total)

```
users (Role management)
├── admin
└── salesman

customers (Two types)
├── walk_in (system, one record, no khata)
└── retail (user-created, with khata support)
    └── khata_accounts (one per retail customer)
        └── khata_transactions (ledger entries)

products (Shopify-style hierarchy)
├── product (parent)
└── product_variants (sizes, colors, etc.)

orders (Transactions)
├── order_items (line items)
└── order → khata_transactions (if underpaid)

deals (Product bundles)
└── deal_items (bundle contents)

expenses (Expense tracking)

cash_summary (Daily reconciliation)
```

### Business Logic (Automatic)

1. **Auto-Balance Calculation**
   - `balance_due = total_amount - amount_paid` (computed column)

2. **Auto-Khata Flagging**
   - When `amount_paid < total_amount`
   - Trigger sets `is_khata = true` automatically

3. **Walk-in Protection**
   - Walk-in customers cannot have khata accounts
   - Database trigger prevents this

4. **Discount Enforcement**
   - `min_discount ≤ discount ≤ max_discount`
   - Enforced at order item level

---

## 🚀 Next Steps After Setup

### 1. Create Your First Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Product",
    "sale_price": 100,
    "purchase_price": 50,
    "quantity": 10,
    "unit": "piece"
  }'
```

### 2. Create a Retail Customer
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "555-1234",
    "address": "123 Main St",
    "customer_type": "retail"
  }'
```

### 3. Create an Order
- Visit: `http://localhost:3000/salesman/pos`
- Select products
- Choose customer
- Complete payment

### 4. View Khata (if underpaid)
- Visit: `http://localhost:3000/salesman/khata`
- View customer's outstanding balance

---

## 📱 Features Checklist

### ✅ Complete & Ready
- [x] User authentication (Supabase Auth)
- [x] Database schema (12 tables)
- [x] TypeScript types
- [x] Database utilities
- [x] Setup verification

### ⏳ Next to Build
- [ ] Product CRUD & CSV import
- [ ] Customer management
- [ ] Order creation & management
- [ ] Khata system with statements
- [ ] Invoice generation (thermal + PDF)
- [ ] Reports & analytics
- [ ] Admin panel
- [ ] UI dashboard

---

## 🔐 Security Notes

- **Service Role Key**: Never expose to frontend (server-only)
- **RLS Policies**: All tables have row-level security enabled
- **Admin Account**: Seeded with env vars, not hardcoded
- **Walk-in Protection**: Database triggers prevent khata for walk-in
- **.env.local**: Added to .gitignore (not committed)

---

## 📞 Support

If you encounter issues:

1. **Check database test**: `http://localhost:3000/api/db/test`
2. **Review logs**: `npm run dev` console output
3. **Check Supabase dashboard**: Project → Logs
4. **Verify environment**: `.env.local` has all required vars
5. **Read specification**: `POS_SY_SPECIFICATION.md`

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `POS_SY_SPECIFICATION.md` | Complete feature specification |
| `SUPABASE_SETUP_GUIDE.md` | Detailed Supabase setup |
| `migrations/001_pos_complete_schema.sql` | Database migration |
| `src/types/database.types.ts` | TypeScript types |
| `src/lib/db.ts` | Database utilities |

---

## ✨ You're All Set!

Your POS-SY system is ready to go. Start by:

1. ✅ Running: `npm run dev`
2. ✅ Verifying: `http://localhost:3000/api/db/test`
3. ✅ Login: `http://localhost:3000/login`
4. ✅ Create products, orders, and manage your business!

**Happy selling! 🎉**

---

Last Updated: 2025-04-19  
Version: 1.0
