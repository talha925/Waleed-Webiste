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
        blogs: [],
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
        blogs: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true
      });
    }

    // Fetch all blogs from external API for client-side filtering
    // This ensures accurate search results with proper relevance scoring
    // Use dedicated backend search endpoint for blogs
    // FALLBACK: If this fails, we fetch from the main blogs endpoint and filter locally
    const host = request.headers.get('host') || '';
    const { getBrandConfigByHost } = await import('@config/index');
    const brand = getBrandConfigByHost(host);

    const searchUrl = new URL(`${brand.apiBaseUrl}/api/blogs/search`);
    searchUrl.searchParams.set('query', sanitizedQuery);
    searchUrl.searchParams.set('limit', limitNum.toString());
    searchUrl.searchParams.set('page', pageNum.toString());

    let fetchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
      next: {
        revalidate: 60,
        tags: [`search-blog-${sanitizedQuery}`]
      }
    });

    let allBlogs: any[] = [];

    // If dedicated search fails, fallback to fetching all blogs and filtering locally
    if (!fetchResponse.ok) {
      console.warn(`Blog search endpoint failed, falling back to local filter`);
      const fallbackUrl = new URL(`${brand.apiBaseUrl}/api/blogs`);
      fallbackUrl.searchParams.set('limit', '500'); // Fetch a large enough sample

      const fallbackRes = await fetch(fallbackUrl.toString(), {
        headers: {
          'x-brand-id': brand.brandId,
        },
        next: { revalidate: 600, tags: ['blogs'] }
      });

      if (fallbackRes.ok) {
        const payload = await fallbackRes.json();
        allBlogs = Array.isArray(payload.data?.blogs) ? payload.data.blogs :
          Array.isArray(payload.data) ? payload.data : [];
      }
    } else {
      const data = await fetchResponse.json();
      allBlogs = Array.isArray(data.data?.blogs) ? data.data.blogs :
        Array.isArray(data.data) ? data.data :
          Array.isArray(data.blogs) ? data.blogs :
            Array.isArray(data) ? data : [];

      // If the backend search actually worked and returned results, we can just return these
      // This block won't be hit usually, just return early if backend did the work
    }

    // Implement client-side search with relevance scoring
    const searchTerms = sanitizedQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

    const searchResults = allBlogs.map((blog: any) => {
      let relevanceScore = 0;
      const title = (blog.title || '').toLowerCase();
      const shortDescription = (blog.shortDescription || '').toLowerCase();
      const longDescription = (blog.longDescription || '').toLowerCase();
      const slug = (blog.slug || '').toLowerCase();
      const authorName = (blog.author?.name || '').toLowerCase();
      const categoryName = (blog.category?.name || '').toLowerCase();
      const storeName = (blog.store?.name || '').toLowerCase();
      const tags = Array.isArray(blog.tags) ? blog.tags.join(' ').toLowerCase() : '';

      // Calculate relevance score for each search term
      searchTerms.forEach(term => {
        // Exact title match gets highest score
        if (title === term) relevanceScore += 100;
        else if (title.includes(term)) relevanceScore += 50;

        // Exact slug match gets high score
        if (slug === term) relevanceScore += 80;
        else if (slug.includes(term)) relevanceScore += 40;

        // Store name and category matches
        if (storeName.includes(term)) relevanceScore += 30;
        if (categoryName.includes(term)) relevanceScore += 25;
        if (authorName.includes(term)) relevanceScore += 20;

        // Description matches
        if (shortDescription.includes(term)) relevanceScore += 15;
        if (longDescription.includes(term)) relevanceScore += 10;

        // Tags matches
        if (tags.includes(term)) relevanceScore += 20;
      });

      return { ...blog, relevanceScore };
    })
      .filter((blog: any) => blog.relevanceScore > 0) // Only include blogs with matches
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore); // Sort by relevance

    // Implement pagination on filtered results
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBlogs = searchResults.slice(startIndex, endIndex);

    // Remove relevanceScore from final results
    const blogs = paginatedBlogs.map(({ relevanceScore, ...blog }: any) => blog);

    const jsonResponse = NextResponse.json({
      blogs,
      total: searchResults.length,
      page: pageNum,
      limit: limitNum,
      success: true
    });

    // Restore prior cache headers
    jsonResponse.headers.set('Cache-Control', 'public, s-maxage=300, must-revalidate');
    jsonResponse.headers.set('CDN-Cache-Control', 'public, s-maxage=300');
    jsonResponse.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=300');

    return jsonResponse;
  } catch (error) {
    console.error('Blog search error:', error);

    const { searchParams } = new URL(request.url);

    // Always return 200 with empty results instead of 500 error
    const errorResponse = NextResponse.json({
      blogs: [],
      total: 0,
      page: parseInt(searchParams?.get('page') || '1', 10),
      limit: parseInt(searchParams?.get('limit') || '10', 10),
      success: true,
      message: 'Search temporarily unavailable. Please try again later.',
      error: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    });

    // Add minimal caching for error responses
    errorResponse.headers.set('Cache-Control', 'public, s-maxage=60, must-revalidate');

    return errorResponse;
  }
}