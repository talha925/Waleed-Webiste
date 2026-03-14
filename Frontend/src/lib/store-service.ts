/**
 * Centralized Store Service
 * Direct service layer access that bypasses API routes for server components
 * Relies on Next.js native Data Cache for performance and consistency
 */

import { cookies } from 'next/headers';
import config from './config';
import { Store, Coupon } from './types/store';
import { getBrandConfig } from '@config/index';

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
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    const brand = getBrandConfig();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-brand-id': brand.brandId,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    const brand = getBrandConfig();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-brand-id': brand.brandId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${brand.apiBaseUrl}/api/stores/slug/${encodeURIComponent(slug)}`;
    const fetchOptions = (forceRefresh)
      ? { headers, cache: 'no-store' as const }
      : { headers, next: { revalidate: 60, tags: [`store-${slug}`] } };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

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
    return null;
  }
}

/**
 * Get store by slug
 * CRITICAL: Relies on Next.js native caching
 */
export async function getStoreBySlug(slug: string, forceRefresh: boolean = false): Promise<Store | null> {
  try {
    const brand = getBrandConfig();

    // Attempt to fetch from direct backend slug endpoint
    const store = await fetchStoreBySlugDirect(slug, forceRefresh);

    // CRITICAL: Trust the direct endpoint. If it returns null (404), the store is gone.
    // We removed the fallback to fetchAllStores because it was reviving deleted stores
    // due to stale Next.js data cache.

    if (!store) {
      log(`Store NOT found at direct endpoint: ${slug}`);
      return null;
    }

    // CRITICAL: Add SEO/JSON-LD structured data (preserve existing logic)
    let enrichedStore = store as Store | null;
    if (store) {
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": store.name,
        "image": store.image?.url || "",
        "description": store.short_description || "",
        "url": `${brand.siteUrl}/store/${store.slug}`
      };
      const finalSeoObject = {
        ...jsonLd,
        ...store.seo
      };

      const existingCouponsObjs: Coupon[] = Array.isArray(store.coupons)
        ? (store.coupons as any[]).filter((x) => typeof x === 'object') as Coupon[]
        : [];
      let hydratedCoupons: Coupon[] = existingCouponsObjs;

      // Optimization: Only fetch coupons if they are not already populated
      if (hydratedCoupons.length === 0) {
        try {
          const headers: Record<string, string> = { 
            'Content-Type': 'application/json',
            'x-brand-id': brand.brandId
          };
          const fetchOptions = (forceRefresh)
            ? { headers, cache: 'no-store' as const }
            : { headers, next: { revalidate: 60, tags: [`store-${store.slug}-coupons`] } };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          try {
            const listRes = await fetch(`${brand.apiBaseUrl}/api/coupons?storeId=${store._id}`, {
              ...fetchOptions,
              signal: controller.signal
            });

            if (listRes.ok) {
              const listJson = await listRes.json();
              const allCoupons: Coupon[] = Array.isArray(listJson?.data) ? listJson.data : [];
              const storeCouponIds = Array.isArray(store.coupons) ? (store.coupons as any[]).filter((x) => typeof x === 'string') as string[] : [];
              if (storeCouponIds.length > 0) {
                const idSet = new Set(storeCouponIds);
                const matched = allCoupons.filter((c) => idSet.has(c._id));
                if (matched.length > 0) {
                  hydratedCoupons = matched;
                  hydratedCoupons.sort((a, b) => storeCouponIds.indexOf(a._id) - storeCouponIds.indexOf(b._id));
                }
              } else {
                const byStore = allCoupons.filter((c: any) => c.storeId === store._id);
                if (byStore.length > 0) {
                  hydratedCoupons = byStore;
                }
              }
            }
          } finally {
            clearTimeout(timeoutId);
          }
          if (hydratedCoupons.length === 0) {
            const storeCouponIds = Array.isArray(store.coupons) ? (store.coupons as any[]).filter((x) => typeof x === 'string') as string[] : [];
            if (storeCouponIds.length > 0) {
              const fetchOptionsId = (forceRefresh)
                ? { cache: 'no-store' as const }
                : { next: { revalidate: 60, tags: storeCouponIds.map((id) => `coupon-${id}`) } };
              const byId = await Promise.all(
                storeCouponIds.map(async (id) => {
                  try {
                    const r = await fetch(`${brand.apiBaseUrl}/api/coupons/${id}`, {
                      ...fetchOptionsId,
                      headers: { 'x-brand-id': brand.brandId }
                    });
                    if (!r.ok) return null;
                    const j = await r.json();
                    return j?.data || null;
                  } catch {
                    return null;
                  }
                })
              );
              const resolved = (byId.filter(Boolean) as Coupon[]);
              if (resolved.length > 0) {
                hydratedCoupons = resolved;
                hydratedCoupons.sort((a, b) => storeCouponIds.indexOf(a._id) - storeCouponIds.indexOf(b._id));
              }
            }
          }
        } catch { }
      }

      enrichedStore = {
        ...store,
        coupons: hydratedCoupons,
        seo: finalSeoObject
      } as Store;
    }

    if (enrichedStore) {
      log(`Store found: ${slug}`);
    } else {
      log(`Store not found: ${slug}`);
    }

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
export function invalidateStoreCache(): void {
  // Logic to clear invalidation would be server-side revalidateTag
  log('Manual cache invalidation requested - should be handled via revalidateTag');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    message: "Using Native Next.js Data Cache"
  };
}