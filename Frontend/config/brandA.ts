/**
 * Brand A Configuration — PennyScroll (Default Brand)
 *
 * This is the primary brand configuration.
 * All existing production values are preserved here.
 * This config is the fallback when no other domain matches.
 */

import type { BrandConfig } from './types';

const brandA: BrandConfig = {
  // ─── Identity ────────────────────────────────────────────
  brandId: 'pennyscroll',
  siteName: 'Penny Scroll',
  siteTagline: 'Your ultimate guide to smart shopping and better living',
  logoPath: '/image/Logo-ATT.png',
  faviconPath: '/favicon.svg',

  // ─── Domain ──────────────────────────────────────────────
  domain: 'www.pennyscroll.com',
  siteUrl: 'https://www.pennyscroll.com',

  // ─── SEO & Meta ──────────────────────────────────────────
  metaTitle: 'Penny Scroll - Discover the Best Deals, Reviews, and Lifestyle Tips',
  metaTitleTemplate: '%s | Penny Scroll',
  metaDescription:
    'Your ultimate guide to smart shopping and better living. Discover amazing deals, expert reviews, travel tips, health advice, and lifestyle inspiration at Penny Scroll.',
  metaKeywords: [
    'deals',
    'reviews',
    'lifestyle tips',
    'travel',
    'health',
    'wellness',
    'fashion',
    'technology',
    'smart shopping',
    'pennyscroll',
  ],
  ogImage: '/images/og-image.jpg',
  twitterImage: '/images/twitter-image.jpg',

  // ─── Analytics & Tracking ────────────────────────────────
  gaId: process.env.NEXT_PUBLIC_GA_ID || 'G-EEDR5X7C4S',
  gtagConversion: {
    sendTo: 'AW-17582430046/iCXoCKrCu-cbEN6u-r9B',
    value: 1.0,
    currency: 'USD',
  },

  // ─── Theme / Colors ──────────────────────────────────────
  themeColor: '#3B82F6', // Blue-500
  primaryHSL: '217 91% 60%', // Blue
  secondaryHSL: '271 81% 56%', // Purple
  accentHSL: '33 94% 54%', // Orange
  accent2HSL: '160 84% 39%', // Green

  // ─── API ─────────────────────────────────────────────────
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://coupon-app-backend.vercel.app',

  // ─── Database & Storage ──────────────────────────────────
  bucketName: process.env.AWS_BUCKET_NAME || 'coupon-app-image',
  imageDomain: process.env.PENNYSCROLL_IMAGE_DOMAIN || 'coupon-app-image.s3.us-east-1.amazonaws.com',
  cdnDomain: process.env.PENNYSCROLL_CDN_DOMAIN || 'd2o27hd92ee531.cloudfront.net',

  // ─── Layout ──────────────────────────────────────────────
  homepageLayout: 'default',

  // ─── Footer ──────────────────────────────────────────────
  copyrightText: '© 2026 PennyScroll — Your trusted source for savings, deals & shopping guides.',

  // ─── Contact ─────────────────────────────────────────────
  contactEmail: 'pennyscroll@gmail.com',
};

export default brandA;
