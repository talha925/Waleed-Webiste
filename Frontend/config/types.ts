/**
 * Brand Configuration Type Definitions
 *
 * All brand config files must satisfy this interface.
 * Adding a new field here ensures type-safety across all brands.
 */

export interface GtagConversion {
    /** e.g. "AW-123456/abcdef" */
    sendTo: string;
    value: number;
    currency: string;
}

export interface BrandConfig {
    // ─── Identity ────────────────────────────────────────────
    /** Unique identifier for this brand (used in code logic, never displayed) */
    brandId: string;
    /** Display name shown in UI, footer, meta */
    siteName: string;
    /** Short tagline / slogan */
    siteTagline: string;
    /** Path to logo image relative to /public */
    logoPath: string;
    /** Path to favicon relative to /public */
    faviconPath: string;

    // ─── Domain ──────────────────────────────────────────────
    /** Primary domain (e.g. "www.pennyscroll.com") */
    domain: string;
    /** Full URL with protocol (e.g. "https://www.pennyscroll.com") */
    siteUrl: string;

    // ─── SEO & Meta ──────────────────────────────────────────
    /** Default page title */
    metaTitle: string;
    /** Title template for sub-pages, must contain %s */
    metaTitleTemplate: string;
    /** Default meta description */
    metaDescription: string;
    /** SEO keywords */
    metaKeywords: string[];
    /** Open Graph image path */
    ogImage: string;
    /** Twitter card image path */
    twitterImage: string;

    // ─── Analytics & Tracking ────────────────────────────────
    /** Google Analytics Measurement ID (e.g. "G-AAAAAAA") */
    gaId: string;
    /** Google Ads Measurement ID (e.g. "AW-12345678") */
    googleAdsId?: string;
    /** Google AdSense Account ID (e.g. "ca-pub-XXXXXXXXXXXXXXXX") */
    adSenseAccount?: string;
    /** Impact site verification value */
    impactSiteVerification?: string;
    /** Google Ads conversion tag config */
    gtagConversion?: GtagConversion;

    // ─── Theme / Colors ──────────────────────────────────────
    /** Primary theme color in hex (used for meta theme-color) */
    themeColor: string;
    /** Primary color in HSL values (e.g. "217 91% 60%"), injected as CSS variable */
    primaryHSL: string;
    /** Secondary color in HSL values */
    secondaryHSL?: string;
    /** Primary accent color in HSL values */
    accentHSL: string;
    /** Secondary accent color in HSL values */
    accent2HSL?: string;

    // ─── API ─────────────────────────────────────────────────
    /** Backend API base URL */
    apiBaseUrl: string;

    // ─── Database & Storage ──────────────────────────────────
    /** Optional MongoDB database name override for this brand */
    mongoDBName?: string;
    /** S3 Bucket name for this brand */
    bucketName?: string;
    /** S3 Bucket domain host for images (e.g. "mybucket.s3.region.amazonaws.com") */
    imageDomain?: string;
    /** CloudFront CDN domain host for serving S3 images (e.g. "d123.cloudfront.net") */
    cdnDomain?: string;

    // ─── Layout ──────────────────────────────────────────────
    /** Homepage layout variant (e.g. "default", "compact", "magazine") */
    homepageLayout: string;

    // ─── Footer ──────────────────────────────────────────────
    /** Copyright text shown in footer */
    copyrightText: string;

    // ─── Contact ─────────────────────────────────────────────
    /** Contact email address */
    contactEmail: string;
}
