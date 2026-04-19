/**
 * POS System - Complete API Reference Documentation
 * ====================================================
 * 
 * This file documents all production-ready API endpoints for the POS system.
 * All endpoints require authentication (Supabase session).
 * 
 * BASE URL: /api
 * 
 * ====================================================
 * 1. PRODUCTS API
 * ====================================================
 */

/**
 * GET /products
 * List all products with pagination and search
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - pageSize: number (default: 10, max: 100)
 *   - search: string - searches name, description, item_code
 *   - sortBy: string (default: created_at)
 *   - sortOrder: 'asc' | 'desc' (default: desc)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [ Product[] ],
 *     "pagination": {
 *       "total": number,
 *       "page": number,
 *       "pageSize": number,
 *       "totalPages": number,
 *       "hasMore": boolean
 *     }
 *   }
 */

/**
 * POST /products
 * Create new product
 * 
 * Body:
 *   {
 *     "name": string (required),
 *     "description": string (optional),
 *     "image_url": string (optional),
 *     "purchase_price": number (required),
 *     "sale_price": number (required),
 *     "quantity": number (required),
 *     "unit": 'piece' | 'dozen' | 'kg' | 'packet' | 'litre' | 'meter' (default: piece),
 *     "item_code": string (optional),
 *     "min_discount": number (default: 0),
 *     "max_discount": number (default: 0)
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "data": Product
 *   }
 */

/**
 * GET /products/[productId]
 * Get single product with variants
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "id": string,
 *       "name": string,
 *       ...productFields,
 *       "variants": ProductVariant[]
 *     }
 *   }
 */

/**
 * PUT /products/[productId]
 * Update product
 * 
 * Body: Partial ProductUpdateInput (any fields to update)
 * Response:
 *   {
 *     "success": true,
 *     "data": Product
 *   }
 */

/**
 * DELETE /products/[productId]
 * Soft delete product (set is_active to false)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "Product deleted successfully",
 *     "data": Product
 *   }
 */

/**
 * POST /products/variants
 * Create product variant
 * 
 * Body:
 *   {
 *     "product_id": string (required),
 *     "variant_name": string (required),
 *     "item_code": string (required),
 *     "purchase_price": number (optional),
 *     "sale_price": number (optional),
 *     "quantity": number (required),
 *     "min_discount": number (default: 0),
 *     "max_discount": number (default: 0)
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "data": ProductVariant
 *   }
 */

/**
 * PUT /products/[productId]/variants/[variantId]
 * Update product variant
 * 
 * Body: Partial ProductVariantUpdateInput
 * Response:
 *   {
 *     "success": true,
 *     "data": ProductVariant
 *   }
 */

/**
 * DELETE /products/[productId]/variants/[variantId]
 * Soft delete product variant
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "Product variant deleted successfully",
 *     "data": ProductVariant
 *   }
 */

/**
 * POST /products/import
 * Import products from CSV file
 * 
 * Form Data:
 *   - file: File (CSV format)
 * 
 * CSV Headers Required:
 *   - name
 *   - purchase_price
 *   - sale_price
 *   - quantity
 * 
 * CSV Headers Optional:
 *   - description
 *   - unit
 *   - item_code
 *   - min_discount
 *   - max_discount
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "Import completed: X products imported, Y failed",
 *     "result": {
 *       "total": number,
 *       "imported": number,
 *       "failed": number,
 *       "errors": Array<{row: number, error: string}>
 *     }
 *   }
 */

/**
 * GET /products/by-code/[itemCode]
 * Lookup product by barcode/item code
 * 
 * Response:
 *   {
 *     "success": true,
 *     "type": "product" | "variant",
 *     "data": Product | ProductVariant
 *   }
 */

/**
 * ====================================================
 * 2. CUSTOMERS API
 * ====================================================
 */

/**
 * GET /customers
 * List all retail customers
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - pageSize: number (default: 10, max: 100)
 *   - search: string - searches name, phone
 *   - sortBy: string (default: created_at)
 *   - sortOrder: 'asc' | 'desc' (default: desc)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [ Customer[] ],
 *     "pagination": {...}
 *   }
 */

/**
 * POST /customers
 * Create new retail customer
 * 
 * Body:
 *   {
 *     "name": string (required),
 *     "phone": string (optional),
 *     "address": string (optional)
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "data": Customer
 *   }
 */

/**
 * GET /customers/[customerId]
 * Get single customer
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": Customer
 *   }
 */

/**
 * PUT /customers/[customerId]
 * Update customer
 * 
 * Body: Partial CustomerUpdateInput
 * Response:
 *   {
 *     "success": true,
 *     "data": Customer
 *   }
 */

/**
 * DELETE /customers/[customerId]
 * Soft delete customer
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "Customer deleted successfully",
 *     "data": Customer
 *   }
 */

/**
 * GET /customers/walk-in
 * Get or create system walk-in customer
 * 
 * Response: (201 if created, 200 if exists)
 *   {
 *     "success": true,
 *     "data": Customer,
 *     "created": boolean,
 *     "message": string (if created)
 *   }
 */

/**
 * ====================================================
 * 3. DEALS API
 * ====================================================
 */

/**
 * GET /deals
 * List all active deals
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - pageSize: number (default: 10, max: 100)
 *   - search: string - searches name, description
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [ Deal[] ],
 *     "pagination": {...}
 *   }
 */

/**
 * POST /deals
 * Create new deal with items
 * 
 * Body:
 *   {
 *     "name": string (required),
 *     "description": string (optional),
 *     "items": [
 *       {
 *         "product_id": string (optional),
 *         "product_variant_id": string (optional),
 *         "quantity": number (required)
 *       }
 *     ]
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "data": Deal (with items populated)
 *   }
 */

/**
 * GET /deals/[dealId]
 * Get single deal with items
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": Deal (with items, products, variants)
 *   }
 */

/**
 * PUT /deals/[dealId]
 * Update deal
 * 
 * Body: Partial DealUpdateInput
 * Response:
 *   {
 *     "success": true,
 *     "data": Deal
 *   }
 */

/**
 * DELETE /deals/[dealId]
 * Soft delete deal
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "Deal deleted successfully",
 *     "data": Deal
 *   }
 */

/**
 * POST /deals/[dealId]/items
 * Add items to deal
 * 
 * Body:
 *   {
 *     "items": [
 *       {
 *         "product_id": string (optional),
 *         "product_variant_id": string (optional),
 *         "quantity": number (required)
 *       }
 *     ]
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "message": "Items added to deal",
 *     "data": DealItem[]
 *   }
 */

/**
 * DELETE /deals/[dealId]/items
 * Remove items from deal
 * 
 * Body:
 *   {
 *     "item_ids": [ string[] ]
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "X item(s) removed from deal"
 *   }
 */

/**
 * ====================================================
 * 4. ORDERS API
 * ====================================================
 */

/**
 * GET /orders
 * List orders with filters and pagination
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - pageSize: number (default: 10, max: 100)
 *   - status: 'pending' | 'paid' | 'partial' | 'refunded' (optional)
 *   - customer_id: string (optional)
 *   - date_from: ISO date string (optional)
 *   - date_to: ISO date string (optional)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [ Order[] ],
 *     "pagination": {...}
 *   }
 */

/**
 * POST /orders
 * Create new order
 * 
 * Body:
 *   {
 *     "customer_id": string (optional),
 *     "items": [
 *       {
 *         "product_id": string (optional),
 *         "product_variant_id": string (optional),
 *         "quantity": number (required),
 *         "unit_price": number (required),
 *         "discount_pct": number (default: 0, 0-100)
 *       }
 *     ],
 *     "amount_paid": number (required),
 *     "payment_method": 'cash' | 'card' | 'bank_transfer' | 'khata' (required),
 *     "notes": string (optional)
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "data": Order (with items, customer)
 *   }
 */

/**
 * GET /orders/[orderId]
 * Get single order with items
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": Order
 *   }
 */

/**
 * PUT /orders/[orderId]
 * Update order payment info
 * 
 * Body: Partial OrderUpdateInput
 *   {
 *     "amount_paid": number (optional),
 *     "status": 'pending' | 'paid' | 'partial' | 'refunded' (optional),
 *     "payment_method": string (optional),
 *     "notes": string (optional),
 *     "is_khata": boolean (optional)
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": Order
 *   }
 */

/**
 * POST /orders/[orderId]/refund
 * Process refund for order
 * 
 * Body:
 *   {
 *     "refund_amount": number (required),
 *     "reason": string (required)
 *   }
 * 
 * Response:
 *   {
 *     "success": true,
 *     "message": "Refund of X processed",
 *     "data": {
 *       "order": Order,
 *       "refund": {
 *         "amount": number,
 *         "reason": string,
 *         "refund_date": ISO datetime
 *       }
 *     }
 *   }
 */

/**
 * GET /orders/today
 * Get today's orders with summary
 * 
 * Query Parameters:
 *   - status: 'pending' | 'paid' | 'partial' | 'refunded' (optional)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": Order[],
 *     "totals": {
 *       "total_revenue": number,
 *       "total_discount": number,
 *       "total_paid": number,
 *       "order_count": number,
 *       "paid_orders": number,
 *       "pending_orders": number,
 *       "partial_orders": number
 *     },
 *     "date": string
 *   }
 */

/**
 * POST /orders/[orderId]/items
 * Add items to existing order
 * 
 * Body:
 *   {
 *     "items": [ OrderItemInput[] ]
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "message": "X item(s) added to order",
 *     "data": Order (updated with new items)
 *   }
 */

/**
 * ====================================================
 * 5. KHATA API (Credit Ledger)
 * ====================================================
 */

/**
 * GET /khata
 * List all khata accounts
 * 
 * Query Parameters:
 *   - page: number (default: 1)
 *   - pageSize: number (default: 10, max: 100)
 *   - search: string (searches customer name)
 *   - sortBy: string (default: updated_at)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [ KhataAccount[] ],
 *     "pagination": {...}
 *   }
 */

/**
 * POST /khata
 * Create new khata account
 * 
 * Body:
 *   {
 *     "customer_id": string (required),
 *     "opening_balance": number (default: 0, optional)
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "data": KhataAccount
 *   }
 */

/**
 * GET /khata/[khataId]
 * Get khata account with transactions
 * 
 * Query Parameters:
 *   - limit: number (default: 50, max: 1000)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "id": string,
 *       "customer_id": string,
 *       "customer": Customer,
 *       "opening_balance": number,
 *       "current_balance": number,
 *       "transactions": KhataTransaction[],
 *       ...
 *     },
 *     "summary": {
 *       "total_debits": number,
 *       "total_credits": number,
 *       "transaction_count": number
 *     }
 *   }
 */

/**
 * POST /khata/[khataId]/transactions
 * Add transaction to khata account
 * 
 * Body:
 *   {
 *     "amount": number (required),
 *     "transaction_type": 'debit' | 'credit' (required),
 *     "description": string (required),
 *     "order_id": string (optional)
 *   }
 * 
 * Response: (201 Created)
 *   {
 *     "success": true,
 *     "message": "Transaction added successfully",
 *     "data": {
 *       "transaction": KhataTransaction,
 *       "account": KhataAccount (updated)
 *     }
 *   }
 */

/**
 * GET /khata/[khataId]/statement
 * Get complete khata statement for PDF/reports
 * 
 * Query Parameters:
 *   - date_from: ISO date string (optional)
 *   - date_to: ISO date string (optional)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "customer": Customer,
 *       "account": KhataAccount,
 *       "period": {
 *         "from": string,
 *         "to": string
 *       },
 *       "transactions": KhataTransaction[],
 *       "summary": {
 *         "opening_balance": number,
 *         "total_debits": number,
 *         "total_credits": number,
 *         "current_balance": number,
 *         "transaction_count": number
 *       },
 *       "generated_at": ISO datetime
 *     }
 *   }
 */

/**
 * GET /khata/customer/[customerId]
 * Get customer's khata account if exists
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": KhataAccount | null,
 *     "recent_transactions": KhataTransaction[],
 *     "exists": boolean,
 *     "message": string (if no account)
 *   }
 */

/**
 * ====================================================
 * 6. REPORTS API
 * ====================================================
 */

/**
 * GET /reports/dashboard
 * Get today's key metrics
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "today_revenue": number,
 *       "today_orders": number,
 *       "today_paid_orders": number,
 *       "today_total_paid": number,
 *       "total_khata_outstanding": number,
 *       "active_products": number,
 *       "active_customers": number,
 *       "date": string,
 *       "generated_at": ISO datetime
 *     }
 *   }
 */

/**
 * GET /reports/profit
 * Get profit summary by date range
 * 
 * Query Parameters:
 *   - date_from: ISO date string (required)
 *   - date_to: ISO date string (required)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "date_range": {
 *         "start": string,
 *         "end": string
 *       },
 *       "total_revenue": number,
 *       "total_discount": number,
 *       "total_expenses": number,
 *       "total_paid": number,
 *       "net_profit": number,
 *       "profit_margin": number,
 *       "order_count": number,
 *       "paid_orders": number,
 *       "pending_orders": number
 *     }
 *   }
 */

/**
 * GET /reports/top-products
 * Get best-selling products
 * 
 * Query Parameters:
 *   - limit: number (default: 10, max: 100)
 *   - date_from: ISO date string (optional)
 *   - date_to: ISO date string (optional)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [
 *       {
 *         "rank": number,
 *         "product_id": string,
 *         "product_name": string,
 *         "item_code": string | null,
 *         "units_sold": number,
 *         "revenue": number
 *       }
 *     ],
 *     "count": number,
 *     "period": {...}
 *   }
 */

/**
 * GET /reports/cash-flow
 * Get daily cash flow summary
 * 
 * Query Parameters:
 *   - date_from: ISO date string (required)
 *   - date_to: ISO date string (required)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [
 *       {
 *         "date": string,
 *         "cash_in": number,
 *         "cash_out": number,
 *         "expenses": number,
 *         "net": number,
 *         "order_count": number
 *       }
 *     ],
 *     "totals": {
 *       "total_cash_in": number,
 *       "total_cash_out": number,
 *       "total_expenses": number,
 *       "net_cash": number,
 *       "day_count": number
 *     },
 *     "period": {...}
 *   }
 */

/**
 * GET /reports/khata-stats
 * Get khata statistics and outstanding breakdown
 * 
 * Query Parameters:
 *   - outstanding_only: boolean (default: true)
 *   - limit: number (default: 50, max: 500)
 * 
 * Response:
 *   {
 *     "success": true,
 *     "data": [
 *       {
 *         "customer_id": string,
 *         "customer_name": string,
 *         "phone": string | null,
 *         "total_outstanding": number,
 *         "transaction_count": number,
 *         "oldest_transaction": ISO datetime,
 *         "recent_activity": number,
 *         "account_id": string
 *       }
 *     ],
 *     "summary": {
 *       "total_outstanding": number,
 *       "account_count": number,
 *       "average_balance": number,
 *       "largest_debt": number
 *     },
 *     "generated_at": ISO datetime
 *   }
 */

/**
 * ====================================================
 * ERROR RESPONSES
 * ====================================================
 * 
 * All endpoints return error responses in this format:
 * 
 * {
 *   "error": "Error message describing what went wrong",
 *   "status": number (HTTP status code)
 * }
 * 
 * Common HTTP Status Codes:
 *   - 200: OK - Successful GET, PUT, DELETE
 *   - 201: Created - Successful POST
 *   - 207: Multi-Status - Partial success (e.g., CSV import with some failures)
 *   - 400: Bad Request - Invalid input/parameters
 *   - 401: Unauthorized - Missing/invalid authentication
 *   - 404: Not Found - Resource not found
 *   - 409: Conflict - Resource already exists
 *   - 500: Internal Server Error - Server-side error
 */

/**
 * ====================================================
 * AUTHENTICATION
 * ====================================================
 * 
 * All endpoints require authentication via Supabase.
 * Include your session cookie in requests.
 * 
 * The API automatically validates:
 * - User authentication status
 * - Session validity
 * 
 * If not authenticated, all endpoints return 401 Unauthorized.
 */

/**
 * ====================================================
 * USAGE EXAMPLES
 * ====================================================
 */

// Example: Create a product
// POST /api/products
// {
//   "name": "Wheat Flour 5kg",
//   "description": "Premium quality wheat flour",
//   "purchase_price": 150,
//   "sale_price": 200,
//   "quantity": 50,
//   "unit": "packet",
//   "item_code": "WF001",
//   "min_discount": 0,
//   "max_discount": 10
// }

// Example: Create an order
// POST /api/orders
// {
//   "customer_id": "cust_123",
//   "items": [
//     {
//       "product_id": "prod_1",
//       "quantity": 2,
//       "unit_price": 200,
//       "discount_pct": 5
//     }
//   ],
//   "amount_paid": 760,
//   "payment_method": "cash",
//   "notes": "Regular order"
// }

// Example: Fetch today's sales
// GET /api/orders/today?status=paid

// Example: Get dashboard metrics
// GET /api/reports/dashboard

// Example: Get profit report for a date range
// GET /api/reports/profit?date_from=2024-01-01&date_to=2024-01-31

export {}; // This file is for documentation only
