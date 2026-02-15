import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { Category } from '@/lib/types/category';
import { CacheManager, CACHE_CONFIG, generateCategoryJsonLd } from '@/lib/cache';

// Initialize cache manager for categories
const categoriesCache = new CacheManager<Category>('categories', CACHE_CONFIG.categories);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const noCache = searchParams.get('noCache') === 'true';
    const includeJsonLd = searchParams.get('jsonLd') === 'true';

    // Get categories with caching
    const { data: categories, headers } = await categoriesCache.getData(
      `${config.api.baseUrl}/api/categories`,
      noCache
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
