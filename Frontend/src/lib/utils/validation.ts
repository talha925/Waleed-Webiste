/**
 * Validates if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Strips HTML tags from a string to get plain text
 */
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Sanitizes HTML content by removing potentially dangerous elements
 */
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
    .replace(/javascript:/g, ''); // Remove javascript: protocol
};

/**
 * Cleans and formats URLs by ensuring they have proper protocol
 */
export const cleanAndFormatUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove any HTML entity encoding
  let cleanUrl = url.replace(/&#x2F;/g, '/');
  
  // Remove any existing protocol to avoid duplication
  cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
  
  // Add https:// protocol if URL is not empty
  if (cleanUrl) {
    cleanUrl = 'https://' + cleanUrl;
  }
  // Strip tracking params to protect commissions
  cleanUrl = stripAdTrackingParams(cleanUrl);
  
  return cleanUrl;
}; 

/**
 * Ad click tracking parameters that cause affiliate commissions to be zeroed.
 * These are injected by paid search ad platforms (Google, Bing, Facebook, etc.)
 */
const AD_TRACKING_PARAMS = [
  'gclid',      // Google Ads
  'msclkid',    // Microsoft/Bing Ads
  'fbclid',     // Facebook Ads
  'dclid',      // Google Display & Video 360
  'gbraid',     // Google Ads (iOS)
  'wbraid',     // Google Ads (web-to-app)
  'gclsrc',     // Google Ads source
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
];

/**
 * Strips ad tracking parameters (gclid, msclkid, etc.) from a URL
 * to prevent affiliate commissions from being zeroed.
 */
export const stripAdTrackingParams = (url: string): string => {
  if (!url) return url;

  try {
    const urlObj = new URL(url);
    let modified = false;

    for (const param of AD_TRACKING_PARAMS) {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.delete(param);
        modified = true;
      }
    }

    return modified ? urlObj.toString() : url;
  } catch {
    // If URL is not parseable, try regex-based stripping as fallback
    let cleanUrl = url;
    for (const param of AD_TRACKING_PARAMS) {
      const regex = new RegExp(`[?&]${param}=[^&]*`, 'g');
      cleanUrl = cleanUrl.replace(regex, '');
    }
    // Fix trailing ? or & if we removed the last parameter
    cleanUrl = cleanUrl.replace(/[?&]$/, '');
    // Fix empty query string like url?&something -> url?something
    cleanUrl = cleanUrl.replace(/\?&/, '?');
    return cleanUrl;
  }
};