import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { Coupon } from '@/lib/types/store';
import { CacheManager, CACHE_CONFIG } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    // For brand-aware Backend detection
    const host = req.headers.get('host') || '';
    const { getBrandConfigByHost } = await import('@config/index');
    const brand = getBrandConfigByHost(host);

    // Build API URL with optional storeId filter
    let apiUrl = `${brand.apiBaseUrl}/api/coupons`;
    if (storeId) {
      apiUrl += `?storeId=${storeId}`;
    }

    // Initialize cache manager for coupons with brand-specific key
    const couponsCache = new CacheManager<Coupon>(`coupons-${brand.brandId}`, CACHE_CONFIG.coupons);

    // Always fetch fresh data - no caching for coupons/offers
    const { data: coupons, headers } = await couponsCache.getData(apiUrl, true, { 'x-brand-id': brand.brandId });

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