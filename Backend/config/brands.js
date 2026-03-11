/**
 * Multi-Brand Configuration for Backend
 *
 * Maps request hostnames → brand-specific settings.
 * Currently supports optional per-brand MongoDB database overrides.
 *
 * How to add a new brand:
 *   1. Add a new entry in BRAND_MAP below
 *   2. Set the corresponding env var (e.g. MONGO_URI_BRAND_B) in Vercel
 *   3. Done — no other backend changes required
 */

const BRAND_MAP = [
    {
        match: 'localhost',
        brandId: 'blogzenix',
        mongoUri: process.env.BLOGZENIX_MONGO_URI || null,
        bucketName: process.env.BLOGZENIX_S3_BUCKET || process.env.AWS_BUCKET_NAME,
    },
    {
        match: '127.0.0.1',
        brandId: 'blogzenix',
        mongoUri: process.env.BLOGZENIX_MONGO_URI || null,
        bucketName: process.env.BLOGZENIX_S3_BUCKET || process.env.AWS_BUCKET_NAME,
    },
    {
        match: 'blogzenix.com',
        brandId: 'blogzenix',
        mongoUri: process.env.BLOGZENIX_MONGO_URI || null,
        bucketName: process.env.BLOGZENIX_S3_BUCKET || process.env.AWS_BUCKET_NAME,
    },
    {
        match: 'waleed-webiste-backend.vercel.app',
        brandId: 'pennyscroll',
        mongoUri: process.env.PENNYSCROLL_MONGO_URI || process.env.MONGO_URI || null,
        bucketName: process.env.PENNYSCROLL_S3_BUCKET || process.env.AWS_BUCKET_NAME,
    },
    {
        match: 'coupon-app-backend.vercel.app',
        brandId: 'pennyscroll',
        mongoUri: process.env.PENNYSCROLL_MONGO_URI || null,
        bucketName: process.env.PENNYSCROLL_S3_BUCKET || process.env.AWS_BUCKET_NAME,
    },
    // { match: 'brandC.com', brandId: 'brandC', mongoUri: process.env.MONGO_URI_BRAND_C || null },
    // ↑ Add new brands here

    // Fallback — must always be last
    {
        match: '',
        brandId: 'pennyscroll',
        mongoUri: process.env.PENNYSCROLL_MONGO_URI || null,
        bucketName: process.env.PENNYSCROLL_S3_BUCKET || process.env.AWS_BUCKET_NAME,
    },
];

/**
 * Resolve brand config from a hostname string.
 * @param {string} host - The request hostname (e.g. "www.smartsaver.com")
 * @returns {{ brandId: string, mongoUri: string|null }}
 */
function getBrandByHost(host) {
    if (!host) return BRAND_MAP[BRAND_MAP.length - 1];

    // Remove port if present
    const hostname = host.split(':')[0];

    for (const entry of BRAND_MAP) {
        if (entry.match === '') continue; // Skip empty match here, handle as last resort

        if (hostname === entry.match || hostname.endsWith(`.${entry.match}`)) {
            console.log(`[BrandDetection] Matched: ${hostname} -> ${entry.brandId} (Bucket: ${entry.bucketName})`);
            return entry;
        }
    }

    const fallback = BRAND_MAP[BRAND_MAP.length - 1];
    console.log(`[BrandDetection] No match for ${hostname}, falling back to: ${fallback.brandId}`);
    return fallback;
}

module.exports = { BRAND_MAP, getBrandByHost };
