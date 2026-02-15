import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { Store } from '@/lib/types/store';
import { CacheManager, CACHE_CONFIG, generateStoreJsonLd } from '@/lib/cache';

// Initialize cache manager for stores
const storesCache = new CacheManager<Store>('stores', CACHE_CONFIG.stores);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const noCache = searchParams.get('noCache') === 'true';
    const includeJsonLd = searchParams.get('jsonLd') === 'true';

    // Get stores with caching
    const apiUrl = new URL(`${config.api.baseUrl}/api/stores`);
    // Fetch more stores to improve local search accuracy
    apiUrl.searchParams.set('limit', '1000');
    apiUrl.searchParams.set('page', '1');

    const { data: stores, headers } = await storesCache.getData(
      apiUrl.toString(),
      noCache
    );

    // Add JSON-LD structured data if requested
    let responseData: any = { data: stores };
    
    if (includeJsonLd && stores.length > 0) {
      const jsonLdData = stores.map(store => 
        generateStoreJsonLd(store, config.api.siteUrl)
      );
      responseData.seo = {
        jsonLd: jsonLdData
      };
    }

    return NextResponse.json(responseData, { headers });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      {
        message: 'Error fetching stores',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
