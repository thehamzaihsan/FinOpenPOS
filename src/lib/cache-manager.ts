/**
 * Cache Manager - Handles client-side caching for API data
 * Improves performance by storing frequently accessed data locally
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private prefix = "pos_cache_";

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      // Check if cache has expired
      if (now - entry.timestamp > entry.ttl) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error(`Error retrieving cache for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.error(`Error setting cache for ${key}:`, error);
    }
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`Error clearing cache for ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing all cache:", error);
    }
  }

  /**
   * Get cache status
   */
  getStatus(): {
    entries: number;
    size: string;
  } {
    let totalSize = 0;
    let entries = 0;

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.prefix)) {
        entries++;
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
    });

    const sizeInKB = (totalSize / 1024).toFixed(2);
    return {
      entries,
      size: `${sizeInKB} KB`,
    };
  }
}

export const cacheManager = new CacheManager();
