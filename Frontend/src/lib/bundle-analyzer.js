/**
 * This file configures the Next.js Bundle Analyzer
 * Run with: npm run analyze
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer;