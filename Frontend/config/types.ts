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

export interface BrandCategory {
    name: string;
    slug: string;
    href?: string;
    icon?: string;
    description?: string;
    count?: string;
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
    /** Optional custom Tailwind class for header logo sizing/styling per brand */
    logoClassName?: string;
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
    /** Google Search Console verification token */
    googleSiteVerification?: string;
    /** Impact site verification value */
    impactSiteVerification?: string;
    /** Mitgo verification token */
    admitadVerification?: string;
    /** Affilza site verification token */
    affilzaVerification?: string;
    /** Google Ads conversion tag config */
    gtagConversion?: GtagConversion;

    // ─── Theme / Colors ──────────────────────────────────────
    /** Optional flag to enable dark mode class on html element for dark-first brands */
    isDarkMode?: boolean;
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
    /** Custom background color HSL for brand */
    backgroundHSL?: string;
    /** Custom secondary background color HSL for brand */
    backgroundSecondaryHSL?: string;
    /** Custom elevated background color HSL for brand cards/header */
    backgroundElevatedHSL?: string;
    /** Custom foreground text color HSL for brand */
    foregroundHSL?: string;
    /** Custom secondary text color HSL for brand */
    foregroundSecondaryHSL?: string;
    /** Custom border color HSL for brand */
    borderHSL?: string;

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

    // ─── Layout & Design Strategy ─────────────────────────────
    /** Homepage layout variant (e.g. "default", "compact", "magazine") */
    homepageLayout: string;
    /** Visual theme mode ('light' | 'dark') */
    themeMode?: 'light' | 'dark';
    /** Store hero banner variant strategy ('classic' | 'cyber' | 'minimal') */
    heroStyle?: 'classic' | 'cyber' | 'minimal';
    /** Coupon card visual variant strategy ('ticket' | 'neon-glass' | 'compact') */
    cardStyle?: 'ticket' | 'neon-glass' | 'compact';
    /** Custom hero container padding class override */
    heroPaddingClass?: string;
    /** Custom main content margin top class override */
    mainMarginClass?: string;

    // ─── Footer ──────────────────────────────────────────────
    /** Copyright text shown in footer */
    copyrightText: string;

    // ─── Contact ─────────────────────────────────────────────
    /** Contact email address */
    contactEmail: string;

    // ─── Categories & Navigation ──────────────────────────────
    /** Primary categories for this brand */
    categories?: BrandCategory[];
}
