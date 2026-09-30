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
    logoClassName: 'w-40 h-40 transition-transform duration-300',
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
    googleSiteVerification: 'BPO_05-y3girQJnOzN4k3xo6r07DPlcH1OFydF3S9eY',
    impactSiteVerification: '787d0258-0f9d-406f-b2b2-ec884ca8b45f',
    admitadVerification: '148f2795-d29c-4bb9-8351-b38851dcf0ff',
    gtagConversion: {
        sendTo: 'AW-17998192949/KletCK3N5pMcELXCmoZD',
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
    cdnDomain: process.env.BLOGZENIX_CDN_DOMAIN || 'd3lt8ces76vqi0.cloudfront.net',

    // ─── Layout & Design Strategy ─────────────────────────────
    homepageLayout: 'default',
    themeMode: 'light',
    heroStyle: 'classic',
    cardStyle: 'ticket',
    heroPaddingClass: 'pt-8 pb-36 sm:pt-12 sm:pb-48',
    mainMarginClass: '-mt-32 sm:-mt-40',

    // ─── Footer ──────────────────────────────────────────────
    copyrightText: '© 2026 Blogzenix — Unlocking Insights, One Story at a Time.',

    // ─── Contact ─────────────────────────────────────────────
    contactEmail: 'contact@blogzenix.com',

    // ─── Categories & Navigation ──────────────────────────────
    categories: [
        {
            name: 'Health and Beauty',
            slug: 'health-and-beauty',
            href: '/blog/category/health-and-beauty',
            icon: '✨',
            description: 'Skincare routines, wellness tips, and beauty recommendations.',
        },
        {
            name: 'Home and Tech',
            slug: 'home-and-tech',
            href: '/blog/category/home-and-tech',
            icon: '💻',
            description: 'Smart living, gadget teardowns, and modern home improvements.',
        },
        {
            name: 'Lifestyle',
            slug: 'lifestyle',
            href: '/blog/category/lifestyle',
            icon: '🌿',
            description: 'Everyday life, productivity hacks, and modern living advice.',
        },
        {
            name: 'Sports and Fitness',
            slug: 'sports-and-fitness',
            href: '/blog/category/sports-and-fitness',
            icon: '🏃',
            description: 'Workout gear, training routines, and athletic performance.',
        },
        {
            name: 'Travel',
            slug: 'travel',
            href: '/blog/category/travel',
            icon: '✈️',
            description: 'Tested destinations, travel essentials, and flight gear reviews.',
        },
    ],
};

export default brandB;
