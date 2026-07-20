/**
 * Centralized Store Service
 * Direct service layer access that bypasses API routes for server components
 * Relies on Next.js native Data Cache for performance and consistency
 */

import { cookies } from 'next/headers';
import config from './config';
import { Store, Coupon } from './types/store';
import { getBrandConfig } from '../../config/server-config';

// Dev-only logging for debugging cache behavior
const log = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.log(`[StoreService] ${msg}`);
};

/**
 * Fetch all stores from external API
 * Uses Next.js native caching
 */
export async function fetchAllStores(forceRefresh: boolean = false): Promise<Store[]> {
  try {
    const brand = await getBrandConfig();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-brand-id': brand.brandId,
    };

    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('authToken')?.value;
      if (token && !forceRefresh) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) { }

    // In dev or when forcing refresh, bypass Next.js fetch cache entirely
    const fetchOptions = (forceRefresh)
      ? { headers, cache: 'no-store' as const }
      : { headers, next: { revalidate: 60, tags: ['stores'] } };

    const apiUrl = new URL(`${brand.apiBaseUrl}/api/stores`);
    // Use reasonable limit for list fetches; slug uses direct endpoint
    apiUrl.searchParams.set('limit', '50');
    apiUrl.searchParams.set('page', '1');
    if (forceRefresh) {
      apiUrl.searchParams.set('_ts', String(Date.now()));
    }

    const controller = new AbortController();
    // 🔥 FIX: Reduced from 30s to 12s - fail fast for better UX during cold starts
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(apiUrl.toString(), {
        ...fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stores: ${response.status}`);
      }

      const data = await response.json();
      const stores = data?.data || [];

      log(`Stores fetched (${stores.length} stores)`);
      return stores;
    } finally {
      clearTimeout(timeoutId);
    }

  } catch (error) {
    log(`Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Attempt to fetch a store by slug using backend search endpoint
 * Returns the first exact slug match, or null if not found
 */
async function fetchStoreBySlugDirect(slug: string, forceRefresh: boolean = false): Promise<Store | null> {
  try {
    const brand = await getBrandConfig();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-brand-id': brand.brandId,
    };

    // Safely attempt to get auth token without breaking static generation
    // Only use cookies if we're in a request context where they are available
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('authToken')?.value;
      if (token && !forceRefresh) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore error if cookies() is called outside of request context (e.g. during build)
    }

    const url = `${brand.apiBaseUrl}/api/stores/slug/${encodeURIComponent(slug)}`;
    const fetchOptions = (forceRefresh)
      ? { headers, cache: 'no-store' as const }
      : { headers, next: { revalidate: 60, tags: [`store-${slug}`, 'stores'] } }; // Cache for 60s, revalidate via tags

    const controller = new AbortController();
    // 🔥 FIX: Reduced from 30s to 12s - fail fast for better UX during cold starts
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 404) {
          log(`Direct slug endpoint returned 404 for ${slug}`);
          return null;
        }
        throw new Error(`Direct slug fetch failed: ${response.status}`);
      }

      const data = await response.json();
      const store = (data?.data && typeof data.data === 'object') ? data.data as Store : null;
      return store || null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    log(`Direct slug fetch error for ${slug}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw err;
  }
}

/**
 * Get store by slug
 * CRITICAL: Relies on Next.js native caching
 * Optimized: Removed redundant client-side coupon hydration (now handled by backend)
 */
export async function getStoreBySlug(slug: string, forceRefresh: boolean = false): Promise<Store | null> {
  try {
    const brand = await getBrandConfig();

    // Attempt to fetch from direct backend slug endpoint
    // The backend already populates coupons, so no need for second-pass hydration
    const store = await fetchStoreBySlugDirect(slug, forceRefresh);

    if (!store) {
      log(`Store NOT found at direct endpoint: ${slug}`);
      return null;
    }

    // CRITICAL: Add SEO/JSON-LD structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": store.name,
      "image": store.image?.url || "",
      "description": store.short_description || "",
      "url": `${brand.siteUrl}/store/${store.slug}`
    };

    const enrichedStore = {
      ...store,
      seo: {
        ...jsonLd,
        ...store.seo
      }
    } as Store;

    log(`Store found: ${slug}`);
    return enrichedStore;

  } catch (error) {
    log(`Store fetch failed for ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Invalidate all caches (useful for admin operations)
 * NOTE: With Next.js native caching, this should ideally use revalidateTag or revalidatePath
 */
export function getCacheStats() {
  return {
    message: "Using Native Next.js Data Cache"
  };
}