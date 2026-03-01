import { cookies } from 'next/headers';
import config from './config';

// Server-side data fetching utilities
export async function fetchStoresServer({ noCache = false }: { noCache?: boolean } = {}) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = noCache
      ? `${config.api.siteUrl}/api/proxy-stores?noCache=true`
      : `${config.api.siteUrl}/api/proxy-stores`;

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      console.error('Failed to fetch stores server-side:', response.status);
      return { data: [], error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data: data.data || [], error: null };
  } catch (error) {
    console.error('Server-side stores fetch error:', error);
    return { data: [], error: 'Failed to fetch stores' };
  }
}

export async function fetchCategoriesServer() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Disable caching for instant data updates
    const response = await fetch(`${config.api.siteUrl}/api/proxy-categories`, {
      headers,
      cache: 'no-store' // Always fetch fresh data
    });

    if (!response.ok) {
      console.error('Failed to fetch categories server-side:', response.status);
      return { data: [], error: `HTTP ${response.status}` };
    }

    const parsedData = await response.json();
    const categoriesArray = Array.isArray(parsedData.data?.categories) ? parsedData.data.categories :
      Array.isArray(parsedData.data) ? parsedData.data :
        Array.isArray(parsedData.categories) ? parsedData.categories :
          Array.isArray(parsedData) ? parsedData : [];

    return { data: categoriesArray, error: null };
  } catch (error) {
    console.error('Server-side categories fetch error:', error);
    return { data: [], error: 'Failed to fetch categories' };
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