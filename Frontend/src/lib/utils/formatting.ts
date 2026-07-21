/**
 * Converts a string to a URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Formats a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Truncates text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Capitalizes the first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Processes tags string into an array
 */
export const processTags = (tagsString: string): string[] => {
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

/**
 * Decodes HTML entities in a string
 */
export const decodeHTML = (input: string): string => {
  if (typeof window !== 'undefined') {
    const doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent || input;
  }
  // Fallback for server-side rendering
  return input
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
};

/**
 * Sanitizes a URL to prevent XSS attacks
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '#';
  const cleanUrl = url.trim();
  const lowerUrl = cleanUrl.toLowerCase();
  
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return '#';
  }
  
  return cleanUrl;
};

/**
 * Strips PPC/ad click tracking parameters from a URL.
 * This prevents affiliate networks from detecting paid search traffic
 * (gclid, msclkid, fbclid, etc.) and zeroing out commissions.
 */
const PPC_PARAMS = [
  'gclid',       // Google Ads
  'gbraid',      // Google Ads (iOS)
  'wbraid',      // Google Ads (web-to-app)
  'msclkid',     // Microsoft/Bing Ads
  'fbclid',      // Facebook Ads
  'dclid',       // Google Display & Video 360
  'gclsrc',      // Google Ads source
  'utm_source',  // UTM tracking
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'li_fat_id',   // LinkedIn Ads
  'ttclid',      // TikTok Ads
  'twclid',      // Twitter/X Ads
  'igshid',      // Instagram
  'mc_cid',      // Mailchimp
  'mc_eid',      // Mailchimp
];

export const stripPPCParams = (url: string): string => {
  if (!url || url === '#') return url;
  try {
    const urlObj = new URL(url);
    let changed = false;
    for (const param of PPC_PARAMS) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.delete(param);
        changed = true;
      }
    }
    return changed ? urlObj.toString() : url;
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
};

/**
 * Sanitize + strip PPC params in one call — use this for all affiliate/tracking URLs
 */
export const cleanTrackingUrl = (url: string): string => {
  return stripPPCParams(sanitizeUrl(url));
};