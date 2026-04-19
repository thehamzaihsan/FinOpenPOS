# API Quick Start Guide

## Installation & Setup

### 1. Database Setup
Ensure your Supabase database has all required tables. See `schema.sql` for definitions.

### 2. Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Start Development Server
```bash
npm run dev
# API will be available at http://localhost:3000/api
```

## Testing the API

### Using cURL

#### List Products
```bash
curl "http://localhost:3000/api/products?page=1&pageSize=10"
```

#### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "purchase_price": 100,
    "sale_price": 150,
    "quantity": 10,
    "unit": "piece"
  }'
```

#### Create Customer
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "03001234567",
    "address": "123 Main St"
  }'
```

#### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-id-here",
    "items": [
      {
        "product_id": "product-id-here",
        "quantity": 2,
        "unit_price": 150,
        "discount_pct": 5
      }
    ],
    "amount_paid": 285,
    "payment_method": "cash"
  }'
```

### Using Postman

1. Import collection from API routes
2. Set environment variables:
   - `base_url`: http://localhost:3000
   - `auth_token`: Your Supabase session token

### Using TypeScript/JavaScript

```typescript
// Example: Fetch products
const response = await fetch('/api/products?page=1&pageSize=10');
const { success, data, pagination } = await response.json();

if (success) {
  console.log('Products:', data);
  console.log('Total:', pagination.total);
}
```

## Common Tasks

### Create Product with Variants

```bash
# 1. Create main product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-Shirt",
    "purchase_price": 200,
    "sale_price": 400,
    "quantity": 100,
    "unit": "piece"
  }'

# Response: { "success": true, "data": { "id": "prod_123", ... } }

# 2. Create variants
curl -X POST http://localhost:3000/api/products/variants \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "prod_123",
    "variant_name": "Red M",
    "item_code": "TS-RED-M",
    "quantity": 20,
    "purchase_price": 200,
    "sale_price": 400
  }'
```

### Create Order with Multiple Items

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_123",
    "items": [
      {
        "product_id": "prod_1",
        "quantity": 2,
        "unit_price": 200,
        "discount_pct": 5
      },
      {
        "product_id": "prod_2",
        "quantity": 1,
        "unit_price": 500,
        "discount_pct": 0
      }
    ],
    "amount_paid": 1385,
    "payment_method": "cash"
  }'
```

### Setup Khata (Credit Account)

```bash
# 1. Create khata account
curl -X POST http://localhost:3000/api/khata \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_123",
    "opening_balance": 0
  }'

# Response: { "success": true, "data": { "id": "khata_123", ... } }

# 2. Add transactions
curl -X POST http://localhost:3000/api/khata/khata_123/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "transaction_type": "debit",
    "description": "Customer purchase on credit"
  }'

# 3. View statement
curl "http://localhost:3000/api/khata/khata_123/statement"
```

### Import Products from CSV

```bash
# Create products.csv
cat > products.csv << EOF
name,purchase_price,sale_price,quantity,unit,item_code,min_discount,max_discount
Wheat Flour,150,200,100,packet,WF001,0,10
Rice,200,250,50,kg,RICE001,0,5
Sugar,100,120,200,packet,SG001,0,8
EOF

# Upload
curl -X POST http://localhost:3000/api/products/import \
  -F "file=@products.csv"
```

### Generate Reports

```bash
# Today's metrics
curl "http://localhost:3000/api/reports/dashboard"

# Profit report
curl "http://localhost:3000/api/reports/profit?date_from=2024-01-01&date_to=2024-01-31"

# Best-selling products
curl "http://localhost:3000/api/reports/top-products?limit=10"

# Daily cash flow
curl "http://localhost:3000/api/reports/cash-flow?date_from=2024-01-01&date_to=2024-01-31"

# Khata statistics
curl "http://localhost:3000/api/reports/khata-stats?outstanding_only=true"
```

## API Response Examples

### Create Product (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Wheat Flour 5kg",
    "purchase_price": 150,
    "sale_price": 200,
    "quantity": 50,
    "unit": "packet",
    "item_code": "WF001",
    "min_discount": 0,
    "max_discount": 10,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### List Products (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_1",
      "name": "Wheat Flour",
      "purchase_price": 150,
      "sale_price": 200,
      "quantity": 50,
      "is_active": true
    }
  ],
  "pagination": {
    "total": 145,
    "page": 1,
    "pageSize": 10,
    "totalPages": 15,
    "hasMore": true
  }
}
```

### Create Order (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "ord_123",
    "customer_id": "cust_456",
    "subtotal": 800,
    "discount_total": 50,
    "total_amount": 750,
    "amount_paid": 750,
    "balance_due": 0,
    "status": "paid",
    "payment_method": "cash",
    "items": [
      {
        "id": "item_1",
        "product_id": "prod_1",
        "quantity": 2,
        "unit_price": 200,
        "discount_pct": 5,
        "discount_amount": 20,
        "line_total": 380
      }
    ],
    "customer": {
      "id": "cust_456",
      "name": "John Doe",
      "phone": "03001234567"
    }
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Missing required fields: name, purchase_price, sale_price, quantity"
}
```

## Debugging Tips

### Enable Detailed Logging

Add to your API route before throwing errors:
```typescript
console.error('Operation name:', {
  params,
  body,
  error: error instanceof Error ? error.message : error
});
```

### Check Supabase Console

1. Go to Supabase Dashboard
2. Check "Database" → "Tables" for data
3. View "Logs" for SQL errors
4. Check "Realtime" for subscription issues

### Use Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Make API calls
4. Click on request to see:
   - Request headers
   - Request body
   - Response status
   - Response body

### Test Authentication

```bash
# Check if user is authenticated
curl -X GET http://localhost:3000/api/products \
  -H "Cookie: your_auth_cookie"
```

## Performance Optimization

### Use Pagination
```bash
# Good - returns only 10 items
curl "http://localhost:3000/api/products?page=1&pageSize=10"

# Avoid - loading all products at once
curl "http://localhost:3000/api/products"
```

### Filter by Date
```bash
# Good - narrows down results
curl "http://localhost:3000/api/orders?date_from=2024-01-01&date_to=2024-01-31"

# Avoid - loading all orders
curl "http://localhost:3000/api/orders"
```

### Use Search
```bash
# Good - specific search
curl "http://localhost:3000/api/products?search=flour"

# Avoid - loading all products
curl "http://localhost:3000/api/products"
```

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Not authenticated | Login first, check session |
| 400 Bad Request | Invalid input | Check request body format |
| 404 Not Found | Resource doesn't exist | Verify ID is correct |
| 409 Conflict | Duplicate resource | Check if already exists |
| 500 Server Error | Server issue | Check logs, verify DB connection |

## Next Steps

1. ✅ Start development server
2. ✅ Test basic CRUD operations
3. ✅ Setup database with sample data
4. ✅ Integrate with frontend
5. ✅ Setup error handling
6. ✅ Add logging/monitoring
7. ✅ Deploy to production

## Documentation Links

- Full API Documentation: `API_DOCUMENTATION.ts`
- Implementation Guide: `API_IMPLEMENTATION_GUIDE.md`
- Database Types: `types/database.types.ts`
- Schema Definition: `schema.sql`

---

**Ready to build!** 🚀
