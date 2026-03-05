/**
 * Multi-Domain Brand Configuration Index
 *
 * Central registry that maps hostnames → brand configs.
 * This is the ONLY file you need to update when adding a new domain.
 *
 * How to add a new brand:
 *   1. Create config/brandC.ts (copy from brandB.ts)
 *   2. Import it below
 *   3. Add a domain mapping entry in DOMAIN_MAP
 *   4. Done — no component changes required
 */

import { headers } from 'next/headers';
import type { BrandConfig } from './types';
import brandA from './brandA';
import brandB from './brandB';

// ─── Domain → Brand mapping ───────────────────────────────
// Keys can be full hostnames or partial matches (checked via includes).
// Order matters — first match wins.
// The last entry '' is the catch-all fallback.
const DOMAIN_MAP: Array<{ match: string; config: BrandConfig }> = [
    { match: 'pennyscroll.com', config: brandA },
    { match: 'blogzenix.com', config: brandB },
    // ↑ Add new domains here
];

/**
 * Resolve the brand config for the current request.
 * Works on the **server side** only (reads Next.js request headers).
 *
 * Usage in Server Components / `generateMetadata`:
 *   const brand = getBrandConfig();
 */
export function getBrandConfig(): BrandConfig {
    // 1. Build-Time / Environment Variable Check (Best for Vercel Static Generation)
    // If this env var is set, we return that brand immediately.
    if (process.env.NEXT_PUBLIC_APP_BRAND_ID) {
        for (const entry of DOMAIN_MAP) {
            if (entry.config.brandId === process.env.NEXT_PUBLIC_APP_BRAND_ID) {
                return entry.config;
            }
        }
    }

    // 2. Runtime Header Check (Fallback for specialized multi-tenant setups)
    try {
        const headersList = headers();
        const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';

        for (const entry of DOMAIN_MAP) {
            // Strict match: avoid "brand.com" matching "mybrand.com"
            if (host === entry.match || host.endsWith(`.${entry.match}`)) {
                return entry.config;
            }
        }
    } catch {
        // headers() throws outside of a request context (e.g. build time)
    }

    // No fallback - throw error if no brand is found
    throw new Error(`[Brand Config] No matching configuration found. Check your .env or Domain Map.`);
}

/**
 * Resolve brand config from an arbitrary hostname string.
 * Useful in middleware, API routes, or anywhere you already have the host.
 */
export function getBrandConfigByHost(host: string): BrandConfig {
    // Priority 1: Environment Variable Override (for Local Dev)
    if (process.env.NEXT_PUBLIC_APP_BRAND_ID) {
        for (const entry of DOMAIN_MAP) {
            if (entry.config.brandId === process.env.NEXT_PUBLIC_APP_BRAND_ID) {
                return entry.config;
            }
        }
    }

    // Priority 2: Domain Matching
    for (const entry of DOMAIN_MAP) {
        const hostname = host.split(':')[0]; // Remove port
        if (hostname === entry.match || hostname.endsWith(`.${entry.match}`)) {
            return entry.config;
        }
    }

    // No fallback to brandA - throw error if no brand is found
    throw new Error(`[Brand Config] No matching configuration found for host: "${host}". Check your .env or Domain Map.`);
}

// Re-export types and individual brands for convenience
export type { BrandConfig } from './types';
export { brandA, brandB };
