import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/store-service';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Invalidate all store-related Next.js caches via tags
    revalidateTag('stores', 'max');
    revalidateTag('coupons', 'max');
    revalidatePath('/', 'layout');

    // Get updated cache stats
    const stats = getCacheStats();

    return NextResponse.json({
      message: 'Store service cache invalidated successfully',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error invalidating store service cache:', error);
    return NextResponse.json(
      {
        message: 'Error invalidating store service cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get current cache stats
    const stats = getCacheStats();

    return NextResponse.json({
      message: 'Store service cache statistics',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      {
        message: 'Error getting cache stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}