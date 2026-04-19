# FinOpenPOS - Comprehensive API Testing Guide

## Overview
This document provides a complete testing guide for all FinOpenPOS APIs, including:
- 41 API endpoints across 6 modules
- Database triggers and business rules
- Edge cases and error handling
- Expected vs actual behavior verification

**Status**: Before running tests, ensure:
1. Database migration has been applied to Supabase: `migrations/001_pos_complete_schema.sql`
2. Environment variables are configured in `.env.local`
3. Dev server is running: `npm run dev` (port 3000)

---

## Module 1: Products API (8 endpoints)

### 1.1 GET /api/products
**Purpose**: List all active products with pagination and search

**Test Cases**:
- ✅ List products without filters
  ```bash
  curl http://localhost:3000/api/products
  ```
  **Expected**: 200 OK, array of products with pagination info

- ✅ Pagination test
  ```bash
  curl http://localhost:3000/api/products?page=2&pageSize=5
  ```
  **Expected**: 200 OK, second page with 5 items

- ✅ Search test
  ```bash
  curl http://localhost:3000/api/products?search=laptop
  ```
  **Expected**: 200 OK, filtered results matching "laptop"

- ✅ Filter by category
  ```bash
  curl http://localhost:3000/api/products?category=electronics
  ```
  **Expected**: 200 OK, products in electronics category

- ❌ Invalid page size > 100
  ```bash
  curl http://localhost:3000/api/products?pageSize=150
  ```
  **Expected**: 400 Bad Request

---

### 1.2 POST /api/products
**Purpose**: Create new product with variants support

**Test Cases**:
- ✅ Create basic product
  ```bash
  curl -X POST http://localhost:3000/api/products \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Laptop Dell XPS",
      "description": "13 inch laptop",
      "sku": "DELL-XPS-13",
      "item_code": "DX13",
      "category": "Electronics",
      "purchase_price": 800,
      "sale_price": 1200,
      "quantity": 10,
      "unit": "piece",
      "min_stock": 2,
      "max_stock": 50
    }'
  ```
  **Expected**: 201 Created, returns product with ID

- ✅ Create with discount range
  ```bash
  curl -X POST http://localhost:3000/api/products \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Product",
      "purchase_price": 100,
      "sale_price": 150,
      "quantity": 5,
      "min_discount_pct": 5,
      "max_discount_pct": 15
    }'
  ```
  **Expected**: 201 Created

- ❌ Invalid discount range (min > max)
  ```bash
  curl -X POST http://localhost:3000/api/products \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Product",
      "purchase_price": 100,
      "sale_price": 150,
      "quantity": 5,
      "min_discount_pct": 15,
      "max_discount_pct": 5
    }'
  ```
  **Expected**: 400 Bad Request, "min_discount_pct cannot be greater than max_discount_pct"

- ❌ Missing required fields
  ```bash
  curl -X POST http://localhost:3000/api/products \
    -H "Content-Type: application/json" \
    -d '{"name": "Product"}'
  ```
  **Expected**: 400 Bad Request

- ❌ Invalid prices (sale_price < purchase_price)
  ```bash
  curl -X POST http://localhost:3000/api/products \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Product",
      "purchase_price": 200,
      "sale_price": 100,
      "quantity": 5
    }'
  ```
  **Expected**: 400 Bad Request or allowed if business rules permit

---

### 1.3 GET /api/products/[productId]
**Purpose**: Retrieve single product with all details

**Test Cases**:
- ✅ Get existing product
  ```bash
  curl http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000
  ```
  **Expected**: 200 OK, full product details with variants

- ❌ Get non-existent product
  ```bash
  curl http://localhost:3000/api/products/00000000-0000-0000-0000-000000000000
  ```
  **Expected**: 404 Not Found

- ❌ Invalid UUID format
  ```bash
  curl http://localhost:3000/api/products/invalid-id
  ```
  **Expected**: 400 Bad Request

---

### 1.4 PUT /api/products/[productId]
**Purpose**: Update product details

**Test Cases**:
- ✅ Update product name
  ```bash
  curl -X PUT http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000 \
    -H "Content-Type: application/json" \
    -d '{"name": "Updated Laptop Dell XPS 15"}'
  ```
  **Expected**: 200 OK, updated product

- ✅ Update prices
  ```bash
  curl -X PUT http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000 \
    -H "Content-Type: application/json" \
    -d '{"purchase_price": 850, "sale_price": 1250}'
  ```
  **Expected**: 200 OK

- ✅ Update stock quantity
  ```bash
  curl -X PUT http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000 \
    -H "Content-Type: application/json" \
    -d '{"quantity": 25}'
  ```
  **Expected**: 200 OK

- ✅ Update discount range
  ```bash
  curl -X PUT http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000 \
    -H "Content-Type: application/json" \
    -d '{"min_discount_pct": 10, "max_discount_pct": 20}'
  ```
  **Expected**: 200 OK

---

### 1.5 DELETE /api/products/[productId]
**Purpose**: Soft delete product (mark as inactive)

**Test Cases**:
- ✅ Soft delete product
  ```bash
  curl -X DELETE http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000
  ```
  **Expected**: 200 OK, product marked as inactive

- ✅ Verify product not in list after deletion
  ```bash
  curl http://localhost:3000/api/products
  ```
  **Expected**: 200 OK, deleted product not in list (but exists in DB)

- ❌ Delete non-existent product
  ```bash
  curl -X DELETE http://localhost:3000/api/products/00000000-0000-0000-0000-000000000000
  ```
  **Expected**: 404 Not Found

---

### 1.6 POST /api/products/[productId]/variants/[variantId]
**Purpose**: Create, update, delete product variants

**Test Cases**:
- ✅ Create variant
  ```bash
  curl -X POST http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000/variants \
    -H "Content-Type: application/json" \
    -d '{
      "name": "XPS 13 Silver",
      "attributes": {"color": "silver", "ram": "16GB"},
      "sku": "DELL-XPS-13-SLV-16G",
      "purchase_price": 850,
      "sale_price": 1250,
      "quantity": 5
    }'
  ```
  **Expected**: 201 Created, variant with ID

- ✅ Update variant
  ```bash
  curl -X PUT http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000/variants/var-123 \
    -H "Content-Type: application/json" \
    -d '{"quantity": 8}'
  ```
  **Expected**: 200 OK

- ✅ Delete variant
  ```bash
  curl -X DELETE http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000/variants/var-123
  ```
  **Expected**: 200 OK

---

### 1.7 POST /api/products/import
**Purpose**: Bulk import products from CSV

**Test Cases**:
- ✅ Valid CSV import
  ```bash
  curl -X POST http://localhost:3000/api/products/import \
    -H "Content-Type: application/json" \
    -d '{
      "csv_content": "name,purchase_price,sale_price,quantity,unit\nLaptop,800,1200,10,piece\nMouse,15,25,50,piece"
    }'
  ```
  **Expected**: 200 OK, { imported: 2, failed: 0, errors: [] }

- ❌ CSV with invalid prices
  ```bash
  curl -X POST http://localhost:3000/api/products/import \
    -H "Content-Type: application/json" \
    -d '{
      "csv_content": "name,purchase_price,sale_price,quantity\nLaptop,invalid,1200,10"
    }'
  ```
  **Expected**: 400 Bad Request, error details

- ❌ CSV with discount validation
  ```bash
  curl -X POST http://localhost:3000/api/products/import \
    -H "Content-Type: application/json" \
    -d '{
      "csv_content": "name,purchase_price,sale_price,quantity,min_discount,max_discount\nLaptop,800,1200,10,20,10"
    }'
  ```
  **Expected**: 400 Bad Request, "min_discount cannot be greater than max_discount"

---

### 1.8 GET /api/products/by-code/[itemCode]
**Purpose**: Lookup product by barcode/item code

**Test Cases**:
- ✅ Find product by item code
  ```bash
  curl http://localhost:3000/api/products/by-code/DX13
  ```
  **Expected**: 200 OK, product details

- ✅ Find product by barcode
  ```bash
  curl http://localhost:3000/api/products/by-code/8901234567890
  ```
  **Expected**: 200 OK, product details

- ❌ Non-existent code
  ```bash
  curl http://localhost:3000/api/products/by-code/NONEXISTENT
  ```
  **Expected**: 404 Not Found

---

## Module 2: Customers API (6 endpoints)

### 2.1 GET /api/customers
**Purpose**: List retail customers with pagination

**Test Cases**:
- ✅ List all customers
  ```bash
  curl http://localhost:3000/api/customers
  ```
  **Expected**: 200 OK, array of retail customers (excluding walk-in)

- ✅ Search by name
  ```bash
  curl http://localhost:3000/api/customers?search=Ali
  ```
  **Expected**: 200 OK, filtered results

- ✅ Filter by type
  ```bash
  curl http://localhost:3000/api/customers?type=retail
  ```
  **Expected**: 200 OK

---

### 2.2 POST /api/customers
**Purpose**: Create new customer

**Test Cases**:
- ✅ Create retail customer
  ```bash
  curl -X POST http://localhost:3000/api/customers \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Ali Ahmed",
      "phone": "03001234567",
      "email": "ali@example.com",
      "address": "123 Main St",
      "type": "retail"
    }'
  ```
  **Expected**: 201 Created

- ✅ Create wholesale customer
  ```bash
  curl -X POST http://localhost:3000/api/customers \
    -H "Content-Type: application/json" \
    -d '{
      "name": "ABC Trading",
      "phone": "03002234567",
      "email": "abc@example.com",
      "address": "Trade Street",
      "type": "wholesale"
    }'
  ```
  **Expected**: 201 Created

- ❌ Missing required name
  ```bash
  curl -X POST http://localhost:3000/api/customers \
    -H "Content-Type: application/json" \
    -d '{"phone": "03001234567"}'
  ```
  **Expected**: 400 Bad Request

---

### 2.3 GET /api/customers/[customerId]
**Purpose**: Get single customer details

**Test Cases**:
- ✅ Get existing customer
  ```bash
  curl http://localhost:3000/api/customers/cust-123
  ```
  **Expected**: 200 OK, customer details

---

### 2.4 PUT /api/customers/[customerId]
**Purpose**: Update customer information

**Test Cases**:
- ✅ Update customer name
  ```bash
  curl -X PUT http://localhost:3000/api/customers/cust-123 \
    -H "Content-Type: application/json" \
    -d '{"name": "Ali Ahmed Khan"}'
  ```
  **Expected**: 200 OK

---

### 2.5 DELETE /api/customers/[customerId]
**Purpose**: Soft delete customer (mark inactive)

**Test Cases**:
- ✅ Soft delete customer
  ```bash
  curl -X DELETE http://localhost:3000/api/customers/cust-123
  ```
  **Expected**: 200 OK

---

### 2.6 GET /api/customers/walk-in
**Purpose**: Get or create walk-in customer (system customer)

**Test Cases**:
- ✅ Get walk-in customer
  ```bash
  curl http://localhost:3000/api/customers/walk-in
  ```
  **Expected**: 200 OK, walk-in customer object

- **Business Rule Test**: Walk-in customer CANNOT have khata
  ```bash
  # Try to create khata for walk-in - should fail
  curl -X POST http://localhost:3000/api/khata \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": "<walk-in-id>",
      "description": "Walk-in khata"
    }'
  ```
  **Expected**: 400 Bad Request, "Walk-in customers cannot have khata accounts"

---

## Module 3: Orders API (6 endpoints)

### 3.1 GET /api/orders
**Purpose**: List all orders with filtering

**Test Cases**:
- ✅ List all orders
  ```bash
  curl http://localhost:3000/api/orders
  ```
  **Expected**: 200 OK, paginated orders

- ✅ Filter by status
  ```bash
  curl http://localhost:3000/api/orders?status=paid
  ```
  **Expected**: 200 OK, paid orders only

- ✅ Filter by customer
  ```bash
  curl http://localhost:3000/api/orders?customerId=cust-123
  ```
  **Expected**: 200 OK, customer's orders

---

### 3.2 POST /api/orders
**Purpose**: Create new order

**Test Cases**:
- ✅ Create fully paid order
  ```bash
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": "cust-123",
      "items": [
        {
          "product_id": "prod-1",
          "quantity": 2,
          "unit_price": 500,
          "discount_pct": 10
        }
      ],
      "amount_paid": 900,
      "payment_method": "cash",
      "notes": "Order for Ali"
    }'
  ```
  **Expected**: 201 Created, order with status "paid"

- ✅ Create partially paid order
  ```bash
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": "cust-123",
      "items": [
        {
          "product_id": "prod-1",
          "quantity": 2,
          "unit_price": 500,
          "discount_pct": 0
        }
      ],
      "amount_paid": 500,
      "payment_method": "cash"
    }'
  ```
  **Expected**: 201 Created, order with status "partial"

- **Business Rule Test**: Auto-create khata transaction for underpaid order
  ```bash
  # After creating partially paid order, khata_transactions should have entry
  curl http://localhost:3000/api/khata/[khataId]/transactions
  ```
  **Expected**: Transaction shows balance_due from order

- **Business Rule Test**: Khata auto-flag when balance_due > 0
  ```bash
  # Check khata account after creating underpaid order
  curl http://localhost:3000/api/khata/[khataId]
  ```
  **Expected**: is_khata_flagged = true if balance > 0

- ❌ Invalid item quantity
  ```bash
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": "cust-123",
      "items": [{"product_id": "prod-1", "quantity": -5, "unit_price": 500}],
      "amount_paid": 900
    }'
  ```
  **Expected**: 400 Bad Request

---

### 3.3 GET /api/orders/[orderId]
**Purpose**: Get single order with items

**Test Cases**:
- ✅ Get order with items
  ```bash
  curl http://localhost:3000/api/orders/order-123
  ```
  **Expected**: 200 OK, order with nested items and customer

---

### 3.4 PUT /api/orders/[orderId]
**Purpose**: Update order payment/status

**Test Cases**:
- ✅ Update amount paid (full payment)
  ```bash
  curl -X PUT http://localhost:3000/api/orders/order-123 \
    -H "Content-Type: application/json" \
    -d '{"amount_paid": 1000}'
  ```
  **Expected**: 200 OK, status auto-updated to "paid"

- ✅ Update payment method
  ```bash
  curl -X PUT http://localhost:3000/api/orders/order-123 \
    -H "Content-Type: application/json" \
    -d '{"payment_method": "card"}'
  ```
  **Expected**: 200 OK

---

### 3.5 POST /api/orders/[orderId]/refund
**Purpose**: Process refund

**Test Cases**:
- ✅ Full refund
  ```bash
  curl -X POST http://localhost:3000/api/orders/order-123/refund \
    -H "Content-Type: application/json" \
    -d '{
      "refund_amount": 900,
      "reason": "Customer request"
    }'
  ```
  **Expected**: 201 Created, order status "refunded"

- ✅ Partial refund
  ```bash
  curl -X POST http://localhost:3000/api/orders/order-123/refund \
    -H "Content-Type: application/json" \
    -d '{
      "refund_amount": 200,
      "reason": "Item defect"
    }'
  ```
  **Expected**: 200 OK, balance_due recalculated

- ❌ Refund exceeds amount paid
  ```bash
  curl -X POST http://localhost:3000/api/orders/order-123/refund \
    -H "Content-Type: application/json" \
    -d '{
      "refund_amount": 2000,
      "reason": "Invalid"
    }'
  ```
  **Expected**: 400 Bad Request

---

### 3.6 GET /api/orders/today
**Purpose**: Get today's orders with daily totals

**Test Cases**:
- ✅ Get today's orders
  ```bash
  curl http://localhost:3000/api/orders/today
  ```
  **Expected**: 200 OK, today's orders + totals

- ✅ Filter today by status
  ```bash
  curl http://localhost:3000/api/orders/today?status=paid
  ```
  **Expected**: 200 OK, today's paid orders

---

## Module 4: Khata API (6 endpoints)

### 4.1 GET /api/khata
**Purpose**: List all khata accounts

**Test Cases**:
- ✅ List all khata accounts
  ```bash
  curl http://localhost:3000/api/khata
  ```
  **Expected**: 200 OK, paginated khata accounts

- ✅ Search by customer name
  ```bash
  curl http://localhost:3000/api/khata?search=Ali
  ```
  **Expected**: 200 OK, filtered accounts

---

### 4.2 POST /api/khata
**Purpose**: Create new khata account

**Test Cases**:
- ✅ Create khata for customer
  ```bash
  curl -X POST http://localhost:3000/api/khata \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": "cust-123",
      "description": "Trade account for Ali"
    }'
  ```
  **Expected**: 201 Created

- **Business Rule Test**: Walk-in cannot have khata
  ```bash
  curl -X POST http://localhost:3000/api/khata \
    -H "Content-Type: application/json" \
    -d '{
      "customer_id": "<walk-in-id>",
      "description": "Walk-in khata"
    }'
  ```
  **Expected**: 400 Bad Request

---

### 4.3 GET /api/khata/[khataId]
**Purpose**: Get khata account with transactions

**Test Cases**:
- ✅ Get khata with transactions
  ```bash
  curl http://localhost:3000/api/khata/khata-123
  ```
  **Expected**: 200 OK, account + last 50 transactions + summary

---

### 4.4 POST /api/khata/[khataId]/transactions
**Purpose**: Add manual transaction

**Test Cases**:
- ✅ Add debit transaction
  ```bash
  curl -X POST http://localhost:3000/api/khata/khata-123/transactions \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 500,
      "transaction_type": "debit",
      "description": "Payment toward pending balance"
    }'
  ```
  **Expected**: 201 Created, balance updated

- ✅ Add credit transaction (return)
  ```bash
  curl -X POST http://localhost:3000/api/khata/khata-123/transactions \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 100,
      "transaction_type": "credit",
      "description": "Return item"
    }'
  ```
  **Expected**: 201 Created

---

### 4.5 GET /api/khata/[khataId]/statement
**Purpose**: Full khata statement for PDF/reports

**Test Cases**:
- ✅ Get complete statement
  ```bash
  curl http://localhost:3000/api/khata/khata-123/statement
  ```
  **Expected**: 200 OK, all transactions + account info

- ✅ Statement with date range
  ```bash
  curl "http://localhost:3000/api/khata/khata-123/statement?date_from=2024-01-01&date_to=2024-01-31"
  ```
  **Expected**: 200 OK, filtered transactions

---

### 4.6 GET /api/khata/customer/[customerId]
**Purpose**: Lookup customer's khata account

**Test Cases**:
- ✅ Get customer's khata
  ```bash
  curl http://localhost:3000/api/khata/customer/cust-123
  ```
  **Expected**: 200 OK, khata account if exists

- ✅ Customer without khata
  ```bash
  curl http://localhost:3000/api/khata/customer/new-customer-id
  ```
  **Expected**: 200 OK, { success: true, data: null, message: "No khata account..." }

---

## Module 5: Deals API (7 endpoints)

### 5.1 GET /api/deals
**Purpose**: List all active deals

**Test Cases**:
- ✅ List deals
  ```bash
  curl http://localhost:3000/api/deals
  ```
  **Expected**: 200 OK, paginated deals with items

---

### 5.2 POST /api/deals
**Purpose**: Create new deal

**Test Cases**:
- ✅ Create deal with items
  ```bash
  curl -X POST http://localhost:3000/api/deals \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Summer Laptop Deal",
      "description": "Buy 2 laptops, get 15% off",
      "deal_type": "bundle",
      "items": [
        {"product_id": "prod-1", "quantity": 2}
      ]
    }'
  ```
  **Expected**: 201 Created

---

### 5.3 GET /api/deals/[dealId]
**Purpose**: Get single deal

**Test Cases**:
- ✅ Get deal with items
  ```bash
  curl http://localhost:3000/api/deals/deal-123
  ```
  **Expected**: 200 OK

---

### 5.4 PUT /api/deals/[dealId]
**Purpose**: Update deal

**Test Cases**:
- ✅ Update deal name
  ```bash
  curl -X PUT http://localhost:3000/api/deals/deal-123 \
    -H "Content-Type: application/json" \
    -d '{"name": "Summer Laptop Super Deal"}'
  ```
  **Expected**: 200 OK

---

### 5.5 DELETE /api/deals/[dealId]
**Purpose**: Soft delete deal

**Test Cases**:
- ✅ Delete deal
  ```bash
  curl -X DELETE http://localhost:3000/api/deals/deal-123
  ```
  **Expected**: 200 OK

---

### 5.6 POST /api/deals/[dealId]/items
**Purpose**: Add items to deal

**Test Cases**:
- ✅ Add items
  ```bash
  curl -X POST http://localhost:3000/api/deals/deal-123/items \
    -H "Content-Type: application/json" \
    -d '{
      "items": [
        {"product_id": "prod-2", "quantity": 1}
      ]
    }'
  ```
  **Expected**: 201 Created

---

### 5.7 DELETE /api/deals/[dealId]/items
**Purpose**: Remove items from deal

**Test Cases**:
- ✅ Remove items
  ```bash
  curl -X DELETE http://localhost:3000/api/deals/deal-123/items \
    -H "Content-Type: application/json" \
    -d '{"item_ids": ["item-1", "item-2"]}'
  ```
  **Expected**: 200 OK

---

## Module 6: Reports API (5 endpoints)

### 6.1 GET /api/reports/dashboard
**Purpose**: Dashboard metrics

**Test Cases**:
- ✅ Get dashboard data
  ```bash
  curl http://localhost:3000/api/reports/dashboard
  ```
  **Expected**: 200 OK, { revenue, orders, customers, products, pending_orders, etc. }

---

### 6.2 GET /api/reports/profit
**Purpose**: Profit report

**Test Cases**:
- ✅ Get profit data
  ```bash
  curl http://localhost:3000/api/reports/profit?period=monthly
  ```
  **Expected**: 200 OK, profit breakdown

---

### 6.3 GET /api/reports/top-products
**Purpose**: Top selling products

**Test Cases**:
- ✅ Get top products
  ```bash
  curl http://localhost:3000/api/reports/top-products?limit=10
  ```
  **Expected**: 200 OK, top 10 products by sales

---

### 6.4 GET /api/reports/cash-flow
**Purpose**: Cash flow analysis

**Test Cases**:
- ✅ Get cash flow
  ```bash
  curl http://localhost:3000/api/reports/cash-flow
  ```
  **Expected**: 200 OK, daily/weekly/monthly cash flow

---

### 6.5 GET /api/reports/khata-stats
**Purpose**: Khata statistics

**Test Cases**:
- ✅ Get khata stats
  ```bash
  curl http://localhost:3000/api/reports/khata-stats
  ```
  **Expected**: 200 OK, { total_due, accounts_active, pending_transactions, etc. }

---

## Module 7: Admin API (3 endpoints)

### 7.1 GET /api/admin/orders/total
**Purpose**: Total orders count

**Test Cases**:
- ✅ Get total orders
  ```bash
  curl http://localhost:3000/api/admin/orders/total
  ```
  **Expected**: 200 OK, { count: number }

---

### 7.2 GET /api/admin/products/total
**Purpose**: Total products count

**Test Cases**:
- ✅ Get total products
  ```bash
  curl http://localhost:3000/api/admin/products/total
  ```
  **Expected**: 200 OK, { count: number }

---

### 7.3 GET /api/admin/shops/total
**Purpose**: Total shops count

**Test Cases**:
- ✅ Get total shops
  ```bash
  curl http://localhost:3000/api/admin/shops/total
  ```
  **Expected**: 200 OK, { count: number }

---

## Database Triggers & Business Rules Testing

### Business Rule 1: Khata Auto-Flagging
**Rule**: When an order is underpaid (balance_due > 0), khata should be auto-flagged

**Test**:
1. Create order with balance_due > 0
2. Check khata_accounts.is_khata_flagged = true
3. Create another order with full payment
4. Verify khata_flagged status is appropriate

### Business Rule 2: Walk-in Khata Protection
**Rule**: Walk-in customers cannot have khata accounts

**Test**:
1. Get walk-in customer
2. Try to create khata for walk-in
3. Should get 400 Bad Request

### Business Rule 3: Discount Range Validation
**Rule**: min_discount ≤ max_discount ≤ 100

**Test**:
1. Try to create product with min > max
2. Try to create product with max > 100
3. All should fail

### Business Rule 4: Balance Calculation
**Rule**: balance_due = total_amount - amount_paid

**Test**:
1. Create order with total 1000, paid 600
2. Verify balance_due = 400
3. Update amount_paid to 800
4. Verify balance_due = 200

### Business Rule 5: Soft Delete
**Rule**: Products/Customers marked inactive, not deleted

**Test**:
1. Delete product
2. Query products - should not appear
3. Query directly with raw SQL - should still exist with is_active = false

---

## End-to-End Scenario Testing

### Scenario 1: Complete Customer Order Flow
1. Create customer
2. Create khata for customer
3. Create order (partially paid)
4. Verify khata transaction created
5. Add manual transaction to khata
6. Get khata statement
7. Update order payment
8. Verify khata balance updated

### Scenario 2: Refund and Credit
1. Create order
2. Process partial refund
3. Verify balance_due recalculated
4. Verify order status updated

### Scenario 3: Bulk Import and Reporting
1. Import products via CSV
2. Create multiple orders
3. Run reports (dashboard, top products, cash flow)
4. Verify calculations correct

---

## Test Execution Checklist

- [ ] Database migration applied to Supabase
- [ ] All environment variables configured
- [ ] Dev server running (npm run dev)
- [ ] All Products API tests pass
- [ ] All Customers API tests pass
- [ ] All Orders API tests pass
- [ ] All Khata API tests pass
- [ ] All Deals API tests pass
- [ ] All Reports API tests pass
- [ ] All Admin API tests pass
- [ ] All Business Rules verified
- [ ] All End-to-End scenarios work
- [ ] Error handling works as expected
- [ ] Pagination works correctly
- [ ] Search and filtering work
- [ ] Soft deletes verified

---

## Notes

- All timestamps should be ISO 8601 format
- All IDs are UUIDs
- All monetary values are in currency units (no decimals for cents)
- Pagination: default page=1, pageSize=10, max pageSize=100
- All authenticated endpoints require valid JWT token in Authorization header
- Database should be fully migrated before testing
