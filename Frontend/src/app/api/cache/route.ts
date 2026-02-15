import { NextResponse } from 'next/server';
import { invalidateCache, getCacheStats } from '@/lib/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    
    if (action === 'stats') {
      // Return cache statistics
      const stats = getCacheStats();
      return NextResponse.json({
        message: 'Cache statistics',
        stats,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      message: 'Cache management API',
      availableActions: [
        'GET /api/cache?action=stats - Get cache statistics',
        'POST /api/cache - Invalidate cache (body: { keys: ["stores", "categories"] })'
      ]
    });
  } catch (error) {
    console.error('Error in cache management:', error);
    return NextResponse.json(
      { message: 'Error in cache management', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keys } = body;
    
    if (!Array.isArray(keys)) {
      return NextResponse.json(
        { message: 'Invalid request. Expected { keys: string[] }' },
        { status: 400 }
      );
    }
    
    // Invalidate specified cache keys
    invalidateCache(keys);
    
    return NextResponse.json({
      message: 'Cache invalidated successfully',
      invalidatedKeys: keys,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      { message: 'Error invalidating cache', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}