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
  
  return cleanUrl;
}; 