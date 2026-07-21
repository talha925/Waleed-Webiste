const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: process.env.CDN_URL || '',
  reactStrictMode: true,
  staticPageGenerationTimeout: 300, // 🚀 Root Fix: Increase timeout to 5 mins for slow backend fetches during build
  poweredByHeader: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 🚀 FIX: Cache optimized images for 1 hour to reduce repeated fetches
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'd2o27hd92ee531.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'd3lt8ces76vqi0.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '*.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      ...(process.env.NEXT_PUBLIC_IMAGE_DOMAIN ? [{
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_IMAGE_DOMAIN,
      }] : []),
    ],
  },
  // Explicitly set Turbopack root to the project root
  turbopack: { root: path.resolve(__dirname, '..') },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@tinymce/tinymce-react',
      'web-vitals'
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },

          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin'
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/((?!api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/stores/:slug',
        destination: '/store/:slug',
        permanent: true,
      },
      {
        source: '/stores',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable gzip compression
  compress: true,
};

// Add bundle analyzer in analyze mode
const withBundleAnalyzer = require('./src/lib/bundle-analyzer');

module.exports = process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;