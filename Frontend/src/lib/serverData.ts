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
    console.error('Server-side stores fetch error:', error);
    return { data: [], error: 'Failed to fetch stores' };
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
    
    const response = await fetch(`${brand.apiBaseUrl}/api/blog-categories`, {
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId
      },
      next: { revalidate: 600 }
    });

    if (!response.ok) return { data: [], error: `HTTP ${response.status}` };
    const result = await response.json();
    return { data: result.data || [], error: null };
  } catch (error) {
    return { data: [], error: 'Failed to fetch blog categories' };
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