/**
 * Data Service - Centralized data fetching with automatic caching (SQLite API Version)
 */

import { cacheManager } from "./cache-manager";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Request failed: ${url}`);
  }
  return json.data as T;
}

export class DataService {
  /**
   * Fetch products with cache (5 min TTL)
   */
  async getProducts(forceRefresh = false): Promise<any[]> {
    const cacheKey = 'products_list';

    if (!forceRefresh) {
      const cached = cacheManager.get<any[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = await api<any[]>("/api/products");

      cacheManager.set(cacheKey, records || [], 5);
      return records || [];
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  /**
   * Fetch single product
   */
  async getProduct(productId: string) {
    try {
      const records = (await this.getProducts(true)) as any[];
      return records.find((x: any) => x.id === productId) || null;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }

  /**
   * Create product
   */
  async createProduct(data: any) {
    try {
      const record = await api<any>("/api/products", {
        method: "POST",
        body: JSON.stringify({ ...data, is_active: true }),
      });
      this.invalidateProductsCache();
      return record;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  }

  /**
   * Fetch customers with cache (5 min TTL)
   */
  async getCustomers(forceRefresh = false): Promise<any[]> {
    const cacheKey = 'customers_list';

    if (!forceRefresh) {
      const cached = cacheManager.get<any[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = await api<any[]>("/api/customers");

      cacheManager.set(cacheKey, records || [], 5);
      return records || [];
    } catch (error: any) {
      console.error('Failed to fetch customers:', error);
      return [];
    }
  }

  /**
   * Create customer
   */
  async createCustomer(data: any) {
    try {
      const record = await api<any>("/api/customers", {
        method: "POST",
        body: JSON.stringify({ ...data, is_active: true }),
      });
      this.invalidateCustomersCache();
      return record;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }

  /**
   * Fetch single customer with cache (10 min TTL)
   */
  async getCustomer(customerId: string, forceRefresh = false) {
    const cacheKey = `customer_${customerId}`;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = (await this.getCustomers(true)) as any[];
      const record = records.find((x: any) => x.id === customerId) || null;
      if (record) cacheManager.set(cacheKey, record, 10);
      return record;
    } catch (error: any) {
      console.error('Failed to fetch customer:', error);
      return null;
    }
  }

  /**
   * Fetch orders with cache (3 min TTL)
   */
  async getOrders(forceRefresh = false): Promise<any[]> {
    const cacheKey = 'orders_list';

    if (!forceRefresh) {
      const cached = cacheManager.get<any[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = await api<any[]>("/api/orders");

      cacheManager.set(cacheKey, records || [], 3);
      return records || [];
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  /**
   * Create order
   */
  async createOrder(data: any) {
    try {
      const record = await api<any>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ ...data, is_active: true }),
      });

      this.invalidateOrdersCache();
      this.invalidateProductsCache();
      return record;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Fetch single order with cache (5 min TTL)
   */
  async getOrder(orderId: string, forceRefresh = false) {
    const cacheKey = `order_${orderId}`;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = (await this.getOrders(true)) as any[];
      const record = records.find((x: any) => x.id === orderId) || null;
      if (record) cacheManager.set(cacheKey, record, 5);
      return record;
    } catch (error: any) {
      console.error('Failed to fetch order:', error);
      return null;
    }
  }

  /**
   * Fetch deals with cache (5 min TTL)
   */
  async getDeals(forceRefresh = false): Promise<any[]> {
    const cacheKey = 'deals_list';

    if (!forceRefresh) {
      const cached = cacheManager.get<any[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = await api<any[]>("/api/deals");

      cacheManager.set(cacheKey, records || [], 5);
      return records || [];
    } catch (error: any) {
      console.error('Failed to fetch deals:', error);
      return [];
    }
  }

  /**
   * Create deal
   */
  async createDeal(data: any) {
    try {
      const record = await api<any>("/api/deals", {
        method: "POST",
        body: JSON.stringify({ ...data, is_active: true }),
      });

      this.invalidateDealsCache();
      return record;
    } catch (error) {
      console.error('Failed to create deal:', error);
      throw error;
    }
  }

  /**
   * Get shop settings
   */
  async getShopSettings() {
    try {
      const res = await fetch("/api/settings/shop", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 404) return null;
      if (!res.ok || !json?.success) return null;
      return json.data;
    } catch (error) {
      console.error('Failed to fetch shop settings:', error);
      return null;
    }
  }

  /**
   * Update shop settings
   */
  async updateShopSettings(id: string | null, data: any) {
    try {
      if (id) {
        return await api<any>("/api/settings/shop", { method: "PUT", body: JSON.stringify(data) });
      }
      return await api<any>("/api/settings/shop", { method: "POST", body: JSON.stringify(data) });
    } catch (error) {
      console.error('Failed to update shop settings:', error);
      throw error;
    }
  }

  /**
   * Create product variant
   */
  async createVariant(data: any) {
    try {
      const record = await api<any>("/api/products/variants", {
        method: "POST",
        body: JSON.stringify({ ...data, is_active: true }),
      });
      return record;
    } catch (error) {
      console.error('Failed to create variant:', error);
      throw error;
    }
  }

  /**
   * Fetch reports data with cache (5 min TTL)
   */
  async getDashboardStats(): Promise<{
    todaysSales: number;
    ordersToday: number;
    outstandingKhata: number;
    customersWithKhata: number;
    last7Days: { date: string; sales: number }[];
    lowStock: any[];
  } | null> {
    const cacheKey = 'dashboard_stats';
    const cached = cacheManager.get<{
      todaysSales: number;
      ordersToday: number;
      outstandingKhata: number;
      customersWithKhata: number;
      last7Days: { date: string; sales: number }[];
      lowStock: any[];
    }>(cacheKey);
    if (cached) return cached;

    try {
      const data = await api<any>("/api/reports/dashboard");
      cacheManager.set(cacheKey, data, 5);
      return data;
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      return null;
    }
  }

  /**
   * Fetch orders for specific customer
   */
  async getOrdersByCustomer(customerId: string): Promise<any[]> {
    try {
      const orders = (await this.getOrders(true)) as any[];
      return orders.filter((o: any) => o.customer_id === customerId);
    } catch (error: any) {
      console.error('Failed to fetch customer orders:', error);
      return [];
    }
  }

  /**
   * Fetch khata account for customer with cache (5 min TTL)
   */
  async getKhataAccount(customerId: string, forceRefresh = false) {
    const cacheKey = `khata_${customerId}`;

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const accounts = await api<any[]>(`/api/khata-accounts`);
      const record = accounts.find((a: any) => a.customer_id === customerId) || null;
      if (record) cacheManager.set(cacheKey, record, 5);
      return record;
    } catch (error: any) {
      console.error('Failed to fetch khata account:', error);
      return null;
    }
  }

  /**
   * Invalidate related caches after mutations
   */
  invalidateProductsCache() {
    cacheManager.clear('products_list');
  }

  invalidateCustomersCache() {
    cacheManager.clear('customers_list');
  }

  invalidateOrdersCache() {
    cacheManager.clear('orders_list');
  }

  invalidateDealsCache() {
    cacheManager.clear('deals_list');
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    cacheManager.clearAll();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheManager.getStatus();
  }
}

export const dataService = new DataService();
