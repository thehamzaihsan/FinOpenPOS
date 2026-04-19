# POS System API Implementation Guide

## Overview

This is a complete, production-ready API implementation for a Point-of-Sale (POS) system. All routes use Supabase as the backend database with proper authentication, validation, error handling, and pagination.

## File Structure

```
src/app/api/
├── products/
│   ├── route.ts                          # GET (list), POST (create)
│   ├── [productId]/
│   │   ├── route.ts                      # GET, PUT, DELETE
│   │   └── variants/
│   │       └── [variantId]/
│   │           └── route.ts              # PUT, DELETE
│   ├── variants/
│   │   └── route.ts                      # POST (create variant)
│   ├── import/
│   │   └── route.ts                      # POST (CSV import)
│   └── by-code/
│       └── [itemCode]/
│           └── route.ts                  # GET (lookup by barcode)
│
├── customers/
│   ├── route.ts                          # GET (list), POST (create)
│   ├── [customerId]/
│   │   └── route.ts                      # GET, PUT, DELETE
│   └── walk-in/
│       └── route.ts                      # GET (system walk-in customer)
│
├── deals/
│   ├── route.ts                          # GET (list), POST (create)
│   ├── [dealId]/
│   │   ├── route.ts                      # GET, PUT, DELETE
│   │   └── items/
│   │       └── route.ts                  # POST (add), DELETE (remove)
│
├── orders/
│   ├── route.ts                          # GET (list), POST (create)
│   ├── [orderId]/
│   │   ├── route.ts                      # GET, PUT
│   │   ├── refund/
│   │   │   └── route.ts                  # POST (process refund)
│   │   └── items/
│   │       └── route.ts                  # POST (add items)
│   └── today/
│       └── route.ts                      # GET (today's orders)
│
├── khata/
│   ├── route.ts                          # GET (list), POST (create)
│   ├── [khataId]/
│   │   ├── route.ts                      # GET (single with transactions)
│   │   ├── transactions/
│   │   │   └── route.ts                  # POST (add transaction)
│   │   └── statement/
│   │       └── route.ts                  # GET (full statement)
│   └── customer/
│       └── [customerId]/
│           └── route.ts                  # GET (customer's khata)
│
└── reports/
    ├── dashboard/
    │   └── route.ts                      # GET (today's metrics)
    ├── profit/
    │   └── route.ts                      # GET (profit by date range)
    ├── top-products/
    │   └── route.ts                      # GET (best sellers)
    ├── cash-flow/
    │   └── route.ts                      # GET (daily cash summary)
    └── khata-stats/
        └── route.ts                      # GET (khata breakdown)
```

## Key Features

### 1. Authentication
- All endpoints require Supabase authentication
- User session is automatically validated
- Returns 401 Unauthorized if not authenticated

### 2. Pagination
- Implemented on all list endpoints
- Default page size: 10, Max: 100
- Includes total count and hasMore flag

### 3. Validation
- Input type checking (numbers, strings, enums)
- Business logic validation (discount ranges, stock, etc.)
- Comprehensive error messages

### 4. Error Handling
- Try-catch blocks on all operations
- Specific error codes (400, 404, 409, 500, etc.)
- Rollback support for multi-step transactions

### 5. Soft Deletes
- Products, customers, deals use soft deletes (is_active flag)
- Data is never permanently removed from database
- Allows historical analysis and recovery

## API Endpoints Summary

### Products (6 endpoints)
- `GET /api/products` - List with search/pagination
- `POST /api/products` - Create product
- `GET /api/products/[productId]` - Get single product
- `PUT /api/products/[productId]` - Update product
- `DELETE /api/products/[productId]` - Soft delete
- `POST /api/products/variants` - Create variant
- `PUT /api/products/[productId]/variants/[variantId]` - Update variant
- `DELETE /api/products/[productId]/variants/[variantId]` - Delete variant
- `POST /api/products/import` - CSV import with validation
- `GET /api/products/by-code/[itemCode]` - Barcode lookup

### Customers (4 endpoints)
- `GET /api/customers` - List retail customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[customerId]` - Get single customer
- `PUT /api/customers/[customerId]` - Update customer
- `DELETE /api/customers/[customerId]` - Soft delete customer
- `GET /api/customers/walk-in` - Get/create system walk-in

### Deals (5 endpoints)
- `GET /api/deals` - List active deals
- `POST /api/deals` - Create deal with items
- `GET /api/deals/[dealId]` - Get single deal
- `PUT /api/deals/[dealId]` - Update deal
- `DELETE /api/deals/[dealId]` - Soft delete deal
- `POST /api/deals/[dealId]/items` - Add items
- `DELETE /api/deals/[dealId]/items` - Remove items

### Orders (6 endpoints)
- `GET /api/orders` - List with filters
- `POST /api/orders` - Create order
- `GET /api/orders/[orderId]` - Get single order
- `PUT /api/orders/[orderId]` - Update order
- `POST /api/orders/[orderId]/refund` - Process refund
- `GET /api/orders/today` - Today's orders with summary
- `POST /api/orders/[orderId]/items` - Add items to order

### Khata (5 endpoints)
- `GET /api/khata` - List accounts
- `POST /api/khata` - Create account
- `GET /api/khata/[khataId]` - Get account with transactions
- `POST /api/khata/[khataId]/transactions` - Add transaction
- `GET /api/khata/[khataId]/statement` - Full statement for PDF
- `GET /api/khata/customer/[customerId]` - Lookup by customer

### Reports (5 endpoints)
- `GET /api/reports/dashboard` - Today's metrics
- `GET /api/reports/profit` - Profit by date range
- `GET /api/reports/top-products` - Best sellers
- `GET /api/reports/cash-flow` - Daily cash flow
- `GET /api/reports/khata-stats` - Outstanding breakdown

## Usage Examples

### Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wheat Flour 5kg",
    "description": "Premium quality",
    "purchase_price": 150,
    "sale_price": 200,
    "quantity": 50,
    "unit": "packet",
    "item_code": "WF001",
    "min_discount": 0,
    "max_discount": 10
  }'
```

### Create an Order
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
      }
    ],
    "amount_paid": 760,
    "payment_method": "cash"
  }'
```

### List Products with Search
```bash
curl "http://localhost:3000/api/products?page=1&pageSize=20&search=flour&sortOrder=asc"
```

### Get Today's Sales
```bash
curl "http://localhost:3000/api/orders/today?status=paid"
```

### Get Profit Report
```bash
curl "http://localhost:3000/api/reports/profit?date_from=2024-01-01&date_to=2024-01-31"
```

### Import Products from CSV
```bash
curl -X POST http://localhost:3000/api/products/import \
  -F "file=@products.csv"
```

## Response Format

### Success Response (200/201)
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10,
    "hasMore": true
  }
}
```

### Error Response (400/404/500)
```json
{
  "error": "Descriptive error message",
  "status": 400
}
```

## HTTP Status Codes

- **200 OK** - GET, PUT, DELETE successful
- **201 Created** - POST successful
- **207 Multi-Status** - Partial success (e.g., CSV import)
- **400 Bad Request** - Invalid input/parameters
- **401 Unauthorized** - Not authenticated
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists
- **500 Internal Server Error** - Server error

## Validation Rules

### Products
- Name required, non-empty
- Purchase price ≥ 0
- Sale price ≥ 0
- Quantity ≥ 0
- Discount: min ≤ max ≤ 100

### Customers
- Name required, non-empty
- Phone optional, unique if provided
- Types: walk_in, retail

### Orders
- At least one item required
- Amount paid ≥ 0
- Unit price ≥ 0
- Discount 0-100%
- Valid payment methods: cash, card, bank_transfer, khata

### Khata Transactions
- Amount > 0
- Type: debit or credit
- Description required

## Database Requirements

The API assumes these tables exist in Supabase:

- `products` - Product catalog
- `product_variants` - Product variants/SKUs
- `customers` - Customer records
- `deals` - Deal/bundle records
- `deal_items` - Items in deals
- `orders` - Sales orders
- `order_items` - Items in orders
- `khata_accounts` - Credit accounts
- `khata_transactions` - Credit ledger
- `expenses` - Optional expense tracking

See `schema.sql` for table definitions.

## Performance Considerations

1. **Pagination** - Always use pagination on list endpoints
2. **Soft Deletes** - Filter `is_active = true` in queries
3. **Indexes** - Ensure indexes on common filter columns
4. **Relationships** - Use select with relationships for nested data
5. **Limits** - Respect query parameter limits (pageSize max 100)

## Security Considerations

1. **Authentication** - All endpoints validate user session
2. **Input Validation** - All inputs validated before database operations
3. **SQL Injection** - Supabase client handles parameterization
4. **Data Types** - Strict type checking with TypeScript
5. **Error Messages** - Don't expose sensitive database details

## Troubleshooting

### 401 Unauthorized
- Check if user is logged in
- Verify Supabase session is active
- Check cookie settings

### 400 Bad Request
- Validate request body matches schema
- Check parameter formats (especially dates)
- Ensure required fields are provided

### 404 Not Found
- Verify resource ID is correct
- Check resource hasn't been soft-deleted

### 500 Internal Server Error
- Check server logs
- Verify Supabase connection
- Check table permissions

## Future Enhancements

1. Rate limiting
2. Caching layer (Redis)
3. Audit logging
4. Batch operations
5. Export to PDF/Excel
6. Email notifications
7. Multi-tenancy support
8. Advanced filtering/search

## Support

For issues or questions:
1. Check API documentation in `API_DOCUMENTATION.ts`
2. Review database types in `types/database.types.ts`
3. Check Supabase console for data
4. Review server logs for errors

---

**Last Updated:** April 19, 2024
**API Version:** 1.0.0
**Status:** Production Ready
