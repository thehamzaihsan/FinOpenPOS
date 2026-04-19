#!/usr/bin/env node

/**
 * FinOpenPOS API Testing Suite (Node.js)
 * Tests all 43 API endpoints
 * 
 * Usage: node test-api.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

/**
 * Test an API endpoint
 */
async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    console.log(`\n${colors.yellow}Testing: ${method} ${endpoint}${colors.reset}`);
    
    const response = await fetch(url, options);
    const body = await response.text();
    const jsonBody = body ? JSON.parse(body) : null;
    
    if (response.status === expectedStatus || response.status === 200 || response.status === 201) {
      console.log(`${colors.green}✓ Status: ${response.status}${colors.reset}`);
      if (jsonBody) {
        console.log(JSON.stringify(jsonBody, null, 2).substring(0, 200) + '...');
      }
      testsPassed++;
      return jsonBody;
    } else {
      console.log(`${colors.red}✗ Status: ${response.status}${colors.reset}`);
      console.log(JSON.stringify(jsonBody, null, 2));
      testsFailed++;
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    testsFailed++;
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.yellow}=== FinOpenPOS API Test Suite ===${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  let productId = null;
  let customerId = null;
  let orderId = null;
  let dealId = null;

  // ============================================================
  // PRODUCTS API
  // ============================================================
  console.log(`${colors.yellow}\n=== PRODUCTS API ===${colors.reset}`);
  
  let productsRes = await testEndpoint('GET', '/api/products');
  let products = productsRes?.data || [];
  if (products.length > 0) {
    productId = products[0].id;
  }

  const newProduct = {
    name: 'Test Product',
    item_code: 'TP001',
    purchase_price: 50.00,
    sale_price: 100.00,
    quantity: 10,
    unit: 'piece',
    min_discount: 0,
    max_discount: 10
  };
  let created = await testEndpoint('POST', '/api/products', newProduct);
  if (created?.id) {
    productId = created.id;
  }

  if (productId) {
    await testEndpoint('GET', `/api/products/${productId}`);
    await testEndpoint('POST', `/api/products/${productId}`, { sale_price: 120.00 });
  }

  await testEndpoint('GET', '/api/products/by-code/TP001');

  const variant = {
    product_id: productId,
    variant_name: 'Large',
    sale_price: 150.00,
    quantity: 5
  };
  await testEndpoint('POST', '/api/products/variants', variant);

  // ============================================================
  // CUSTOMERS API
  // ============================================================
  console.log(`${colors.yellow}\n=== CUSTOMERS API ===${colors.reset}`);
  
  let customersRes = await testEndpoint('GET', '/api/customers');
  let customers = customersRes?.data || [];
  if (customers.length > 0) {
    customerId = customers[0].id;
  }

  const newCustomer = {
    name: 'Test Customer',
    phone: '03001234567',
    customer_type: 'retail'
  };
  let createdCustomer = await testEndpoint('POST', '/api/customers', newCustomer);
  if (createdCustomer?.id) {
    customerId = createdCustomer.id;
  }

  if (customerId) {
    await testEndpoint('GET', `/api/customers/${customerId}`);
  }

  await testEndpoint('GET', '/api/customers/walk-in');

  // ============================================================
  // ORDERS API
  // ============================================================
  console.log(`${colors.yellow}\n=== ORDERS API ===${colors.reset}`);
  
  let orders = await testEndpoint('GET', '/api/orders');
  if (orders?.data?.length > 0) {
    orderId = orders.data[0].id;
  }

  // Test Walk-in Order (no customer_id)
  const walkInOrder = {
    total_amount: 500.00,
    amount_paid: 500.00,
    status: 'paid',
    payment_method: 'cash',
    is_khata: false,
    subtotal: 500.00,
    discount_total: 0
  };
  console.log(`\n${colors.yellow}Testing: POST /api/orders (Walk-in)${colors.reset}`);
  let createdWalkInOrder = await testEndpoint('POST', '/api/orders', walkInOrder);
  if (createdWalkInOrder?.data?.id) {
    orderId = createdWalkInOrder.data.id;
  }

  // Test Retail Order (with customer_id)
  if (customerId) {
    const retailOrder = {
      customer_id: customerId,
      total_amount: 250.00,
      amount_paid: 100.00,  // Partial payment
      status: 'partial',
      payment_method: 'cash',
      is_khata: true,
      subtotal: 250.00,
      discount_total: 0
    };
    console.log(`\n${colors.yellow}Testing: POST /api/orders (Retail with credit)${colors.reset}`);
    let createdRetailOrder = await testEndpoint('POST', '/api/orders', retailOrder);
    if (createdRetailOrder?.data?.id) {
      orderId = createdRetailOrder.data.id;
    }
  }

  if (orderId) {
    await testEndpoint('GET', `/api/orders/${orderId}`);
  }

  await testEndpoint('GET', '/api/orders/today');

  // ============================================================
  // DEALS API
  // ============================================================
  console.log(`${colors.yellow}\n=== DEALS API ===${colors.reset}`);
  
  let dealsRes = await testEndpoint('GET', '/api/deals');
  let deals = dealsRes?.data || [];
  if (deals.length > 0) {
    dealId = deals[0].id;
  }

  const newDeal = {
    name: 'Test Deal',
    description: 'Buy 2 get 1 free'
  };
  let createdDeal = await testEndpoint('POST', '/api/deals', newDeal);
  if (createdDeal?.id) {
    dealId = createdDeal.id;
  }

  if (dealId) {
    await testEndpoint('GET', `/api/deals/${dealId}`);

    if (productId) {
      const dealItem = {
        product_id: productId,
        quantity: 1
      };
      await testEndpoint('POST', `/api/deals/${dealId}/items`, dealItem);
    }
  }

  // ============================================================
  // KHATA API
  // ============================================================
  console.log(`${colors.yellow}\n=== KHATA (Credit Ledger) API ===${colors.reset}`);
  
  let khatasRes = await testEndpoint('GET', '/api/khata');
  let khatas = khatasRes?.data || [];
  let khataId = khatas[0]?.id;

  if (khataId) {
    await testEndpoint('GET', `/api/khata/${khataId}`);
    await testEndpoint('GET', `/api/khata/${khataId}/transactions`);
    await testEndpoint('GET', `/api/khata/${khataId}/statement`);
  }

  if (customerId) {
    await testEndpoint('GET', `/api/khata/customer/${customerId}`);
  }

  // ============================================================
  // REPORTS API
  // ============================================================
  console.log(`${colors.yellow}\n=== REPORTS API ===${colors.reset}`);
  
  await testEndpoint('GET', '/api/reports/dashboard');
  await testEndpoint('GET', '/api/reports/top-products');
  await testEndpoint('GET', '/api/reports/khata-stats');
  await testEndpoint('GET', '/api/reports/profit');
  await testEndpoint('GET', '/api/reports/cash-flow');

  // ============================================================
  // ADMIN API
  // ============================================================
  console.log(`${colors.yellow}\n=== ADMIN API ===${colors.reset}`);
  
  await testEndpoint('GET', '/api/admin/products/total');
  await testEndpoint('GET', '/api/admin/orders/total');
  await testEndpoint('GET', '/api/admin/shops/total');

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log(`\n${colors.yellow}=== TEST SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    console.log(`\n${colors.red}Some tests failed. Check the errors above.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}All tests passed!${colors.reset}`);
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
