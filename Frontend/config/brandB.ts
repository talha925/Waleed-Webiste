/**
 * Brand B Configuration — Example Second Brand
 *
 * Duplicate this file to create new brand configs (e.g. brandC.ts).
 * Only the values that differ from brandA need to be set;
 * but for clarity we set all fields explicitly.
 *
 * Steps to add a new brand:
 *   1. Copy this file as config/brandC.ts
 *   2. Update all fields below
 *   3. Add domain mapping in config/index.ts
 *   4. Add env vars in Vercel for the new project
 *   5. Optionally create a separate MongoDB database
 */

import type { BrandConfig } from './types';

const brandB: BrandConfig = {
    // ─── Identity ────────────────────────────────────────────
    brandId: 'smartsaver',
    siteName: 'Smart Saver',
    siteTagline: 'The smartest way to save online',
    logoPath: '/image/Logo-ATT.png', // Replace with brand-specific logo
    faviconPath: '/favicon.svg', // Replace with brand-specific favicon

    // ─── Domain ──────────────────────────────────────────────
    domain: 'www.smartsaver.com',
    siteUrl: 'https://www.smartsaver.com',

    // ─── SEO & Meta ──────────────────────────────────────────
    metaTitle: 'Smart Saver - Save Big on Every Purchase',
    metaTitleTemplate: '%s | Smart Saver',
    metaDescription:
        'Find the best coupons, deals, and money-saving tips. Smart Saver helps you save big on every purchase with expert reviews and exclusive offers.',
    metaKeywords: [
        'coupons',
        'deals',
        'savings',
        'discounts',
        'money saving',
        'smart shopping',
        'offers',
        'smartsaver',
    ],
    ogImage: '/images/og-image.jpg',
    twitterImage: '/images/twitter-image.jpg',

    // ─── Analytics & Tracking ────────────────────────────────
    gaId: process.env.NEXT_PUBLIC_GA_ID_BRAND_B || 'G-BBBBBBB',
    gtagConversion: {
        sendTo: 'AW-XXXXXXXXXXX/XXXXXXXXXXXXXX',
        value: 1.0,
        currency: 'USD',
    },

    // ─── Theme / Colors ──────────────────────────────────────
    themeColor: '#10B981', // Emerald-500
    primaryHSL: '160 84% 39%',
    accentHSL: '188 94% 43%',

    // ─── API ─────────────────────────────────────────────────
    apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE_URL_BRAND_B ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'https://coupon-app-backend.vercel.app',

    // ─── Database (optional per-brand override) ──────────────
    mongoDBName: process.env.MONGO_DB_NAME_BRAND_B || undefined,

    // ─── Layout ──────────────────────────────────────────────
    homepageLayout: 'default',

    // ─── Footer ──────────────────────────────────────────────
    copyrightText: '© 2025 Smart Saver — The smartest way to save online.',

    // ─── Contact ─────────────────────────────────────────────
    contactEmail: 'support@smartsaver.com',
};

export default brandB;
