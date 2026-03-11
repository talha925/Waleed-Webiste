/**
 * Brand Detection Middleware
 *
 * Resolves the brand from the incoming request's Host / Origin / X-Forwarded-Host
 * headers and attaches `req.brand` for downstream use.
 *
 * Usage in controllers:
 *   const brandId = req.brand?.brandId || 'pennyscroll';
 *
 * This middleware does NOT change any existing logic.
 * It only decorates the request object with brand info.
 */

const { getBrandByHost } = require('../config/brands');
const { getTenantConnection, getCentralConnection } = require('../config/db');
const { getTenantModels, getCentralModels } = require('../models/TenantModels');

/**
 * Brand & Database Detection Middleware
 */
async function brandDetection(req, res, next) {
    try {
        // 1. Resolve Brand from Header or Host FIRST (Needed for DB detection)
        const brandIdFromHeader = req.headers['x-brand-id'];
        let brand;

        if (brandIdFromHeader) {
            const { BRAND_MAP } = require('../config/brands');
            brand = BRAND_MAP.find(b => b.brandId === brandIdFromHeader) || getBrandByHost('');
        } else {
            const host =
                req.headers['x-forwarded-host'] ||
                req.headers.origin?.replace(/^https?:\/\//, '') ||
                req.headers.host ||
                '';
            brand = getBrandByHost(host);
        }

        req.brand = brand;

        // 2. Resolve Tenant Database Connection
        let uri = brand.mongoUri;
        if (!uri) uri = process.env.MONGO_URI;

        if (!uri) {
            console.error(`❌ NO MONGO_URI found for brand: ${brand.brandId}`);
            return res.status(500).json({ error: `Database configuration missing for ${brand.brandId}. Please check Vercel settings.` });
        }

        const tenantConnection = await getTenantConnection(brand.brandId, uri);
        const tenantModels = getTenantModels(tenantConnection);

        // 3. Establish Central Connection Strictly
        const centralConnection = await getCentralConnection();
        const centralModels = getCentralModels(centralConnection);

        // 4. Attach Unified Model Object to the request
        req.db = tenantConnection;
        req.centralDb = centralConnection;

        req.models = {
            ...tenantModels,      // Store, Coupon, Category, etc.
            ...centralModels,     // User, ActivityLog (Keep central models last to ensure User is central)
            brandId: brand.brandId
        };

        next();
    } catch (error) {
        console.error('❌ Brand Detection Error:', error);
        res.status(500).json({
            error: 'Database connection failed',
            details: error.message,
            _performance: {
                totalTime: '0ms',
                breakdown: { database: '0ms', cache: '0ms', processing: '0ms' },
                timestamp: new Date().toISOString()
            }
        });
    }
}

module.exports = brandDetection;


