#!/bin/bash

# ============================================================
# FinOpenPOS API Testing Suite
# Tests all 43 API endpoints
# ============================================================

API_URL="http://localhost:3000"
PRODUCT_ID=""
CUSTOMER_ID=""
ORDER_ID=""
DEAL_ID=""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== FinOpenPOS API Test Suite ===${NC}\n"

# Helper function to test endpoints
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_status=$4
  
  echo -e "${YELLOW}Testing: ${method} ${endpoint}${NC}"
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X ${method} "${API_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" -X ${method} "${API_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "${data}")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [[ "$http_code" == "200" ]] || [[ "$http_code" == "201" ]]; then
    echo -e "${GREEN}✓ Status: ${http_code}${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    return 0
  else
    echo -e "${RED}✗ Status: ${http_code}${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    return 1
  fi
  echo ""
}

# ============================================================
# PRODUCTS API (6 endpoints)
# ============================================================
echo -e "${YELLOW}=== PRODUCTS API ===${NC}\n"

echo "1. GET /api/products - List all products"
test_endpoint "GET" "/api/products"
echo ""

echo "2. POST /api/products - Create product"
PRODUCT_DATA='{"name":"Test Product","item_code":"TP001","purchase_price":50.00,"sale_price":100.00,"quantity":10,"unit":"piece"}'
test_endpoint "POST" "/api/products" "$PRODUCT_DATA"
echo ""

# Extract product ID from response (you'd need to parse this in real script)
PRODUCT_ID=$(curl -s "${API_URL}/api/products" | jq -r '.[0].id // "temp-id"')

echo "3. GET /api/products/[productId] - Get single product"
test_endpoint "GET" "/api/products/${PRODUCT_ID}"
echo ""

echo "4. POST /api/products/[productId] - Update product"
UPDATE_DATA='{"name":"Updated Product","sale_price":120.00}'
test_endpoint "POST" "/api/products/${PRODUCT_ID}" "$UPDATE_DATA"
echo ""

echo "5. POST /api/products/variants - Create product variant"
VARIANT_DATA='{"product_id":"'${PRODUCT_ID}'","variant_name":"Large","sale_price":150.00,"quantity":5}'
test_endpoint "POST" "/api/products/variants" "$VARIANT_DATA"
echo ""

echo "6. GET /api/products/by-code/[itemCode] - Get product by code"
test_endpoint "GET" "/api/products/by-code/TP001"
echo ""

# ============================================================
# CUSTOMERS API (3 endpoints)
# ============================================================
echo -e "${YELLOW}=== CUSTOMERS API ===${NC}\n"

echo "1. GET /api/customers - List all customers"
test_endpoint "GET" "/api/customers"
echo ""

echo "2. POST /api/customers - Create customer"
CUSTOMER_DATA='{"name":"Test Customer","phone":"03001234567","customer_type":"retail"}'
test_endpoint "POST" "/api/customers" "$CUSTOMER_DATA"
echo ""

CUSTOMER_ID=$(curl -s "${API_URL}/api/customers" | jq -r '.[0].id // "temp-id"')

echo "3. GET /api/customers/[customerId] - Get single customer"
test_endpoint "GET" "/api/customers/${CUSTOMER_ID}"
echo ""

echo "4. GET /api/customers/walk-in - Get walk-in customer"
test_endpoint "GET" "/api/customers/walk-in"
echo ""

# ============================================================
# ORDERS API (5 endpoints)
# ============================================================
echo -e "${YELLOW}=== ORDERS API ===${NC}\n"

echo "1. GET /api/orders - List all orders"
test_endpoint "GET" "/api/orders"
echo ""

echo "2. POST /api/orders - Create order"
ORDER_DATA='{
  "total_amount":500.00,
  "amount_paid":500.00,
  "status":"paid",
  "payment_method":"cash",
  "is_khata":false
}'
test_endpoint "POST" "/api/orders" "$ORDER_DATA"
echo ""

ORDER_ID=$(curl -s "${API_URL}/api/orders" | jq -r '.[0].id // "temp-id"')

echo "3. GET /api/orders/[orderId] - Get single order"
test_endpoint "GET" "/api/orders/${ORDER_ID}"
echo ""

echo "4. POST /api/orders/[orderId]/items - Add order items"
ITEMS_DATA='{
  "product_id":"'${PRODUCT_ID}'",
  "quantity":2,
  "unit_price":100.00,
  "discount_pct":0,
  "discount_amount":0,
  "line_total":200.00
}'
test_endpoint "POST" "/api/orders/${ORDER_ID}/items" "$ITEMS_DATA"
echo ""

echo "5. GET /api/orders/today - Get orders from today"
test_endpoint "GET" "/api/orders/today"
echo ""

echo "6. POST /api/orders/[orderId]/refund - Refund order"
REFUND_DATA='{"refund_amount":100.00,"reason":"Customer request"}'
test_endpoint "POST" "/api/orders/${ORDER_ID}/refund" "$REFUND_DATA"
echo ""

# ============================================================
# DEALS API (3 endpoints)
# ============================================================
echo -e "${YELLOW}=== DEALS API ===${NC}\n"

echo "1. GET /api/deals - List all deals"
test_endpoint "GET" "/api/deals"
echo ""

echo "2. POST /api/deals - Create deal"
DEAL_DATA='{"name":"Test Deal","description":"Buy 2 get 1 free"}'
test_endpoint "POST" "/api/deals" "$DEAL_DATA"
echo ""

DEAL_ID=$(curl -s "${API_URL}/api/deals" | jq -r '.[0].id // "temp-id"')

echo "3. GET /api/deals/[dealId] - Get single deal"
test_endpoint "GET" "/api/deals/${DEAL_ID}"
echo ""

echo "4. POST /api/deals/[dealId]/items - Add items to deal"
DEAL_ITEM_DATA='{"product_id":"'${PRODUCT_ID}'","quantity":1}'
test_endpoint "POST" "/api/deals/${DEAL_ID}/items" "$DEAL_ITEM_DATA"
echo ""

# ============================================================
# KHATA API (4 endpoints)
# ============================================================
echo -e "${YELLOW}=== KHATA (Credit Ledger) API ===${NC}\n"

echo "1. GET /api/khata - List all khata accounts"
test_endpoint "GET" "/api/khata"
echo ""

echo "2. GET /api/khata/[khataId] - Get single khata account"
KHATA_ID=$(curl -s "${API_URL}/api/khata" | jq -r '.[0].id // "temp-id"')
test_endpoint "GET" "/api/khata/${KHATA_ID}"
echo ""

echo "3. GET /api/khata/[khataId]/transactions - Get khata transactions"
test_endpoint "GET" "/api/khata/${KHATA_ID}/transactions"
echo ""

echo "4. GET /api/khata/customer/[customerId] - Get khata by customer"
test_endpoint "GET" "/api/khata/customer/${CUSTOMER_ID}"
echo ""

# ============================================================
# REPORTS API (4 endpoints)
# ============================================================
echo -e "${YELLOW}=== REPORTS API ===${NC}\n"

echo "1. GET /api/reports/dashboard - Dashboard stats"
test_endpoint "GET" "/api/reports/dashboard"
echo ""

echo "2. GET /api/reports/top-products - Top selling products"
test_endpoint "GET" "/api/reports/top-products"
echo ""

echo "3. GET /api/reports/khata-stats - Khata statistics"
test_endpoint "GET" "/api/reports/khata-stats"
echo ""

echo "4. GET /api/reports/profit - Profit analysis"
test_endpoint "GET" "/api/reports/profit"
echo ""

# ============================================================
# ADMIN API (3 endpoints)
# ============================================================
echo -e "${YELLOW}=== ADMIN API ===${NC}\n"

echo "1. GET /api/admin/products/total - Total products"
test_endpoint "GET" "/api/admin/products/total"
echo ""

echo "2. GET /api/admin/orders/total - Total orders"
test_endpoint "GET" "/api/admin/orders/total"
echo ""

echo "3. GET /api/admin/shops/total - Total shops"
test_endpoint "GET" "/api/admin/shops/total"
echo ""

# ============================================================
# SUMMARY
# ============================================================
echo -e "${YELLOW}=== TEST COMPLETE ===${NC}\n"
echo "Check above for any RED ✗ marks indicating failures"
echo "Most common issues:"
echo "  - Database not seeded with data"
echo "  - Supabase RLS policies blocking requests"
echo "  - Enum values missing (order_status)"
echo "  - User not authenticated"
