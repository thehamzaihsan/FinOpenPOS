/**
 * POS-SYS Database Utilities
 * Common functions for database operations
 */
// @ts-nocheck

import { createClient } from '@supabase/supabase-js';
import type {
  Product,
  Order,
  Customer,
  KhataAccount,
  Deal,
  DashboardMetrics,
} from '@/types/database.types';

// ============================================================
// PRODUCT QUERIES
// ============================================================

/**
 * Get all active products with pagination and search
 */
export async function getProducts(
  supabase: ReturnType<typeof createClient>,
  page = 1,
  pageSize = 10,
  search = ''
) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get single product with variants
 */
export async function getProduct(
  supabase: ReturnType<typeof createClient>,
  productId: string
) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create new product
 */
export async function createProduct(
  supabase: ReturnType<typeof createClient>,
  product: Record<string, unknown>
) {
  const { data, error } = await (supabase
    .from('products')
    .insert([product]) as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update product
 */
export async function updateProduct(
  supabase: ReturnType<typeof createClient>,
  productId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await (supabase
    .from('products')
    .update(updates) as any)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete product (soft delete)
 */
export async function deleteProduct(
  supabase: ReturnType<typeof createClient>,
  productId: string
) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId);

  if (error) throw error;
}

/**
 * Get product by item code (barcode)
 */
export async function getProductByItemCode(
  supabase: ReturnType<typeof createClient>,
  itemCode: string
) {
  // Try variant first
  const { data: variant } = await supabase
    .from('product_variants')
    .select('*')
    .eq('item_code', itemCode)
    .eq('is_active', true)
    .single();

  if (variant) return variant;

  // Try product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('item_code', itemCode)
    .eq('is_active', true)
    .single();

  return product || null;
}

// ============================================================
// ORDER QUERIES
// ============================================================

/**
 * Get all orders with filtering
 */
export async function getOrders(
  supabase: ReturnType<typeof createClient>,
  page = 1,
  pageSize = 10
) {
  let query = supabase
    .from('orders')
    .select('*,customer:customers(*),items:order_items(*)', { count: 'exact' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get single order with items
 */
export async function getOrder(
  supabase: ReturnType<typeof createClient>,
  orderId: string
) {
  const { data, error } = await supabase
    .from('orders')
    .select('*,customer:customers(*),items:order_items(*)')
    .eq('id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create new order
 */
export async function createOrder(
  supabase: ReturnType<typeof createClient>,
  order: Record<string, unknown>
) {
  const { data, error } = await (supabase
    .from('orders')
    .insert([order]) as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update order
 */
export async function updateOrder(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await (supabase
    .from('orders')
    .update(updates) as any)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get today's orders
 */
export async function getTodayOrders(
  supabase: ReturnType<typeof createClient>
) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('orders')
    .select('*,customer:customers(*),items:order_items(*)')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  if (error) throw error;
  return data || [];
}

// ============================================================
// CUSTOMER QUERIES
// ============================================================

/**
 * Get all retail customers
 */
export async function getCustomers(
  supabase: ReturnType<typeof createClient>,
  page = 1,
  pageSize = 10,
  search = ''
) {
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .eq('customer_type', 'retail');

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get walk-in customer
 */
export async function getWalkInCustomer(
  supabase: ReturnType<typeof createClient>
) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('is_walk_in', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Create retail customer
 */
export async function createCustomer(
  supabase: ReturnType<typeof createClient>,
  customer: Record<string, unknown>
) {
  const { data, error } = await (supabase
    .from('customers')
    .insert([{ ...customer, customer_type: 'retail' }]) as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update customer
 */
export async function updateCustomer(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  updates: Record<string, unknown>
) {
  const { data, error } = await (supabase
    .from('customers')
    .update(updates) as any)
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// KHATA QUERIES
// ============================================================

/**
 * Get khata account for customer
 */
export async function getKhataAccount(
  supabase: ReturnType<typeof createClient>,
  customerId: string
) {
  const { data, error } = await supabase
    .from('khata_accounts')
    .select('*,customer:customers(*),transactions:khata_transactions(*)')
    .eq('customer_id', customerId)
    .single();

  if (error && error.code !== 'PGRST116') return null;
  return data || null;
}

/**
 * Create khata account
 */
export async function createKhataAccount(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  openingBalance = 0
) {
  const { data, error } = await (supabase
    .from('khata_accounts')
    .insert([
      {
        customer_id: customerId,
        opening_balance: openingBalance,
        current_balance: openingBalance,
      },
    ]) as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all khata accounts
 */
export async function getAllKhataAccounts(
  supabase: ReturnType<typeof createClient>
) {
  const { data, error } = await supabase
    .from('khata_accounts')
    .select('*,customer:customers(*)')
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

// ============================================================
// DEALS QUERIES
// ============================================================

/**
 * Get all active deals
 */
export async function getDeals(
  supabase: ReturnType<typeof createClient>
) {
  const { data, error } = await supabase
    .from('deals')
    .select(
      '*,items:deal_items(*,product:products(*),variant:product_variants(*))'
    )
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}

// ============================================================
// ANALYTICS QUERIES
// ============================================================

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(
  supabase: ReturnType<typeof createClient>
): Promise<DashboardMetrics> {
  const today = new Date().toISOString().split('T')[0];

  // Today's revenue
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  const todayRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
  const todayOrders = orders?.length || 0;

  // Total khata outstanding
  const { data: khataAccounts } = await supabase
    .from('khata_accounts')
    .select('current_balance')
    .eq('is_active', true);

  const totalKhataOutstanding =
    khataAccounts?.reduce((sum, k) => sum + k.current_balance, 0) || 0;

  // Active products count
  const { count: activeProducts } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('is_active', true);

  // Active customers count
  const { count: activeCustomers } = await supabase
    .from('customers')
    .select('id', { count: 'exact' })
    .eq('is_active', true)
    .eq('customer_type', 'retail');

  return {
    today_revenue: todayRevenue,
    today_orders: todayOrders,
    total_khata_outstanding: totalKhataOutstanding,
    active_products: activeProducts || 0,
    active_customers: activeCustomers || 0,
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Calculate line total with discount
 */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountPct = 0
) {
  const subtotal = quantity * unitPrice;
  const discount_amount = (subtotal * discountPct) / 100;
  const line_total = subtotal - discount_amount;

  return {
    discount_amount,
    line_total,
  };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Validate discount range
 */
export function validateDiscount(
  discount: number,
  minDiscount: number,
  maxDiscount: number
) {
  return discount >= minDiscount && discount <= maxDiscount;
}

export const dbUtils = {
  // Products
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByItemCode,

  // Orders
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  getTodayOrders,

  // Customers
  getCustomers,
  getWalkInCustomer,
  createCustomer,
  updateCustomer,

  // Khata
  getKhataAccount,
  createKhataAccount,
  getAllKhataAccounts,

  // Deals
  getDeals,

  // Analytics
  getDashboardMetrics,

  // Utilities
  calculateLineTotal,
  formatCurrency,
  validateDiscount,
};
