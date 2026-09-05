/**
 * Brand C Configuration — Spec Reveal
 *
 * Generic Multi-Niche Blog & Information Portal
 */

import type { BrandConfig } from './types';

const brandC: BrandConfig = {
  // ─── Identity ────────────────────────────────────────────
  brandId: 'specreveal',
  siteName: 'Spec Reveal',
  siteTagline: 'Insights, Guides & Trends That Matter',
  logoPath: '/image/specreveal-logo.png',
  logoClassName: 'h-12 md:h-14 w-auto rounded-full object-contain shadow-md',
  faviconPath: '/image/specreveal-logo.png',

  // ─── Domain ──────────────────────────────────────────────
  domain: 'specreveal.com',
  siteUrl: 'https://www.specreveal.com',

  // ─── SEO & Meta ──────────────────────────────────────────
  metaTitle: 'Spec Reveal - In-Depth Guides, Reviews & Latest Trends',
  metaTitleTemplate: '%s | Spec Reveal',
  metaDescription:
    'Discover expert reviews, in-depth buying guides, and latest trends across lifestyle, tech, home, and finance. Make smarter decisions with Spec Reveal.',
  metaKeywords: [
    'Spec Reveal',
    'specreveal',
    'in-depth reviews',
    'buying guides',
    'latest trends',
    'product comparisons',
    'expert insights',
    'lifestyle guides',
    'how-to guides',
    'trending topics',
    'honest reviews',
  ],
  ogImage: '/image/specreveal-logo.png',
  twitterImage: '/image/specreveal-logo.png',

  // ─── Analytics & Tracking ────────────────────────────────
  gaId: process.env.NEXT_PUBLIC_GA_ID_BRAND_C || '',

  // ─── Theme / Colors ──────────────────────────────────────
  isDarkMode: true,
  themeColor: '#FF1E27', // Neon Crimson Red
  primaryHSL: '358 100% 56%', // Neon Crimson Red
  secondaryHSL: '222 16% 12%', // Dark Gunmetal Charcoal
  accentHSL: '220 15% 78%', // Metallic Platinum Silver
  accent2HSL: '358 100% 50%', // Vivid Crimson
  backgroundHSL: '222 24% 7%', // Obsidian Black (#0C0E14)
  backgroundSecondaryHSL: '222 20% 10%', // Dark Charcoal (#131620)
  backgroundElevatedHSL: '222 18% 14%', // Elevated Gunmetal (#1B202D)
  foregroundHSL: '0 0% 98%', // Pure White Text
  foregroundSecondaryHSL: '220 12% 70%', // Cool Slate Silver Text
  borderHSL: '222 16% 20%', // Dark Gunmetal Border

  // ─── API ─────────────────────────────────────────────────
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL_BRAND_C ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://specreveal-backend.onrender.com',

  // ─── Database & Storage ──────────────────────────────────
  mongoDBName: process.env.MONGO_DB_NAME_BRAND_C || undefined,
  bucketName: process.env.AWS_BUCKET_NAME_BRAND_C || 'specreveal-images',
  cdnDomain: process.env.SPECREVEAL_CDN_DOMAIN || 'd2wb25wu8gphm4.cloudfront.net',

  // ─── Layout & Design Strategy ─────────────────────────────
  homepageLayout: 'default',
  themeMode: 'dark',
  heroStyle: 'cyber',
  cardStyle: 'neon-glass',
  heroPaddingClass: 'pt-8 pb-12 sm:pt-12 sm:pb-16',
  mainMarginClass: 'pt-6 sm:pt-8 lg:pt-10',

  // ─── Footer ──────────────────────────────────────────────
  copyrightText: '© 2026 Spec Reveal. All rights reserved.',

  // ─── Contact ─────────────────────────────────────────────
  contactEmail: 'specreveal@gmail.com',
};

export default brandC;
