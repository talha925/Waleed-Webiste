/**
 * Advanced Cache Optimizer for Next.js 15
 * Provides intelligent caching strategies and performance monitoring
 */

import { revalidateTag, revalidatePath } from 'next/cache';

interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  lastAccess: number;
  averageResponseTime: number;
}

interface CacheOptimizerConfig {
  enableMetrics: boolean;
  enablePreloading: boolean;
  enableStaleWhileRevalidate: boolean;
  maxCacheSize: number;
}

class CacheOptimizer {
  private metrics: Map<string, CacheMetrics> = new Map();
  private config: CacheOptimizerConfig;
  private preloadQueue: Set<string> = new Set();

  constructor(config: Partial<CacheOptimizerConfig> = {}) {
    this.config = {
      enableMetrics: true,
      enablePreloading: true,
      enableStaleWhileRevalidate: true,
      maxCacheSize: 1000,
      ...config,
    };
  }

  /**
   * Record cache hit
   */
  recordHit(cacheKey: string, responseTime: number = 0): void {
    if (!this.config.enableMetrics) return;

    const metrics = this.metrics.get(cacheKey) || {
      hits: 0,
      misses: 0,
      invalidations: 0,
      lastAccess: 0,
      averageResponseTime: 0,
    };

    metrics.hits++;
    metrics.lastAccess = Date.now();
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.hits - 1) + responseTime) / metrics.hits;

    this.metrics.set(cacheKey, metrics);
  }

  /**
   * Record cache miss
   */
  recordMiss(cacheKey: string, responseTime: number = 0): void {
    if (!this.config.enableMetrics) return;

    const metrics = this.metrics.get(cacheKey) || {
      hits: 0,
      misses: 0,
      invalidations: 0,
      lastAccess: 0,
      averageResponseTime: 0,
    };

    metrics.misses++;
    metrics.lastAccess = Date.now();
    if (metrics.hits + metrics.misses === 1) {
      metrics.averageResponseTime = responseTime;
    }

    this.metrics.set(cacheKey, metrics);
  }

  /**
   * Record cache invalidation
   */
  recordInvalidation(cacheKey: string): void {
    if (!this.config.enableMetrics) return;

    const metrics = this.metrics.get(cacheKey);
    if (metrics) {
      metrics.invalidations++;
      this.metrics.set(cacheKey, metrics);
    }
  }

  /**
   * Get cache hit ratio for a specific key
   */
  getHitRatio(cacheKey: string): number {
    const metrics = this.metrics.get(cacheKey);
    if (!metrics || (metrics.hits + metrics.misses) === 0) return 0;
    
    return metrics.hits / (metrics.hits + metrics.misses);
  }

  /**
   * Get overall cache statistics
   */
  getOverallStats(): {
    totalKeys: number;
    averageHitRatio: number;
    totalHits: number;
    totalMisses: number;
    totalInvalidations: number;
  } {
    let totalHits = 0;
    let totalMisses = 0;
    let totalInvalidations = 0;

    for (const metrics of Array.from(this.metrics.values())) {
      totalHits += metrics.hits;
      totalMisses += metrics.misses;
      totalInvalidations += metrics.invalidations;
    }

    const totalRequests = totalHits + totalMisses;
    const averageHitRatio = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      totalKeys: this.metrics.size,
      averageHitRatio,
      totalHits,
      totalMisses,
      totalInvalidations,
    };
  }

  /**
   * Intelligent cache warming based on usage patterns
   */
  async warmCache(keys: string[]): Promise<void> {
    if (!this.config.enablePreloading) return;

    for (const key of keys) {
      if (!this.preloadQueue.has(key)) {
        this.preloadQueue.add(key);
        
        // Schedule preloading based on historical access patterns
        const metrics = this.metrics.get(key);
        if (metrics && this.getHitRatio(key) > 0.7) {
          // High hit ratio - prioritize preloading
          setTimeout(() => this.preloadResource(key), 100);
        } else {
          // Lower priority
          setTimeout(() => this.preloadResource(key), 1000);
        }
      }
    }
  }

  /**
   * Preload a specific resource
   */
  private async preloadResource(key: string): Promise<void> {
    try {
      // This would trigger the actual preloading logic
      // Implementation depends on the specific resource type
      console.log(`Preloading cache for key: ${key}`);
      
      // Remove from queue after processing
      this.preloadQueue.delete(key);
    } catch (error) {
      console.error(`Failed to preload cache for key ${key}:`, error);
      this.preloadQueue.delete(key);
    }
  }

  /**
   * Smart invalidation based on dependency graph
   */
  async smartInvalidate(primaryKey: string, dependencies: string[] = []): Promise<void> {
    // Invalidate primary key
    revalidateTag(primaryKey, 'max');
    this.recordInvalidation(primaryKey);

    // Invalidate dependencies
    for (const dep of dependencies) {
      revalidateTag(dep, 'max');
      this.recordInvalidation(dep);
    }

    // Log invalidation for monitoring
    console.log(`Smart invalidation: ${primaryKey} + ${dependencies.length} dependencies`);
  }

  /**
   * Batch invalidation for efficiency
   */
  async batchInvalidate(keys: string[]): Promise<void> {
    const startTime = Date.now();
    
    // Group by type for efficient processing
    const pathKeys = keys.filter(key => key.startsWith('/'));
    const tagKeys = keys.filter(key => !key.startsWith('/'));

    // Batch revalidate paths
    for (const path of pathKeys) {
      revalidatePath(path);
      this.recordInvalidation(path);
    }

    // Batch revalidate tags
    for (const tag of tagKeys) {
      revalidateTag(tag, 'max');
      this.recordInvalidation(tag);
    }

    const duration = Date.now() - startTime;
    console.log(`Batch invalidated ${keys.length} keys in ${duration}ms`);
  }

  /**
   * Get cache recommendations based on usage patterns
   */
  getCacheRecommendations(): {
    keysToWarm: string[];
    keysToInvalidate: string[];
    underperformingKeys: string[];
  } {
    const keysToWarm: string[] = [];
    const keysToInvalidate: string[] = [];
    const underperformingKeys: string[] = [];

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [key, metrics] of Array.from(this.metrics.entries())) {
      const hitRatio = this.getHitRatio(key);
      const isStale = now - metrics.lastAccess > oneHour;

      if (hitRatio > 0.8 && !isStale) {
        keysToWarm.push(key);
      } else if (hitRatio < 0.3 || isStale) {
        keysToInvalidate.push(key);
      } else if (hitRatio < 0.5) {
        underperformingKeys.push(key);
      }
    }

    return {
      keysToWarm,
      keysToInvalidate,
      underperformingKeys,
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanupMetrics(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    for (const [key, metrics] of Array.from(this.metrics.entries())) {
      if (now - metrics.lastAccess > maxAge) {
        this.metrics.delete(key);
      }
    }
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): Record<string, CacheMetrics> {
    const exported: Record<string, CacheMetrics> = {};
    
    for (const [key, metrics] of Array.from(this.metrics.entries())) {
      exported[key] = { ...metrics };
    }
    
    return exported;
  }
}

// Export singleton instance
export const cacheOptimizer = new CacheOptimizer();

// Export types
export type { CacheMetrics, CacheOptimizerConfig };