import type { BrandConfig } from '@config/types';

/**
 * Pure utility to rewrite S3 image URL to its CloudFront CDN domain counterpart.
 * Uses strict URL parsing to match exact hostname rather than substring checks.
 *
 * @param url The input image URL
 * @param brand The current brand configuration
 * @returns The rewritten CDN URL if match found, otherwise the original URL
 */
export function getCdnUrl(url: string, brand: BrandConfig): string {
  if (!url || !brand.cdnDomain || !brand.imageDomain) {
    return url;
  }

  try {
    // Only parse if it looks like an absolute URL containing protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.toLowerCase() === brand.imageDomain.toLowerCase()) {
        parsedUrl.hostname = brand.cdnDomain;
        return parsedUrl.toString();
      }
    }
  } catch (error) {
    console.warn('[CDN Utility] Error rewriting S3 URL to CDN:', error);
  }

  return url;
}
