/**
 * Brand D Configuration — Trend Filtered
 *
 * Focused on trending product reviews, curated lifestyle deals, filtered ratings, and buyer guides.
 */

import type { BrandConfig } from './types';

const brandD: BrandConfig = {
  // ─── Identity ────────────────────────────────────────────
  brandId: 'trendfiltered',
  siteName: 'Trend Filtered',
  siteTagline: 'Curated Trends, Tested & Filtered',
  logoPath: '/image/tl-logo.jpg',
  logoClassName: 'h-12 md:h-14 w-auto rounded-full object-contain shadow-md',
  faviconPath: '/image/tl-logo.jpg',

  // ─── Domain ──────────────────────────────────────────────
  domain: 'trendfiltered.com',
  siteUrl: 'https://www.trendfiltered.com',

  // ─── SEO & Meta ──────────────────────────────────────────
  metaTitle: 'Trend Filtered - Curated Trends, Reviews & Top Recommendations',
  metaTitleTemplate: '%s | Trend Filtered',
  metaDescription:
    'Discover trending products, curated lifestyle deals, filtered reviews, and expert buying guides at Trend Filtered.',
  metaKeywords: [
    'trending products',
    'curated reviews',
    'lifestyle deals',
    'trend filtered',
    'trendfiltered',
    'buying guides',
    'consumer reviews',
    'top rated products',
  ],
  ogImage: '/image/tl-logo.jpg',
  twitterImage: '/image/tl-logo.jpg',

  // ─── Analytics & Tracking ────────────────────────────────
  gaId: process.env.NEXT_PUBLIC_GA_ID_BRAND_D || '',

  // ─── Theme / Colors ──────────────────────────────────────
  themeColor: '#0066FF', // Electric Tech Blue
  primaryHSL: '216 100% 50%', // Electric Tech Blue
  secondaryHSL: '215 65% 11%', // Deep Midnight Navy
  accentHSL: '201 96% 40%', // Cyan Verified Badge Blue
  accent2HSL: '160 84% 39%', // Verified Success Green

  // ─── API ─────────────────────────────────────────────────
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL_BRAND_D ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://waleed-webiste-backend.vercel.app',

  // ─── Database & Storage ──────────────────────────────────
  mongoDBName: process.env.MONGO_DB_NAME_BRAND_D || undefined,
  bucketName: process.env.AWS_BUCKET_NAME_BRAND_D || 'trendfiltered-images',
  cdnDomain: process.env.TRENDFILTERED_CDN_DOMAIN || 'd2kvfu9pxs1nnf.cloudfront.net',

  // ─── Layout & Design Strategy ─────────────────────────────
  homepageLayout: 'default',
  themeMode: 'light',
  heroStyle: 'cyber',
  cardStyle: 'neon-glass',
  heroPaddingClass: 'pt-8 pb-12 sm:pt-12 sm:pb-16',
  mainMarginClass: 'pt-6 sm:pt-8 lg:pt-10',

  // ─── Footer ──────────────────────────────────────────────
  copyrightText: '© 2026 Trend Filtered — All rights reserved.',

  // ─── Contact ─────────────────────────────────────────────
  contactEmail: 'trendfiltered@gmail.com',

  // ─── Categories & Navigation ──────────────────────────────
  categories: [
    {
      name: 'Home and Tech',
      slug: 'home-and-tech',
      href: '/blog/category/home-and-tech',
      icon: '💻',
      description: 'Smart living, gadget teardowns, and modern home improvements.',
    },
    {
      name: 'Health and Beauty',
      slug: 'health-and-beauty',
      href: '/blog/category/health-and-beauty',
      icon: '✨',
      description: 'Skincare routines, wellness tips, and beauty recommendations.',
    },
    {
      name: 'Lifestyle',
      slug: 'lifestyle',
      href: '/blog/category/lifestyle',
      icon: '🌿',
      description: 'Everyday life, productivity hacks, and modern living advice.',
    },
    {
      name: 'Products Reviews',
      slug: 'products-reviews',
      href: '/blog/category/products-reviews',
      icon: '⭐',
      description: 'In-depth tests, hands-on verdicts, and honest recommendations.',
    },
  ],
};

export default brandD;
