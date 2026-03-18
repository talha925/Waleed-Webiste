/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: process.env.CDN_URL || '',
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: process.env.NODE_ENV === 'production' ? 31536000 : 0, // 🚀 Standard: Cache for 1 year in production
    staticPageGenerationTimeout: 300, // 🚀 Root Fix: Increase timeout to 5 mins for slow backend fetches during build
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
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
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    webVitalsAttribution: ['CLS', 'LCP'],
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
            value: 'origin-when-cross-origin'
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
            value: 'public, max-age=0, s-maxage=10, must-revalidate',
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
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable gzip compression
  compress: true,
  webpack: (config, { isDev, isServer }) => {
    if (isDev) {
      config.devtool = 'cheap-module-source-map';
    }

    // Optimize chunk splitting for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Separate TinyMCE into its own chunk
            tinymce: {
              test: /[\\/]node_modules[\\/]@tinymce[\\/]/,
              name: 'tinymce',
              chunks: 'all',
              priority: 30,
              reuseExistingChunk: true,
            },
            // Separate web-vitals into its own chunk
            webVitals: {
              test: /[\\/]node_modules[\\/]web-vitals[\\/]/,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

};

// Add bundle analyzer in analyze mode
const withBundleAnalyzer = require('./src/lib/bundle-analyzer');

module.exports = process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;