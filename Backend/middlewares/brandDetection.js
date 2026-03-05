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
        // 1. Establish Central Connection first (Required for Auth/Users)
        const centralConnection = await getCentralConnection();
        const centralModels = getCentralModels(centralConnection);

        // 2. Resolve Brand from Header or Host
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

        // 3. Resolve Tenant Database Connection
        let uri = brand.mongoUri;

        if (brand.brandId !== 'pennyscroll' && !uri) {
            console.error(`❌ Missing MONGO_URI for brand: ${brand.brandId}`);
            return res.status(500).json({ error: `Configuration missing for ${brand.brandId}` });
        }

        if (!uri) uri = process.env.MONGO_URI;

        const tenantConnection = await getTenantConnection(brand.brandId, uri);
        const tenantModels = getTenantModels(tenantConnection);

        // 4. Attach Unified Model Object to the request
        req.db = tenantConnection;
        req.centralDb = centralConnection;

        req.models = {
            ...tenantModels,      // Store, Coupon, Category, etc.
            ...centralModels,     // User, ActivityLog (Overrides tenant versions if any)
            brandId: brand.brandId
        };

        next();
    } catch (error) {
        console.error('❌ Brand Detection Error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
}

module.exports = brandDetection;

