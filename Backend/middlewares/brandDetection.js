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
        // 1. Resolve Brand from Host
        const host =
            req.headers['x-forwarded-host'] ||
            req.headers.origin?.replace(/^https?:\/\//, '') ||
            req.headers.host ||
            '';

        const brand = getBrandByHost(host);
        req.brand = brand;

        // 2. Resolve Database Connection
        // Use brand-specific URI if provided in config, otherwise fallback to default MONGO_URI
        const uri = brand.mongoUri || process.env.MONGO_URI;
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

