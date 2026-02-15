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
    { match: 'smartsaver.com', config: brandB },
    // { match: 'brandC.com',   config: brandC },
    // ↑ Add new domains here

    // Fallback — must always be last
    { match: '', config: brandA },
];

/**
 * Resolve the brand config for the current request.
 * Works on the **server side** only (reads Next.js request headers).
 *
 * Usage in Server Components / `generateMetadata`:
 *   const brand = getBrandConfig();
 */
export function getBrandConfig(): BrandConfig {
    try {
        const headersList = headers();
        const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';

        for (const entry of DOMAIN_MAP) {
            // Strict match: avoid "brand.com" matching "mybrand.com"
            if (entry.match === '') return entry.config; // Fallback

            if (host === entry.match || host.endsWith(`.${entry.match}`)) {
                return entry.config;
            }
        }
    } catch {
        // headers() throws outside of a request context (e.g. build time)
    }

    // Fallback for build-time / non-request context
    return brandA;
}

/**
 * Resolve brand config from an arbitrary hostname string.
 * Useful in middleware, API routes, or anywhere you already have the host.
 */
export function getBrandConfigByHost(host: string): BrandConfig {
    for (const entry of DOMAIN_MAP) {
        if (entry.match === '') return entry.config; // Fallback

        if (host === entry.match || host.endsWith(`.${entry.match}`)) {
            return entry.config;
        }
    }
    return brandA;
}

// Re-export types and individual brands for convenience
export type { BrandConfig } from './types';
export { brandA, brandB };
