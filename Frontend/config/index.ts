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
 * Resolve brand config from an arbitrary hostname string.
 * This is safe to import on both client and server sides.
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
    const hostname = host.split(':')[0].toLowerCase(); // Remove port and lowercase
    for (const entry of DOMAIN_MAP) {
        if (hostname === entry.match || hostname.endsWith(`.${entry.match}`)) {
            return entry.config;
        }
        // Logic for Vercel preview/branch domains (e.g. blogzenix-frontend.vercel.app)
        if (hostname.includes(entry.config.brandId) && hostname.includes('vercel.app')) {
            return entry.config;
        }
    }

    // Fallback to first brand
    console.warn(`[Brand Config] No matching configuration found for host: "${host}". Falling back to default.`);
    return DOMAIN_MAP[0].config;
}

// Re-export types and individual brands for convenience
export type { BrandConfig } from './types';
export { brandA, brandB };
