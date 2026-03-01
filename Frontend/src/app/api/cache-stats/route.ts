import { NextResponse } from 'next/server';
import { cacheOptimizer } from '@/lib/cache-optimizer';
import { getCacheStats } from '@/lib/cache';

export const dynamic = 'force-dynamic';

/**
 * API endpoint for cache statistics and performance monitoring
 * Provides detailed insights into cache performance and recommendations
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const recommendations = searchParams.get('recommendations') === 'true';

    // Get basic cache stats
    const basicStats = getCacheStats();
    const overallStats = cacheOptimizer.getOverallStats();

    let response: any = {
      timestamp: new Date().toISOString(),
      basicStats,
      overallStats,
    };

    // Add detailed metrics if requested
    if (detailed) {
      response.detailedMetrics = cacheOptimizer.exportMetrics();
    }

    // Add recommendations if requested
    if (recommendations) {
      response.recommendations = cacheOptimizer.getCacheRecommendations();
    }

    // Set appropriate cache headers for this endpoint
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch cache statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for cache management operations
 */
export async function POST(request: Request) {
  try {
    const { action, keys } = await request.json();

    switch (action) {
      case 'warm':
        if (Array.isArray(keys)) {
          await cacheOptimizer.warmCache(keys);
          return NextResponse.json({
            message: `Cache warming initiated for ${keys.length} keys`,
            keys,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      case 'cleanup':
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        cacheOptimizer.cleanupMetrics(maxAge);
        return NextResponse.json({
          message: 'Cache metrics cleanup completed',
          timestamp: new Date().toISOString(),
        });

      case 'batch-invalidate':
        if (Array.isArray(keys)) {
          await cacheOptimizer.batchInvalidate(keys);
          return NextResponse.json({
            message: `Batch invalidation completed for ${keys.length} keys`,
            keys,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: warm, cleanup, batch-invalidate' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in cache management:', error);
    return NextResponse.json(
      {
        error: 'Cache management operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}