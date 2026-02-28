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
const { getTenantConnection } = require('../config/db');
// Import a helper that provides models for a given connection
const { getTenantModels } = require('../models/TenantModels');

/**
 * Brand & Database Detection Middleware
 */
async function brandDetection(req, res, next) {
    try {
        // 1. Resolve Brand from Header or Host
        const brandIdFromHeader = req.headers['x-brand-id'];
        let brand;

        if (brandIdFromHeader) {
            // If explicit brand ID provided, find it in the map
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

        // 2. Resolve Database Connection
        // CRITICAL: We now require a brand-specific URI for secondary brands.
        // PennyScroll remains the default fallback only if explicitly configured so.
        let uri = brand.mongoUri;

        // If brand is strictly defined (like blogzenix) but URI is missing, 
        // we should fail fast rather than showing another brand's data.
        if (brand.brandId !== 'pennyscroll' && !uri) {
            console.error(`❌ Missing MONGO_URI for brand: ${brand.brandId}. Check your .env file.`);
            return res.status(500).json({ error: `Configuration missing for ${brand.brandId}` });
        }

        // Fallback to MONGO_URI only for the default brand (pennyscroll)
        if (!uri) uri = process.env.MONGO_URI;

        const connection = await getTenantConnection(brand.brandId, uri);

        // 3. Attach DB-specific Models to the request
        req.db = connection;
        req.models = getTenantModels(connection);
        req.models.brandId = brand.brandId; // Add brandId for service layer access

        next();
    } catch (error) {
        console.error('❌ Brand Detection Error:', error);
        res.status(500).json({ error: 'Database connection failed' });
    }
}

module.exports = brandDetection;

