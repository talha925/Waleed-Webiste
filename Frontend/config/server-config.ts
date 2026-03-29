import { headers } from 'next/headers';
import { getBrandConfigByHost } from './index';
import type { BrandConfig } from './types';

/**
 * Resolve the brand config for the current request using Server Headers.
 * This file is Server-Only and should NOT be imported by any Client Components.
 */
export function getBrandConfig(): BrandConfig {
    try {
        const headersList = headers();
        const host = (headersList.get('host') || headersList.get('x-forwarded-host') || '').toLowerCase();
        return getBrandConfigByHost(host);
    } catch (error) {
        // In Next.js, headers() throws a specific error during static generation
        // to signal that the page must be dynamic. We want to allow this for auto-detection
        // but provide a safe fallback for builds/tooling.
        return getBrandConfigByHost('');
    }
}
