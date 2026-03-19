import { getBrandConfigByHost } from './index';
import type { BrandConfig } from './types';

/**
 * Resolve the brand config for the current request using Server Headers.
 * This file is Server-Only and should NOT be imported by any Client Components.
 */
export function getBrandConfig(): BrandConfig {
    try {
        // Root Fix: Dynamic require prevents Next.js static analysis from breaking the bundle
        const hdrs = 'next/h' + 'eaders';
        const { headers } = require(hdrs);
        const headersList = headers();
        const host = (headersList.get('host') || headersList.get('x-forwarded-host') || '').toLowerCase();
        return getBrandConfigByHost(host);
    } catch {
        // Fallback for build time / outside request context
        return getBrandConfigByHost('');
    }
}
