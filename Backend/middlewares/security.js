/**
 * Security middleware collection
 * Configure and export security-related middleware
 */

const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const sanitizeHtml = require('sanitize-html');
const hpp = require('hpp');

/**
 * Express rate limiter to prevent brute force attacks
 */
const rateLimiter = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || (process.env.NODE_ENV === 'development' ? 2000 : 300), // Increased for dev/prod stability
        message: 'Too many requests from this IP, please try again after 15 minutes',
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        ...options
    });
};

/**
 * Data sanitization against NoSQL query injection
 */
const sanitizeData = mongoSanitize();

/**
 * Data sanitization against XSS using sanitize-html
 */
const preventXSS = (req, res, next) => {
    const sanitize = (obj) => {
        if (!obj) return;
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeHtml(obj[key], {
                    allowedTags: [],
                    allowedAttributes: {}
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitize(obj[key]);
            }
        }
    };
    
    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);
    
    next();
};

/**
 * Prevent parameter pollution
 */
const preventParamPollution = (whitelist = []) => {
    return hpp({ whitelist });
};

/**
 * Set secure HTTP headers
 */
const setSecurityHeaders = (req, res, next) => {
    // Set security-related headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
};

/**
 * Apply CORS settings
 */
const configureCors = (req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'https://www.blogzenix.com', 'https://pennyscroll.com'];

    const origin = req.headers.origin;

    // Check if the origin is allowed or if it's development
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (!origin) {
        // For server-to-server or non-browser requests
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,x-brand-id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
};

module.exports = {
    rateLimit: rateLimiter,
    sanitizeData,
    preventXSS,
    preventParamPollution,
    setSecurityHeaders,
    configureCors
};