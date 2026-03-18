/**
 * Security middleware collection
 * Configure and export security-related middleware
 */

const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * Express rate limiter to prevent brute force attacks
 */
const rateLimiter = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes default
        max: options.max || (process.env.NODE_ENV === 'development' ? 2000 : 300), // Increased for dev/prod stability
        message: 'Too many requests from this IP, please try again after 15 minutes',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        ...options
    });
};

/**
 * Data sanitization against NoSQL query injection
 */
const sanitizeData = mongoSanitize();

/**
 * Data sanitization against XSS
 */
const preventXSS = xss();

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