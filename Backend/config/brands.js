/**
 * Multi-Brand Configuration System (Generic & Scalable)
 *
 * Supports unlimited brands without code changes:
 * 1. Dedicated Service Mode: Set BRAND_ID (e.g. BRAND_ID=specreveal) in environment.
 * 2. Shared Service Mode: Resolves brand from incoming Hostname / Origin / x-brand-id header.
 * 3. Fallback Mode: Uses standard environment variables (MONGO_URI, AWS_BUCKET_NAME, etc.)
 */

/**
 * Static mapping of registered custom domains (for shared backend routing)
 */
const BRAND_MAP = [
    {
        match: 'localhost',
        brandId: 'blogzenix',
        mongoUri: process.env.BLOGZENIX_MONGO_URI || process.env.MONGO_URI || null,
        bucketName: process.env.BLOGZENIX_S3_BUCKET || process.env.AWS_BUCKET_NAME,
        cdnDomain: process.env.BLOGZENIX_CDN_DOMAIN || process.env.CDN_DOMAIN || null,
    },
    {
        match: '127.0.0.1',
        brandId: 'blogzenix',
        mongoUri: process.env.BLOGZENIX_MONGO_URI || process.env.MONGO_URI || null,
        bucketName: process.env.BLOGZENIX_S3_BUCKET || process.env.AWS_BUCKET_NAME,
        cdnDomain: process.env.BLOGZENIX_CDN_DOMAIN || process.env.CDN_DOMAIN || null,
    },
    {
        match: 'blogzenix.com',
        brandId: 'blogzenix',
        mongoUri: process.env.BLOGZENIX_MONGO_URI || process.env.MONGO_URI || null,
        bucketName: process.env.BLOGZENIX_S3_BUCKET || process.env.AWS_BUCKET_NAME,
        cdnDomain: process.env.BLOGZENIX_CDN_DOMAIN || process.env.CDN_DOMAIN || null,
    },
    {
        match: 'pennyscroll.com',
        brandId: 'pennyscroll',
        mongoUri: process.env.PENNYSCROLL_MONGO_URI || process.env.MONGO_URI || null,
        bucketName: process.env.PENNYSCROLL_S3_BUCKET || process.env.AWS_BUCKET_NAME,
        cdnDomain: process.env.PENNYSCROLL_CDN_DOMAIN || process.env.CDN_DOMAIN || null,
    },
    {
        match: 'specreveal.com',
        brandId: 'specreveal',
        mongoUri: process.env.SPECREVEAL_MONGO_URI || process.env.MONGO_URI || null,
        bucketName: process.env.SPECREVEAL_S3_BUCKET || process.env.AWS_BUCKET_NAME,
        cdnDomain: process.env.SPECREVEAL_CDN_DOMAIN || process.env.CDN_DOMAIN || null,
    },
    {
        match: 'trendfiltered.com',
        brandId: 'trendfiltered',
        mongoUri: process.env.TRENDFILTERED_MONGO_URI || process.env.MONGO_URI || null,
        bucketName: process.env.TRENDFILTERED_S3_BUCKET || process.env.AWS_BUCKET_NAME,
        cdnDomain: process.env.TRENDFILTERED_CDN_DOMAIN || process.env.CDN_DOMAIN || null,
    },
];

/**
 * Dynamically builds a brand config object from brandId and environment variables.
 * Format convention: [BRAND]_MONGO_URI, [BRAND]_S3_BUCKET, [BRAND]_CDN_DOMAIN
 * Falls back to generic standard variables (MONGO_URI, AWS_BUCKET_NAME, CDN_DOMAIN).
 *
 * @param {string} brandId - e.g. "specreveal", "blogzenix", "coupondeal"
 * @returns {{ brandId: string, mongoUri: string|null, bucketName: string|null, cdnDomain: string|null }}
 */
function createBrandConfig(brandId) {
    const cleanId = (brandId || 'default').toLowerCase().trim();
    const prefix = cleanId.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    return {
        brandId: cleanId,
        mongoUri: process.env[`${prefix}_MONGO_URI`] || process.env.MONGO_URI || null,
        bucketName: process.env[`${prefix}_S3_BUCKET`] || process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET || null,
        cdnDomain: process.env[`${prefix}_CDN_DOMAIN`] || process.env.CDN_DOMAIN || null,
    };
}

/**
 * Resolves brand configuration by brand ID string (e.g. from x-brand-id header).
 * @param {string} brandId 
 */
function getBrandById(brandId) {
    if (!brandId) return getBrandByHost('');
    const matched = BRAND_MAP.find(b => b.brandId.toLowerCase() === brandId.toLowerCase().trim());
    return matched || createBrandConfig(brandId);
}

/**
 * Resolves brand configuration from request hostname or server environment.
 * @param {string} host - The request hostname (e.g. "www.specreveal.com", "specreveal-backend.onrender.com")
 * @returns {{ brandId: string, mongoUri: string|null, bucketName: string|null, cdnDomain: string|null }}
 */
function getBrandByHost(host) {
    // 1. Dedicated Instance Mode: If BRAND_ID / APP_BRAND_ID is configured in environment, use it directly
    const envBrand = process.env.BRAND_ID || process.env.APP_BRAND_ID;
    if (envBrand) {
        return getBrandById(envBrand);
    }

    if (!host) {
        return createBrandConfig('default');
    }

    const hostname = host.split(':')[0].toLowerCase();

    // 2. Check Static Domain Map (Strict match or Subdomain match)
    for (const entry of BRAND_MAP) {
        if (hostname === entry.match || hostname.endsWith(`.${entry.match}`)) {
            return entry;
        }
    }

    // 3. Dynamic Cloud Host Match (Matches [brand]-backend.vercel.app or [brand]-backend.onrender.com)
    for (const entry of BRAND_MAP) {
        if (hostname.includes(entry.brandId)) {
            return entry;
        }
    }

    // 4. Extract Brand prefix dynamically from hostname if pattern is [brand]-* or [brand].*
    const dynamicBrandCandidate = hostname.split('.')[0].replace(/-backend$/, '');
    if (dynamicBrandCandidate && dynamicBrandCandidate !== 'localhost') {
        const dynamicConfig = createBrandConfig(dynamicBrandCandidate);
        if (dynamicConfig.mongoUri) {
            return dynamicConfig;
        }
    }

    // 5. Generic Fallback
    return createBrandConfig('default');
}

module.exports = { 
    BRAND_MAP, 
    createBrandConfig, 
    getBrandById, 
    getBrandByHost 
};
