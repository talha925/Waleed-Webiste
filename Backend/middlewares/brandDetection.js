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
 * 🔥 PERFORMANCE FIX: Added initialization gate + 15s timeout guard
 */
async function brandDetection(req, res, next) {
    const startTime = Date.now();

    try {
        // 🔥 CRITICAL FIX: Wait for background initialization to complete FIRST
        // This prevents the race condition where brandDetection and initializeServices()
        // both try to establish DB connections simultaneously during cold starts.
        if (req.app.locals.initPromise) {
            await req.app.locals.initPromise;
        }

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
        
        // Root Fallback: If specific brand URI is missing, check major environment variables
        if (!uri) {
            uri = process.env.MONGO_URI || 
                  process.env.BLOGZENIX_MONGO_URI || 
                  process.env.PENNYSCROLL_MONGO_URI;
        }

        if (!uri) {
            const host = req.headers['host'] || 'unknown';
            console.error(`❌ NO MONGO_URI found for brand: ${brand.brandId} (Host: ${host})`);
            return res.status(500).json({ 
                error: `Database configuration missing for ${brand.brandId}. Please check Vercel settings.`,
                _debug: { detectedBrand: brand.brandId, host }
            });
        }

        // 🔥 CRITICAL FIX: Add a 15s timeout guard around DB connection establishment
        // This prevents requests from hanging for 100-253 seconds during cold starts
        const DB_CONNECT_TIMEOUT = 15000;
        
        const [tenantConnection, centralConnection] = await Promise.race([
            Promise.all([
                getTenantConnection(brand.brandId, uri),
                getCentralConnection()
            ]),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`DB connection timeout after ${DB_CONNECT_TIMEOUT}ms`)), DB_CONNECT_TIMEOUT)
            )
        ]);

        const tenantModels = getTenantModels(tenantConnection);
        const centralModels = getCentralModels(centralConnection);

        // 3. Attach Unified Model Object to the request
        req.db = tenantConnection;
        req.centralDb = centralConnection;

        req.models = {
            ...tenantModels,      // Store, Coupon, Category, etc.
            ...centralModels,     // User, ActivityLog (Keep central models last to ensure User is central)
            brandId: brand.brandId
        };

        const elapsed = Date.now() - startTime;
        if (elapsed > 2000) {
            console.warn(`⚠️ Brand detection slow: ${elapsed}ms for ${brand.brandId}`);
        }

        next();
    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Brand Detection Error (${elapsed}ms):`, error.message);
        res.status(503).json({
            error: 'Database connection failed. The backend may be starting up - please retry.',
            details: error.message,
            retryAfter: 5
        });
    }
}

module.exports = brandDetection;


