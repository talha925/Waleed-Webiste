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
    logoPath: '/image/Logo-ATT.png', // Update this when you have a Blogzenix logo
    faviconPath: '/favicon.svg',

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
    gaId: process.env.NEXT_PUBLIC_GA_ID_BRAND_B || 'G-BLOGZENIX',
    gtagConversion: {
        sendTo: 'AW-XXXXXXXXXXX/XXXXXXXXXXXXXX',
        value: 1.0,
        currency: 'USD',
    },

    // ─── Theme / Colors ──────────────────────────────────────
    themeColor: '#8B5CF6', // Violet-500 (Changing to a blog-friendly purple)
    primaryHSL: '263 90% 61%',
    accentHSL: '199 89% 48%',

    // ─── API ─────────────────────────────────────────────────
    apiBaseUrl:
        process.env.NEXT_PUBLIC_API_BASE_URL_BRAND_B ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        'https://coupon-app-backend.vercel.app',

    // ─── Database & Storage ──────────────────────────────────
    mongoDBName: process.env.MONGO_DB_NAME_BRAND_B || undefined,
    bucketName: process.env.AWS_BUCKET_NAME_BRAND_B || 'blogzenix-images',
    imageDomain: process.env.NEXT_PUBLIC_IMAGE_DOMAIN_BRAND_B || 'blogzenix-images.s3.us-east-1.amazonaws.com',

    // ─── Layout ──────────────────────────────────────────────
    homepageLayout: 'default',

    // ─── Footer ──────────────────────────────────────────────
    copyrightText: '© 2025 Blogzenix — Unlocking Insights, One Story at a Time.',

    // ─── Contact ─────────────────────────────────────────────
    contactEmail: 'contact@blogzenix.com',
};

export default brandB;
