/**
 * Data Service - Centralized data fetching with automatic caching
 * All API calls go through here for consistent caching behavior
 */

import { getSupabaseClient } from './supabase-client';
import { cacheManager } from './cache-manager';

export class DataService {
  private supabase = getSupabaseClient();

  /**
   * Fetch products with cache (5 min TTL)
   */
  async getProducts(forceRefresh = false) {
    const cacheKey = 'products_list';

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      cacheManager.set(cacheKey, data || [], 5);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  /**
   * Fetch customers with cache (5 min TTL)
   */
  async getCustomers(forceRefresh = false) {
    const cacheKey = 'customers_list';

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      cacheManager.set(cacheKey, data || [], 5);
      return data || [];
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
      const { data, error } = await this.supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      cacheManager.set(cacheKey, data, 10);
      return data;
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      return null;
    }
  }

  /**
   * Fetch orders with cache (3 min TTL)
   */
  async getOrders(forceRefresh = false) {
    const cacheKey = 'orders_list';

    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      cacheManager.set(cacheKey, data || [], 3);
      return data || [];
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
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      cacheManager.set(cacheKey, data, 5);
      return data;
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
      const { data, error } = await this.supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      cacheManager.set(cacheKey, data || [], 5);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      return [];
    }
  }

  /**
   * Fetch reports data with cache (5 min TTL)
   */
  async getReportData(type: 'dashboard' | 'profit' | 'khata-stats') {
    const cacheKey = `report_${type}`;

    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .from('reports')
        .select('*')
        .eq('type', type)
        .single();

      if (error) throw error;

      cacheManager.set(cacheKey, data, 5);
      return data;
    } catch (error) {
      console.error(`Failed to fetch report ${type}:`, error);
      return null;
    }
  }

  /**
   * Invalidate specific cache
   */
  invalidateCache(key: string) {
    cacheManager.clear(key);
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
