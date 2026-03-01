import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { Coupon } from '@/lib/types/store';
import { CacheManager, CACHE_CONFIG } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Initialize cache manager for coupons (always fresh - no caching)
const couponsCache = new CacheManager<Coupon>('coupons', CACHE_CONFIG.coupons);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    // Build API URL with optional storeId filter
    let apiUrl = `${config.api.baseUrl}/api/coupons`;
    if (storeId) {
      apiUrl += `?storeId=${storeId}`;
    }

    // Always fetch fresh data - no caching for coupons/offers
    const { data: coupons, headers } = await couponsCache.getData(apiUrl, true);

    return NextResponse.json({ data: coupons }, { headers });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      {
        message: 'Error fetching coupons',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}