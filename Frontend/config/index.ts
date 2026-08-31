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
import brandC from './brandC';
import brandD from './brandD';

// ─── Domain → Brand mapping ───────────────────────────────
// Keys can be full hostnames or partial matches (checked via includes).
// Order matters — first match wins.
// The last entry '' is the catch-all fallback.
const DOMAIN_MAP: Array<{ match: string; config: BrandConfig }> = [
    { match: 'pennyscroll.com', config: brandA },
    { match: 'blogzenix.com', config: brandB },
    { match: 'specreveal.com', config: brandC },
    { match: 'trendfiltered.com', config: brandD },
    // ↑ Add new domains here
];

/**
 * Resolve brand config from an arbitrary hostname string.
 * This is safe to import on both client and server sides.
 */
export function getBrandConfigByHost(host: string): BrandConfig {
    const hostname = host.split(':')[0].toLowerCase().trim(); // Remove port, lowercase, trim

    // Priority 1: Domain / Subdomain Matching (Works for multi-domain deployments)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        for (const entry of DOMAIN_MAP) {
            if (hostname === entry.match || hostname.endsWith(`.${entry.match}`)) {
                return entry.config;
            }
            // Logic for Vercel preview/branch domains (e.g. specreveal-frontend.vercel.app)
            if (hostname.includes(entry.config.brandId) && hostname.includes('vercel.app')) {
                return entry.config;
            }
        }
    }

    // Priority 2: Environment Variable Override (for Local Dev or dedicated single-brand projects)
    if (process.env.NEXT_PUBLIC_APP_BRAND_ID) {
        for (const entry of DOMAIN_MAP) {
            if (entry.config.brandId === process.env.NEXT_PUBLIC_APP_BRAND_ID) {
                return entry.config;
            }
        }
    }

    // Fallback: If no match found, fallback to default brand
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        console.warn(`[Brand Config] No matching configuration found for host: "${host}". Falling back to default.`);
    }
    return DOMAIN_MAP[0].config;
}

// Re-export types and individual brands for convenience
export type { BrandConfig } from './types';
export { brandA, brandB, brandC, brandD };
