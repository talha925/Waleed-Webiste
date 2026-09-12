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
export const decodeHTML = (input?: string | null): string => {
  if (!input) return '';
  if (!input.includes('&')) return input;

  if (typeof window !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(input, 'text/html');
      return doc.documentElement.textContent || input;
    } catch {
      // Fallback to regex
    }
  }
  // Safe fallback for server-side rendering
  return input
    .replace(/&amp;/gi, '&')
    .replace(/&#x2F;/gi, '/')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'");
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

/**
 * Cleans ugly backticks, HTML entities, and formatting artifacts from text strings
 * e.g. "you`re" -> "you're", "don&#x27;t" -> "don't", "```" removal
 */
export const cleanTypography = (text: string | null | undefined): string => {
  if (!text || typeof text !== 'string') return '';
  let str = text;

  // Recursively decode common HTML entities in case of double/triple encoding
  for (let i = 0; i < 3; i++) {
    if (!/&(?:amp|#39|#x27|quot|lt|gt|#8216|#8217|#8220|#8221|lsquo|rsquo|ldquo|rdquo|apos);/i.test(str)) {
      break;
    }
    str = str
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&rsquo;/gi, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&ldquo;/gi, '"')
      .replace(/&rdquo;/gi, '"')
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }

  return str
    // Replace backtick used as apostrophe
    .replace(/(\w)`(\w)/g, "$1'$2")
    .replace(/`([a-zA-Z])/g, "'$1")
    // Remove stray markdown code fences
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '');
};

/**
 * Dynamic Multi-Brand Text Sanitizer:
 * Replaces any legacy/hardcoded brand names in DB text (BlogZenix, Penny Scroll, Review Chronicle, Spec Reveal, Trust Lense, Trend Filtered)
 * with the currently active brand's display name and cleans typography encoding artifacts.
 */
export const sanitizeBrandText = (text: string | null | undefined, currentBrandName: string): string => {
  if (!text || typeof text !== 'string') return '';
  const cleaned = cleanTypography(text);
  return cleaned
    .replace(/BlogZenix/gi, currentBrandName)
    .replace(/Penny\s*Scroll/gi, currentBrandName)
    .replace(/Review\s*Chronicle/gi, currentBrandName)
    .replace(/Spec\s*Reveal/gi, currentBrandName)
    .replace(/Trust\s*Lense/gi, currentBrandName)
    .replace(/Trend\s*Filtered/gi, currentBrandName);
};