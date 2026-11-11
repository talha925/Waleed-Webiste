/**
 * AdVisit Routes
 *
 * Dedicated endpoint for visitor tracking snapshots and fraud detection beacons.
 * Path: POST /api/ad-visit
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    recordAdVisit,
    getAdminStats,
    getAdminVisits,
    getAdminClusters,
    exportAdminCsv
} = require('../controllers/adVisitController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { BRAND_MAP } = require('../config/brands');

const router = express.Router();

/**
 * Dedicated Rate Limiter for AdVisit Endpoint
 * Limits: 60 requests per minute per IP.
 */
const adVisitLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    message: { error: 'Too many tracking requests from this IP. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (
            req.headers['cf-connecting-ip'] ||
            req.ip ||
            req.connection?.remoteAddress ||
            '127.0.0.1'
        );
    }
});

/**
 * Brand-specific CORS for /api/ad-visit
 * Whitelists registered brand domains and rejects wildcard '*'
 */
const adVisitCors = (req, res, next) => {
    const origin = req.headers.origin;

    // Collect allowed brand domains from BRAND_MAP and env
    const allowedDomains = new Set([
        'https://www.pennyscroll.com',
        'https://pennyscroll.com',
        'https://www.specreveal.com',
        'https://specreveal.com',
        'https://www.blogzenix.com',
        'https://blogzenix.com',
        'https://www.trendfiltered.com',
        'https://trendfiltered.com',
        'http://localhost:3000',
        'http://localhost:3001'
    ]);

    // Add extra origins from environment if configured
    if (process.env.ALLOWED_ORIGINS) {
        process.env.ALLOWED_ORIGINS.split(',').forEach(o => allowedDomains.add(o.trim()));
    }

    if (origin && allowedDomains.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, x-brand-id');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
        if (!origin || !allowedDomains.has(origin)) {
            return res.status(403).json({ error: 'Origin not allowed' });
        }
        return res.status(200).end();
    }

    // Reject non-POST methods
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Only POST is accepted.' });
    }

    next();
};

/**
 * Text parser strictly for /api/ad-visit (20KB limit, text/plain or json)
 */
const adVisitBodyParser = express.text({
    type: ['text/plain', 'application/json', 'text/*'],
    limit: '20kb'
});

/**
 * 🔐 Super-Admin Only Routes
 * Strict access control: Requires valid JWT and super-admin role.
 */
router.get('/admin/stats', protect, restrictTo('super-admin'), getAdminStats);
router.get('/admin/visits', protect, restrictTo('super-admin'), getAdminVisits);
router.get('/admin/clusters', protect, restrictTo('super-admin'), getAdminClusters);
router.get('/admin/export-csv', protect, restrictTo('super-admin'), exportAdminCsv);

// Route definition (matches both /api/ad-visit and /api/ad-visit/)
router.all(['/', ''], adVisitCors, adVisitLimiter, adVisitBodyParser, recordAdVisit);

module.exports = router;

