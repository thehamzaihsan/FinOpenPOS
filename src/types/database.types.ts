/**
 * POS-SY Database Types
 * Auto-generated from Supabase schema
 * Generated: 2025-04-19
 */

// ============================================================
// ENUMS
// ============================================================

export type CustomerType = 'walk_in' | 'retail';
export type OrderStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type UnitType = 'piece' | 'dozen' | 'kg' | 'packet' | 'litre' | 'meter';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'khata';
export type TransactionType = 'debit' | 'credit';
export type UserRole = 'admin' | 'salesman';

// ============================================================
// USERS & ROLES
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  email: string;
  name?: string;
  role: UserRole;
}

export interface UserUpdateInput {
  name?: string;
  role?: UserRole;
  is_active?: boolean;
}

// ============================================================
// CUSTOMERS
// ============================================================

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  customer_type: CustomerType;
  is_walk_in: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreateInput {
  name: string;
  phone?: string;
  address?: string;
  customer_type: CustomerType;
}

export interface CustomerUpdateInput {
  name?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface CustomerWithStats extends Customer {
  total_purchases?: number;
  total_spent?: number;
  khata_balance?: number;
}

// ============================================================
// PRODUCTS & VARIANTS
// ============================================================

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  unit: UnitType;
  item_code: string | null;
  min_discount: number;
  max_discount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  item_code: string | null;
  purchase_price: number | null;
  sale_price: number | null;
  quantity: number;
  min_discount: number | null;
  max_discount: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductCreateInput {
  name: string;
  description?: string;
  image_url?: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  unit: UnitType;
  item_code?: string;
  min_discount?: number;
  max_discount?: number;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  image_url?: string;
  purchase_price?: number;
  sale_price?: number;
  quantity?: number;
  unit?: UnitType;
  item_code?: string;
  min_discount?: number;
  max_discount?: number;
  is_active?: boolean;
}

export interface ProductVariantCreateInput {
  product_id: string;
  variant_name: string;
  item_code: string;
  purchase_price?: number;
  sale_price?: number;
  quantity: number;
  min_discount?: number;
  max_discount?: number;
}

export interface ProductVariantUpdateInput {
  variant_name?: string;
  item_code?: string;
  purchase_price?: number;
  sale_price?: number;
  quantity?: number;
  min_discount?: number;
  max_discount?: number;
  is_active?: boolean;
}

export interface ProductCSVRow {
  name: string;
  description?: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  unit: UnitType;
  item_code?: string;
  min_discount?: number;
  max_discount?: number;
  variant_name?: string;
}

// ============================================================
// DEALS
// ============================================================

export interface Deal {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items?: DealItem[];
}

export interface DealItem {
  id: string;
  deal_id: string;
  product_id: string | null;
  product_variant_id: string | null;
  quantity: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface DealCreateInput {
  name: string;
  description?: string;
  items: DealItemInput[];
}

export interface DealUpdateInput {
  name?: string;
  description?: string;
  is_active?: boolean;
  items?: DealItemInput[];
}

export interface DealItemInput {
  product_id?: string;
  product_variant_id?: string;
  quantity: number;
}

// ============================================================
// ORDERS & ORDER ITEMS
// ============================================================

export interface Order {
  id: string;
  customer_id: string | null;
  subtotal: number;
  discount_total: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  is_khata: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  customer?: Customer;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_variant_id: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  discount_amount: number;
  line_total: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface OrderCreateInput {
  customer_id?: string;
  items: OrderItemInput[];
  amount_paid: number;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface OrderItemInput {
  product_id?: string;
  product_variant_id?: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
}

export interface OrderUpdateInput {
  amount_paid?: number;
  status?: OrderStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  is_khata?: boolean;
}

export interface OrderRefundInput {
  refund_amount: number;
  reason: string;
}

export interface OrderWithCustomer extends Order {
  customer: Customer | undefined;
  items: OrderItem[];
}

// ============================================================
// KHATA (CREDIT LEDGER)
// ============================================================

export interface KhataAccount {
  id: string;
  customer_id: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  transactions?: KhataTransaction[];
}

export interface KhataTransaction {
  id: string;
  khata_account_id: string;
  order_id: string | null;
  amount: number;
  transaction_type: TransactionType;
  description: string | null;
  balance_after: number | null;
  created_at: string;
}

export interface KhataAccountCreateInput {
  customer_id: string;
  opening_balance?: number;
}

export interface KhataTransactionInput {
  amount: number;
  transaction_type: TransactionType;
  description: string;
  order_id?: string;
}

export interface KhataStatement {
  account: KhataAccount;
  transactions: KhataTransaction[];
  summary: {
    total_debits: number;
    total_credits: number;
    current_balance: number;
  };
}

// ============================================================
// EXPENSES
// ============================================================

export interface Expense {
  id: string;
  category: string | null;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
}

export interface ExpenseCreateInput {
  category?: string;
  amount: number;
  description?: string;
  expense_date?: string;
}

export interface ExpenseUpdateInput {
  category?: string;
  amount?: number;
  description?: string;
  expense_date?: string;
}

// ============================================================
// CASH SUMMARY
// ============================================================

export interface CashSummary {
  id: string;
  summary_date: string;
  total_cash_in: number;
  total_cash_out: number;
  total_expenses: number;
  net_cash: number;
  created_at: string;
  updated_at: string;
}

export interface CashSummaryCreateInput {
  summary_date: string;
  total_cash_in: number;
  total_cash_out: number;
  total_expenses: number;
}

// ============================================================
// REPORTS & ANALYTICS
// ============================================================

export interface ProfitSummary {
  date_range: {
    start: string;
    end: string;
  };
  total_revenue: number;
  total_cost: number;
  net_profit: number;
  profit_margin: number;
}

export interface ProductSaleStats {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  profit: number;
  rank: number;
}

export interface DailyCashFlow {
  date: string;
  cash_in: number;
  cash_out: number;
  expenses: number;
  net: number;
  order_count: number;
}

export interface KhataStat {
  customer_id: string;
  customer_name: string;
  total_outstanding: number;
  transaction_count: number;
  oldest_transaction: string;
}

export interface DashboardMetrics {
  today_revenue: number;
  today_orders: number;
  total_khata_outstanding: number;
  active_products: number;
  active_customers: number;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ============================================================
// UTILITY TYPES
// ============================================================

export interface PageParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  is_active?: boolean;
  status?: OrderStatus;
  customer_type?: CustomerType;
  date_from?: string;
  date_to?: string;
}

export interface BulkImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// ============================================================
// EXPORT ALL TYPES
// ============================================================

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserCreateInput;
        Update: UserUpdateInput;
      };
      customers: {
        Row: Customer;
        Insert: CustomerCreateInput;
        Update: CustomerUpdateInput;
      };
      products: {
        Row: Product;
        Insert: ProductCreateInput;
        Update: ProductUpdateInput;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: ProductVariantCreateInput;
        Update: ProductVariantUpdateInput;
      };
      deals: {
        Row: Deal;
        Insert: DealCreateInput;
        Update: DealUpdateInput;
      };
      deal_items: {
        Row: DealItem;
        Insert: DealItemInput;
      };
      orders: {
        Row: Order;
        Insert: OrderCreateInput;
        Update: OrderUpdateInput;
      };
      order_items: {
        Row: OrderItem;
        Insert: OrderItemInput;
      };
      khata_accounts: {
        Row: KhataAccount;
        Insert: KhataAccountCreateInput;
      };
      khata_transactions: {
        Row: KhataTransaction;
        Insert: KhataTransactionInput;
      };
      expenses: {
        Row: Expense;
        Insert: ExpenseCreateInput;
        Update: ExpenseUpdateInput;
      };
      cash_summary: {
        Row: CashSummary;
        Insert: CashSummaryCreateInput;
      };
    };
    Enums: {
      customer_type: CustomerType;
      order_status: OrderStatus;
      unit_type: UnitType;
      payment_method: PaymentMethod;
      transaction_type: TransactionType;
      user_role: UserRole;
    };
  };
};
