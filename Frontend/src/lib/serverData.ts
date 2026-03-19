import { cookies } from 'next/headers';
import config from './config';

// Server-side data fetching utilities
export async function fetchStoresServer({ noCache = false }: { noCache?: boolean } = {}) {
  try {
    // Import direct service to bypass API routes for better performance and correct brand propagation
    const { fetchAllStores } = await import('./store-service');
    const stores = await fetchAllStores(noCache);

    return { data: stores || [], error: null };
  } catch (error) {
    console.error(`[ServerData] Fetch stores failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // CRITICAL: Throw error to prevent Next.js caching an empty list during cold starts or transient errors.
    // We keep the message user-friendly for the Catch boundary/Client component.
    throw new Error('Stores are currently unavailable. The backend may be starting up - please try reloading in a few seconds.');
  }
}

export async function fetchCategoriesServer() {
  try {
    const { getBrandConfig } = await import('@config/index');
    const brand = getBrandConfig();

    // Fetch directly from backend to avoid local proxy overhead
    const response = await fetch(`${brand.apiBaseUrl}/api/categories`, {
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      return { data: [], error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error('Server-side categories fetch error:', error);
    return { data: [], error: 'Failed to fetch categories' };
  }
}

export async function fetchBlogCategoriesServer() {
  try {
    const { getBrandConfig } = await import('@config/index');
    const brand = getBrandConfig();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${brand.apiBaseUrl}/api/blog-categories`, {
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId
      },
      signal: controller.signal,
      next: { revalidate: 5 } // 🔥 Reduced from 600s to 5s for near-instant category updates
    });

    clearTimeout(timeout);

    if (!response.ok) return { data: [], error: `HTTP ${response.status}` };
    const result = await response.json();
    
    // 💡 Handle the { categories: [], pagination: {} } structure from the service
    const list = result.data?.categories || result.categories || result.data || [];
    return { data: Array.isArray(list) ? list : [], error: null };
  } catch (error) {
    return { data: [], error: 'Failed to fetch blog categories' };
  }
}

/**
 * Fetch all data needed for the Home Page
 */
export async function fetchHomeDataServer() {
  try {
    const { getBrandConfig } = await import('@config/index');
    const brand = getBrandConfig();
    
    // Parallel fetch for speed
    const [featured, banner] = await Promise.all([
      fetch(`${brand.apiBaseUrl}/api/blogs?isFeaturedForHome=true&sort=-createdAt&limit=9`, {
        headers: { 'x-brand-id': brand.brandId },
        next: { revalidate: 60, tags: ['home-blogs'] }
      }).then(res => res.ok ? res.json() : null),
      fetch(`${brand.apiBaseUrl}/api/blogs?frontBanner=true&sort=-createdAt&limit=3`, {
        headers: { 'x-brand-id': brand.brandId },
        next: { revalidate: 60, tags: ['banner-blogs'] }
      }).then(res => res.ok ? res.json() : null)
    ]);

    return {
      featuredBlogs: featured?.data?.blogs || featured?.blogs || [],
      bannerBlogs: banner?.data?.blogs || banner?.blogs || [],
      error: null
    };
  } catch (error) {
    console.error('Home data fetch error:', error);
    return { featuredBlogs: [], bannerBlogs: [], error: 'Failed to load home data' };
  }
}

/**
 * Fetch Blog Detail and its related data
 */
export async function fetchBlogDetailServer(slugOrId: string) {
  try {
    const { getBrandConfig } = await import('@config/index');
    const brand = getBrandConfig();

    const response = await fetch(`${brand.apiBaseUrl}/api/blogs/${slugOrId}`, {
      headers: { 'x-brand-id': brand.brandId },
      next: { revalidate: 60, tags: [`blog-${slugOrId}`] }
    });

    if (!response.ok) return { data: null, error: `HTTP ${response.status}` };
    
    const result = await response.json();
    return { data: result.blog || result.data || null, error: null };
  } catch (error) {
    console.error('Blog detail fetch error:', error);
    return { data: null, error: 'Failed to fetch blog post' };
  }
}

/**
 * Fetch Recent/Popular Blogs for sidebar
 */
export async function fetchRecentBlogsServer(limit = 5, excludeId?: string) {
  try {
    const { getBrandConfig } = await import('@config/index');
    const brand = getBrandConfig();

    const url = new URL(`${brand.apiBaseUrl}/api/blogs`);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('sort', '-publishDate');
    if (excludeId) url.searchParams.set('exclude', excludeId);

    const response = await fetch(url.toString(), {
      headers: { 'x-brand-id': brand.brandId },
      next: { revalidate: 60, tags: ['recent-blogs'] }
    });

    if (!response.ok) return { data: [], error: `HTTP ${response.status}` };
    
    const result = await response.json();
    return { data: result.blogs || result.data?.blogs || [], error: null };
  } catch (error) {
    return { data: [], error: 'Failed to fetch recent blogs' };
  }
}

/**
 * Fetch blogs for a specific category
 */
export async function fetchBlogsByCategoryServer(categorySlug: string, page = 1, limit = 9) {
  try {
    const { getBrandConfig } = await import('@config/index');
    const brand = getBrandConfig();

    const url = new URL(`${brand.apiBaseUrl}/api/blogs`);
    if (categorySlug) url.searchParams.set('category', categorySlug);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('status', 'published');

    const response = await fetch(url.toString(), {
      headers: { 'x-brand-id': brand.brandId },
      next: { revalidate: 60, tags: [`category-${categorySlug}`] }
    });

    if (!response.ok) return { data: [], error: `HTTP ${response.status}` };
    
    const result = await response.json();
    return { data: result.blogs || result.data?.blogs || [], error: null };
  } catch (error) {
    return { data: [], error: 'Failed to fetch category blogs' };
  }
}

/**
 * Server-side data fetching for individual store
 * Updated to use direct service layer instead of internal HTTP calls
 */
export async function fetchStoreServer(slug: string) {
  try {
    // Import here to avoid circular dependencies
    const { getStoreBySlug } = await import('./store-service');

    const store = await getStoreBySlug(slug);

    if (!store) {
      return { data: null, error: 'Store not found' };
    }

    return { data: store, error: null };
  } catch (error) {
    console.error('Server-side store fetch error:', error);
    return { data: null, error: 'Failed to fetch store' };
  }
}

/**
 * Get the server-side authentication token from cookies
 */
export const getServerAuthToken = () => {
  const cookieStore = cookies();
  return cookieStore.get('authToken')?.value || null;
}