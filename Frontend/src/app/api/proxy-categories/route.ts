import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { Category } from '@/lib/types/category';
import { CacheManager, CACHE_CONFIG, generateCategoryJsonLd } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const noCache = searchParams.get('noCache') === 'true';
    const includeJsonLd = searchParams.get('jsonLd') === 'true';

    // For brand-aware Backend detection
    const host = req.headers.get('host') || '';
    const { getBrandConfigByHost } = await import('@config/index');
    const brand = getBrandConfigByHost(host);

    // Initialize cache manager for categories with brand-specific key
    const categoriesCache = new CacheManager<Category>(`categories-${brand.brandId}`, CACHE_CONFIG.categories);

    // Get categories with caching
    const { data: categories, headers } = await categoriesCache.getData(
      `${config.api.baseUrl}/api/categories`,
      noCache,
      { 'x-brand-id': brand.brandId }
    );

    // Add JSON-LD structured data if requested
    let responseData: any = { data: categories };

    if (includeJsonLd && categories.length > 0) {
      const jsonLdData = categories.map(category =>
        generateCategoryJsonLd(category, config.api.siteUrl)
      );
      responseData.seo = {
        jsonLd: jsonLdData
      };
    }

    return NextResponse.json(responseData, { headers });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        message: 'Error fetching categories',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
