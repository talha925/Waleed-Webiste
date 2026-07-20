import { getBrandConfigByHost } from './index';
import type { BrandConfig } from './types';

/**
 * Resolve the brand config for the current request using Server Headers.
 * This file is Server-Only and should NOT be imported by any Client Components.
 */
export async function getBrandConfig(): Promise<BrandConfig> {
    try {
        // Use dynamic require to prevent Next.js from breaking when this file is 
        // indirectly imported in client contexts (e.g., via HttpClient).
        // @ts-ignore hiding require from client bundler
        const { headers } = require('next/headers');
        const headersList = await headers();
        const host = (headersList.get('host') || headersList.get('x-forwarded-host') || '').toLowerCase();
        return getBrandConfigByHost(host);
    } catch (error) {
        // Fallback for build time / outside request context
        return getBrandConfigByHost('');
    }
}
