// Comprehensive caching utility for Next.js App Router
import { cacheOptimizer } from './cache-optimizer';

// Dev-only logging
export const log = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.log(msg);
};

// Cache configuration - Enhanced for better performance
export const CACHE_CONFIG = {
  categories: {
    inMemoryDuration: 60000, // 1 minute (increased from 30s)
    isrRevalidate: 300, // 5 minutes
    tags: ['categories'],
  },
  stores: {
    inMemoryDuration: 45000, // 45 seconds (increased from 30s)
    isrRevalidate: 60, // 60s
    tags: ['stores'],
  },
  coupons: {
    // Always fresh - no caching for real-time offers
    inMemoryDuration: 0,
    isrRevalidate: 0,
    tags: ['coupons'],
  },
  blogs: {
    inMemoryDuration: 300000, // 5 minutes
    isrRevalidate: 3600, // 1 hour
    tags: ['blogs'],
  },
  'featured-blogs': {
    inMemoryDuration: 600000, // 10 minutes
    isrRevalidate: 3600, // 1 hour
    tags: ['featured-blogs'],
  },
};

// Generic cache interface
interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}

// Cache storage
const cacheStorage = new Map<string, CacheEntry<any>>();

// Generic cache manager
export class CacheManager<T> {
  private cacheKey: string;
  private inMemoryDuration: number;
  private isrRevalidate: number;
  private tags: string[];

  constructor(cacheKey: string, config: {
    inMemoryDuration: number;
    isrRevalidate: number;
    tags?: string[];
  }) {
    this.cacheKey = cacheKey;
    this.inMemoryDuration = config.inMemoryDuration;
    this.isrRevalidate = config.isrRevalidate;
    this.tags = config.tags || [cacheKey];
  }

  // Get data from cache or fetch fresh
  async getData(
    apiUrl: string,
    noCache: boolean = false,
    customHeaders: Record<string, string> = {}
  ): Promise<{ data: T[]; headers: Headers }> {
    const startTime = Date.now();
    const now = Date.now();
    let data: T[] = [];
    const cache = cacheStorage.get(this.cacheKey) as CacheEntry<T> | undefined;

    // Use in-memory cache if valid and not forcing fresh
    // Note: We don't cache in-memory with customHeaders variation yet which is fine for now
    if (!noCache && cache && now - cache.timestamp < this.inMemoryDuration) {
      data = cache.data;
      log(`Serving ${this.cacheKey} from in-memory cache`);

      // Record cache hit
      const responseTime = Date.now() - startTime;
      cacheOptimizer.recordHit(this.cacheKey, responseTime);
    } else {
      // Fetch fresh data
      const fetchOptions: RequestInit = noCache || this.isrRevalidate === 0
        ? {
          cache: 'no-store',
          headers: {
            ...customHeaders
          }
        }
        : {
          next: {
            revalidate: this.isrRevalidate,
            tags: this.tags
          },
          headers: {
            ...customHeaders
          }
        };

      log(`Fetching ${this.cacheKey} from API (noCache=${noCache})`);
      const res = await fetch(apiUrl, fetchOptions);

      if (!res.ok) {
        throw new Error(`Failed to fetch ${this.cacheKey}: ${res.status}`);
      }

      const response = await res.json();

      // Smart extraction of the data array from various backend response structures
      data = Array.isArray(response.data?.categories) ? response.data.categories :
        Array.isArray(response.data?.stores) ? response.data.stores :
          Array.isArray(response.data?.coupons) ? response.data.coupons :
            Array.isArray(response.data?.data) ? response.data.data :
              Array.isArray(response.data) ? response.data :
                Array.isArray(response) ? response : [];

      // Update in-memory cache (only if caching is enabled)
      if (this.inMemoryDuration > 0) {
        cacheStorage.set(this.cacheKey, { data, timestamp: now });
        log(`Fetched fresh ${this.cacheKey} and updated in-memory cache`);
      }

      // Record cache miss
      const responseTime = Date.now() - startTime;
      cacheOptimizer.recordMiss(this.cacheKey, responseTime);
    }

    // Generate appropriate cache headers
    const headers = new Headers();
    if (noCache || this.isrRevalidate === 0) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
    } else {
      headers.set(
        'Cache-Control',
        `public, s-maxage=${this.isrRevalidate}, must-revalidate`
      );
    }

    return { data, headers };
  }

  // Clear cache for this key
  clearCache(): void {
    cacheStorage.delete(this.cacheKey);
    cacheOptimizer.recordInvalidation(this.cacheKey);
    log(`Cleared cache for ${this.cacheKey}`);
  }
}

// JSON-LD structured data generators
export const generateStoreJsonLd = (store: any, siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "Store",
  "name": store.name,
  "image": store.image?.url || "",
  "description": store.short_description || store.heading || "",
  "url": `${siteUrl}/store/${store.slug}`
});

export const generateCategoryJsonLd = (category: any, siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "CategoryCode",
  "name": category.name,
  "description": category.description || "",
  "url": `${siteUrl}/categories/${category.slug}`
});

// Cache invalidation utility
export const invalidateCache = (cacheKeys: string[]) => {
  cacheKeys.forEach(key => {
    cacheStorage.delete(key);
    cacheOptimizer.recordInvalidation(key);
    log(`Invalidated cache for ${key}`);
  });
};

// Get cache stats (for debugging)
export const getCacheStats = () => {
  const stats: Record<string, { size: number; lastUpdated: number }> = {};

  cacheStorage.forEach((value, key) => {
    stats[key] = {
      size: value.data.length,
      lastUpdated: value.timestamp
    };
  });

  return stats;
};