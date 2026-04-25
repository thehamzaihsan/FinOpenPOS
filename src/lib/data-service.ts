/**
 * Data Service - Centralized data fetching with automatic caching (PocketBase Version)
 * All database interactions go through here for consistent caching behavior.
 */

import pb from './pb';
import { cacheManager } from './cache-manager';
import { ensureCollections } from './ensure-collections';

async function initCollections() {
  try {
    await ensureCollections();
  } catch (e) {
    console.error('Failed to init collections:', e);
  }
}

export class DataService {
  /**
   * Fetch products with cache (5 min TTL)
   */
  async getProducts(forceRefresh = false) {
    await initCollections();
    
    const cacheKey = 'products_list';

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      // PocketBase getFullList automatically handles pagination if needed, or gets all
      const records = await pb.collection('products').getFullList({
        filter: 'is_active = true',
        sort: '-created',
      });

      cacheManager.set(cacheKey, records || [], 5);
      return records || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  /**
   * Fetch customers with cache (5 min TTL)
   */
  async getCustomers(forceRefresh = false) {
    await initCollections();
    
    const cacheKey = 'customers_list';

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = await pb.collection('customers').getFullList({
        filter: 'is_active = true',
        sort: '-created',
      });

      cacheManager.set(cacheKey, records || [], 5);
      return records || [];
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      return [];
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
      const record = await pb.collection('customers').getOne(customerId);
      cacheManager.set(cacheKey, record, 10);
      return record;
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      return null;
    }
  }

  /**
   * Fetch orders with cache (3 min TTL)
   */
  async getOrders(forceRefresh = false) {
    await initCollections();
    
    const cacheKey = 'orders_list';

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = await pb.collection('orders').getFullList({
        sort: '-created',
        expand: 'customer',
      });

      cacheManager.set(cacheKey, records || [], 3);
      return records || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
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
      const record = await pb.collection('orders').getOne(orderId, {
        expand: 'customer,order_items_via_order.product',
      });
      cacheManager.set(cacheKey, record, 5);
      return record;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return null;
    }
  }

  /**
   * Fetch deals with cache (5 min TTL)
   */
  async getDeals(forceRefresh = false) {
    const cacheKey = 'deals_list';

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const records = await pb.collection('deals').getFullList({
        filter: 'is_active = true',
        sort: '-created',
        expand: 'deal_items_via_deal.product',
      });

      cacheManager.set(cacheKey, records || [], 5);
      return records || [];
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      return [];
    }
  }

  /**
   * Fetch reports data with cache (5 min TTL)
   */
  async getDashboardStats() {
    await initCollections();
    
    const cacheKey = 'dashboard_stats';
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // Get today's orders
      const todayOrders = await pb.collection('orders').getFullList({
        filter: `created >= "${todayIso}"`,
      });

      const todaysSales = todayOrders.reduce((sum, order) => sum + (order.total || order.total_amount || 0), 0);

      // Get outstanding khata
      const khataAccounts = await pb.collection('khata_accounts').getFullList({
        filter: 'balance > 0',
      });

      const outstandingKhata = khataAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);

      // Last 7 days sales
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const start = d.toISOString();
        
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);
        const end = nextD.toISOString();

        const dayOrders = await pb.collection('orders').getFullList({
          filter: `created >= "${start}" && created < "${end}"`,
        });

        const dayTotal = dayOrders.reduce((sum, order) => sum + (order.total || order.total_amount || 0), 0);
        last7Days.push({
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          sales: dayTotal,
        });
      }

      const stats = {
        todaysSales,
        ordersToday: todayOrders.length,
        outstandingKhata,
        customersWithKhata: khataAccounts.length,
        last7Days,
      };

      cacheManager.set(cacheKey, stats, 5);
      return stats;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return null;
    }
  }

  /**
   * Fetch reports data with cache (5 min TTL)
   */
  async getReportData(type: 'dashboard' | 'profit' | 'khata-stats') {
    // In the PocketBase Tauri version, we compute reports client-side
    // or store them in a local cache/summary collection.
    // For now, this is a placeholder or you can implement client-side aggregation.
    console.warn(`Report fetching for ${type} should be implemented using client-side aggregation in Tauri version.`);
    return null;
  }

  /**
   * Invalidate specific cache
   */
  invalidateCache(key: string) {
    cacheManager.clear(key);
  }

  /**
   * Fetch orders for specific customer
   */
  async getOrdersByCustomer(customerId: string) {
    try {
      return await pb.collection('orders').getFullList({
        filter: `customer_id = "${customerId}"`,
        sort: '-created',
      });
    } catch (error) {
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
      const records = await pb.collection('khata_accounts').getFullList({
        filter: `customer_id = "${customerId}"`,
        expand: 'khata_transactions_via_khata_account',
      });

      const record = records[0] || null;
      cacheManager.set(cacheKey, record, 5);
      return record;
    } catch (error) {
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
