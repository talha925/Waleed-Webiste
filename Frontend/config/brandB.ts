/**
 * Brand B Configuration — Blogzenix
 *
 * This brand is focused on wide-range blog content and smart shopping insights.
 */

import type { BrandConfig } from './types';

const brandB: BrandConfig = {
    // ─── Identity ────────────────────────────────────────────
    brandId: 'blogzenix',
    siteName: 'Blogzenix',
    siteTagline: 'Unlocking Insights, One Story at a Time',
    logoPath: '/image/blogzenix-logo.png',
    faviconPath: '/blogzenix-favicon.png',

    // ─── Domain ──────────────────────────────────────────────
    domain: 'blogzenix.com',
    siteUrl: 'https://www.blogzenix.com',

    // ─── SEO & Meta ──────────────────────────────────────────
    metaTitle: 'Blogzenix - Insights, Trends, and Smart Shopping Guides',
    metaTitleTemplate: '%s | Blogzenix',
    metaDescription:
        'Blogzenix is your ultimate destination for the latest trends, expert insights, and smart shopping guides. Discover stories that matter.',
    metaKeywords: [
        'blog',
        'insights',
        'trends',
        'shopping guides',
        'expert reviews',
        'blogzenix',
        'lifestyle',
        'tech',
    ],
    ogImage: '/images/og-image.jpg',
    twitterImage: '/images/twitter-image.jpg',

    // ─── Analytics & Tracking ────────────────────────────────
    gaId: process.env.NEXT_PUBLIC_GA_ID_BRAND_B || 'G-RLGDEQM2Z9',
    googleAdsId: 'AW-17998192949',
    adSenseAccount: 'ca-pub-5501806014590426',
    gtagConversion: {
        sendTo: 'AW-XXXXXXXXXXX/XXXXXXXXXXXXXX',
        value: 1.0,
        currency: 'USD',
    },

    // ─── Theme / Colors ──────────────────────────────────────
    themeColor: '#0F3D5E', // Deep Navy Blue (Matches "Blog" part of logo)
    primaryHSL: '204 72% 22%', // Deep Navy Blue
    secondaryHSL: '220 91% 34%', // Rich Blue
    accentHSL: '33 94% 54%', // Vibrant Orange
    accent2HSL: '343 89% 52%', // Vivid Pink/Raspberry (Matches "Zenix" vibe) (Matches "Zenix" part of logo)

    // ─── API ─────────────────────────────────────────────────
    apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE_URL_BRAND_B ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'https://waleed-webiste-backend.vercel.app',

    // ─── Database & Storage ──────────────────────────────────
    mongoDBName: process.env.MONGO_DB_NAME_BRAND_B || undefined,
    bucketName: process.env.AWS_BUCKET_NAME_BRAND_B || 'blogzenix-images',
    imageDomain: process.env.BLOGZENIX_IMAGE_DOMAIN || 'blogzenix-images.s3.us-east-1.amazonaws.com',

    // ─── Layout ──────────────────────────────────────────────
    homepageLayout: 'default',

    // ─── Footer ──────────────────────────────────────────────
    copyrightText: '© 2026 Blogzenix — Unlocking Insights, One Story at a Time.',

    // ─── Contact ─────────────────────────────────────────────
    contactEmail: 'blogzenixx@gmail.com',
};

export default brandB;
