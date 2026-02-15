/**
 * Central configuration file for the application
 * Handles environment-specific settings and API URLs
 */

// Determine if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Base URL configuration
const config = {
  // API URLs
  api: {
    // Base URL for API requests
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://coupon-app-backend.vercel.app',
    
    // Frontend URL (for callbacks, etc.)
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || (isProduction ? 'https://www.pennyscroll.com' : 'http://localhost:3000'),
    
    // Timeout for API requests in milliseconds
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  
  // Realtime configuration
  realtime: {
    // Choose between 'http-only' | 'sse' | 'ws-managed'
    mode: process.env.NEXT_PUBLIC_REALTIME_MODE || 'http-only',
    // Optional URLs for providers
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || '',
    sseUrl: process.env.NEXT_PUBLIC_SSE_URL || '',
    // Managed provider id (e.g., 'pusher', 'ably') when using ws-managed
    managedProvider: process.env.NEXT_PUBLIC_WS_PROVIDER || '',
  },
  
  // Image configuration
  images: {
    domain: process.env.NEXT_PUBLIC_IMAGE_DOMAIN || 'coupon-app-image.s3.us-east-1.amazonaws.com',
  },
  
  // Environment information
  env: {
    isProduction,
    isDevelopment: !isProduction,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

// Helper function to get the full API URL
export const getApiUrl = (endpoint: string): string => {
  // If the endpoint is a full URL or an internal API route, return it as is
  if (endpoint.startsWith('http') || endpoint.startsWith('/api/')) {
    return endpoint;
  }
  
  // Otherwise, prepend the base URL
  // Ensure no double slashes between base URL and endpoint
  const baseUrl = config.api.baseUrl.endsWith('/') 
    ? config.api.baseUrl.slice(0, -1) 
    : config.api.baseUrl;
  
  const formattedEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
  
  return `${baseUrl}${formattedEndpoint}`;
};

export default config;
