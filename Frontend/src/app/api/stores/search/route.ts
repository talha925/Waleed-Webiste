import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';

    // Validate input parameters
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        stores: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true
      });
    }

    // Sanitize query to prevent injection attacks
    const sanitizedQuery = query.trim().replace(/[<>"'&]/g, '');

    if (sanitizedQuery.length === 0) {
      return NextResponse.json({
        stores: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true
      });
    }

    // Use optimized backend search endpoint
    const host = request.headers.get('host') || '';
    const { getBrandConfigByHost } = await import('@config/index');
    const brand = getBrandConfigByHost(host);

    const searchUrl = new URL(`${brand.apiBaseUrl}/api/stores/search`);
    searchUrl.searchParams.set('q', sanitizedQuery);
    searchUrl.searchParams.set('page', pageNum.toString());
    searchUrl.searchParams.set('limit', limitNum.toString());
    searchUrl.searchParams.set('_ts', Date.now().toString()); // 🔥 Cache buster for Next.js fetch cache

    const fetchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
        tags: ['stores-search', `search-store-${sanitizedQuery}`]
      }
    });

    // Handle different response statuses gracefully
    if (!fetchResponse.ok) {
      console.warn(`External API returned ${fetchResponse.status} for stores search`);

      // Fallback: fetch directly from backend API to avoid internal proxy issues
      try {
        const fallbackUrl = new URL(`${brand.apiBaseUrl}/api/stores`);
        fallbackUrl.searchParams.set('limit', '1000');

        const fallbackRes = await fetch(fallbackUrl.toString(), {
          headers: {
            'x-brand-id': brand.brandId,
          },
          next: { revalidate: 600, tags: ['stores'] }
        });
        if (fallbackRes.ok) {
          const payload = await fallbackRes.json();
          const allStores: any[] = Array.isArray(payload.data) ? payload.data : [];
          const q = sanitizedQuery.toLowerCase();
          const queryWords = q.split(/\s+/).filter(w => w.length > 1);
          const filtered = allStores.map(s => {
            const name = (s.name || '').toLowerCase();
            const slug = (s.slug || '').toLowerCase();
            const heading = (s.heading || '').toLowerCase();
            const shortDesc = (s.short_description || '').toLowerCase();
            const categories = Array.isArray(s.categories) ? s.categories.map((c: any) => c.name?.toLowerCase() || '').join(' ') : '';
            let score = 0;
            queryWords.forEach(word => {
              if (name.includes(word)) score += 30;
              if (slug.includes(word)) score += 25;
              if (heading.includes(word)) score += 15;
              if (shortDesc.includes(word)) score += 10;
              if (categories.includes(word)) score += 5;
            });
            if (name === q) score += 100;
            if (slug === q) score += 80;
            return { ...s, __score: score };
          }).filter(s => s.__score > 0)
            .sort((a, b) => b.__score - a.__score);
          const start = (pageNum - 1) * limitNum;
          const end = start + limitNum;
          const paged = filtered.slice(start, end).map(({ __score, ...rest }) => rest);
          return NextResponse.json({
            stores: paged,
            total: filtered.length,
            page: pageNum,
            limit: limitNum,
            success: true,
            message: 'Results served from local cache fallback'
          });
        }
      } catch (fallbackErr) {
        console.warn('Stores search fallback failed:', fallbackErr);
      }

      // Final fallback: return empty results
      return NextResponse.json({
        stores: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true,
        message: 'No stores found for your search query'
      });
    }

    const data = await fetchResponse.json();

    // Handle backend search response structure
    if (data.success && Array.isArray(data.data)) {
      return NextResponse.json({
        stores: data.data,
        total: data.data.length,
        page: data.currentPage || pageNum,
        limit: limitNum,
        success: true
      });
    }

    // Fallback for different response structures
    const stores = Array.isArray(data.stores) ? data.stores :
      Array.isArray(data.data) ? data.data :
        Array.isArray(data) ? data : [];

    return NextResponse.json({
      stores: stores.slice(0, limitNum),
      total: stores.length,
      page: pageNum,
      limit: limitNum,
      success: true
    });
  } catch (error) {
    console.error('Store search error:', error);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = Math.max(1, Math.min(50, parseInt(searchParams?.get('limit') || '10', 10)));
    const page = Math.max(1, parseInt(searchParams?.get('page') || '1', 10));

    // Attempt fallback search via direct backend API on error
    try {
      const host = request.headers.get('host') || '';
      const { getBrandConfigByHost } = await import('@config/index');
      const brand = getBrandConfigByHost(host);

      const fallbackUrl = new URL(`${brand.apiBaseUrl}/api/stores`);
      fallbackUrl.searchParams.set('limit', '1000');

      const fallbackRes = await fetch(fallbackUrl.toString(), {
        headers: {
          'x-brand-id': brand.brandId,
        },
        next: { revalidate: 600, tags: ['stores'] }
      });
      if (fallbackRes.ok) {
        const payload = await fallbackRes.json();
        const allStores: any[] = Array.isArray(payload.data) ? payload.data : [];
        const queryLc = q.trim().toLowerCase();
        const queryWords = queryLc.split(/\s+/).filter(w => w.length > 1);
        const filtered = allStores.map(s => {
          const name = (s.name || '').toLowerCase();
          const slug = (s.slug || '').toLowerCase();
          const heading = (s.heading || '').toLowerCase();
          const shortDesc = (s.short_description || '').toLowerCase();
          const categories = Array.isArray(s.categories) ? s.categories.map((c: any) => c.name?.toLowerCase() || '').join(' ') : '';
          let score = 0;
          queryWords.forEach(word => {
            if (name.includes(word)) score += 30;
            if (slug.includes(word)) score += 25;
            if (heading.includes(word)) score += 15;
            if (shortDesc.includes(word)) score += 10;
            if (categories.includes(word)) score += 5;
          });
          if (name === queryLc) score += 100;
          if (slug === queryLc) score += 80;
          return { ...s, __score: score };
        }).filter(s => s.__score > 0)
          .sort((a, b) => b.__score - a.__score);
        const start = (page - 1) * limit;
        const end = start + limit;
        const paged = filtered.slice(start, end).map(({ __score, ...rest }) => rest);
        const jsonResponse = NextResponse.json({
          stores: paged,
          total: filtered.length,
          page,
          limit,
          success: true,
          message: 'Results served from local cache fallback'
        });
        jsonResponse.headers.set('Cache-Control', 'public, s-maxage=60, must-revalidate');
        return jsonResponse;
      }
    } catch (fallbackErr) {
      console.warn('Stores search fallback failed in catch:', fallbackErr);
    }

    // Final graceful response
    const errorResponse = NextResponse.json({
      stores: [],
      total: 0,
      page,
      limit,
      success: true,
      message: 'Search temporarily unavailable. Please try again later.',
      error: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
    errorResponse.headers.set('Cache-Control', 'public, s-maxage=60, must-revalidate');
    return errorResponse;
  }
}