import { useState, useEffect, useCallback } from 'react';
import { cacheOptimizer } from '@/lib/cache-optimizer';

interface CacheStats {
  basicStats: Record<string, any>;
  overallStats: {
    totalHits: number;
    totalMisses: number;
    hitRatio: number;
    averageResponseTime: number;
    totalInvalidations: number;
  };
  detailedMetrics?: Record<string, any>;
  recommendations?: Array<{
    key: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface UseCacheOptimizationReturn {
  stats: CacheStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  warmCache: (keys: string[]) => Promise<void>;
  batchInvalidate: (keys: string[]) => Promise<void>;
  cleanupMetrics: () => Promise<void>;
}

/**
 * Hook for cache optimization and monitoring
 * Provides real-time cache statistics and management capabilities
 */
export const useCacheOptimization = (
  autoRefresh = false,
  refreshInterval = 30000
): UseCacheOptimizationReturn => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (detailed = false, recommendations = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (detailed) params.set('detailed', 'true');
      if (recommendations) params.set('recommendations', 'true');

      const response = await fetch(`/api/cache-stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cache stats: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching cache stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await fetchStats(true, true);
  }, [fetchStats]);

  const warmCache = useCallback(async (keys: string[]) => {
    try {
      setError(null);
      const response = await fetch('/api/cache-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'warm',
          keys,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to warm cache: ${response.statusText}`);
      }

      // Refresh stats after warming
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error warming cache:', err);
    }
  }, [refreshStats]);

  const batchInvalidate = useCallback(async (keys: string[]) => {
    try {
      setError(null);
      const response = await fetch('/api/cache-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'batch-invalidate',
          keys,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to invalidate cache: ${response.statusText}`);
      }

      // Refresh stats after invalidation
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error invalidating cache:', err);
    }
  }, [refreshStats]);

  const cleanupMetrics = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/cache-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cleanup',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cleanup metrics: ${response.statusText}`);
      }

      // Refresh stats after cleanup
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error cleaning up metrics:', err);
    }
  }, [refreshStats]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStats(false, false); // Light refresh without detailed data
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchStats]);

  // Initial load
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    warmCache,
    batchInvalidate,
    cleanupMetrics,
  };
};