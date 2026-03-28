const dns = require('node:dns');

// 🌐 ROOT NETWORK FIX: Use reliable DNS servers (Google + Cloudflare) 
// to prevent 'queryTxt ETIMEOUT' errors caused by unreliable ISP DNS on Windows.
if (dns.setServers) {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
}

// Force IPv4 ordering to avoid IPv6 resolution delays on local machines.
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const dotenv = require('dotenv');
const compression = require('compression');


// Load environment variables BEFORE requiring any other modules
dotenv.config();

const { validateEnv, getConfig } = require('./config/env');
const { getTenantConnection, closeAllConnections, warmupConnection } = require('./config/db');
const helmet = require('helmet');
const errorHandler = require('./middlewares/errorHandler');
const security = require('./middlewares/security');
const requestLogger = require('./middlewares/requestLogger');
const performanceMiddleware = require('./middlewares/performanceMiddleware');
const { performanceMiddleware: performanceMonitoring } = require('./middlewares/performanceMonitoring');
const { createFirstSuperAdmin } = require('./middlewares/authMiddleware');
const redisConfig = require('./config/redis');
const cacheService = require('./services/cacheService');
const { initializeWebSocketServer, shutdownWebSocketServer } = require('./lib/websocket-server');
const { preWarmCache } = require('./services/warmupService');

// Validate environment variables (dotenv.config() already called above)
if (!validateEnv()) {
    console.error('⚠️ Environment validation failed. Application might not function correctly.');
}

// Get configuration
const config = getConfig();

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const couponRoutes = require('./routes/couponRoutes');
const storeRoutes = require('./routes/storeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const blogRoutes = require('./routes/blogRoutes');
const blogCategoryRoutes = require('./routes/blogCategoryRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');

// Create Express app
const app = express();

// 🔥 PROXY FIX: Trust reverse proxies (Vercel, Cloudflare, etc.)
// This is required for express-rate-limit to work correctly.
app.set('trust proxy', 1);

// Setup performance monitoring
performanceMiddleware.setupQueryMonitoring();

// Initialize services AND pre-warm database connections
async function initializeServices() {
    try {
        // 1. Shared services across all brands
        await redisConfig.connect();
        await cacheService.ensureInitialized();
        console.log('✅ Base services (Redis/Cache) initialized');

        // 2. 🔥 PRE-WARM DATABASE: Connect to MongoDB NOW so first API request is instant
        // Without this, the first request waits 30-50s for SRV DNS resolution
        const { BRAND_MAP } = require('./config/brands');
        const brandsToWarm = BRAND_MAP.filter(b => b.mongoUri && b.match !== '');

        // De-duplicate by brandId (multiple hosts can map to same brand)
        const uniqueBrands = [];
        const seenBrands = new Set();
        brandsToWarm.forEach(b => {
            if (!seenBrands.has(b.brandId)) {
                seenBrands.add(b.brandId);
                uniqueBrands.push(b);
            }
        });

        const { getTenantModels } = require('./models/TenantModels');

        // 🔥 Parallel Warmup: Start connecting to all brands simultaneously
        await Promise.all(uniqueBrands.map(async (brand) => {
            try {
                const connection = await getTenantConnection(brand.brandId, brand.mongoUri);
                const models = { ...getTenantModels(connection), brandId: brand.brandId };
                // Cache warming can still run in background
                preWarmCache(models).catch(err => console.error(`Cache warm-up error for ${brand.brandId}:`, err));
            } catch (err) {
                console.error(`⚠️ Database warmup failed for ${brand.brandId}:`, err.message);
            }
        }));

        // 🔥 Pre-warm Central Connection
        const { getCentralConnection } = require('./config/db');
        await getCentralConnection();

        console.log(`✅ Base services & ${uniqueBrands.length} brand connections pre-warmed`);
    } catch (error) {
        console.error('❌ Service initialization error:', error);
    }
}

// Initialize services in background to prevent blocking app startup
// 🚨 CRITICAL: We don't 'await' this so the server starts listening immediately.
initializeServices().catch(err => console.error('Background init failure:', err));

// Note: createFirstSuperAdmin() removed from global startup
// as it requires a specific tenant DB connection.

// Request Logging and Performance Monitoring
app.use(performanceMonitoring || ((req, res, next) => next()));
app.use(performanceMiddleware.requestTimer);
app.use(performanceMiddleware.performanceSummary);
app.use(requestLogger);

// 🔥 PERFORMANCE FIX: Enable response compression (gzip/br)
// This reduces JSON payload size by ~70%, making the site load much faster.
app.use(compression());

// Security Middleware
app.use(helmet());
app.use(security.setSecurityHeaders);
app.use(security.configureCors);

// 🔥 WARMUP ENDPOINT: Ultra-lightweight ping for Vercel Cron to keep function warm
// Placed BEFORE brand detection so it responds instantly without DB connections
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'warm', ts: Date.now() });
});

// Brand Detection — attaches req.brand, req.db, and req.models for multi-brand support
const brandDetection = require('./middlewares/brandDetection');
app.use(brandDetection);

app.use('/api', security.rateLimit());
app.use(express.json({ limit: '10kb' }));
app.use(security.sanitizeData);
app.use(security.preventXSS);
app.use(security.preventParamPollution(['category', 'language', 'isTopStore']));

// Routes

app.get('/', (req, res) => {
    res.json({
        message: 'Multi-Brand Coupon Backend API',
        brand: req.brand?.brandId || 'default',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', performanceMiddleware.healthCheck);

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/blogs', blogRoutes);
app.use(['/api/blogCategories', '/api/blog-categories'], blogCategoryRoutes);
app.use('/monitoring', monitoringRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// Start the server (Only if NOT on Vercel)
if (!process.env.VERCEL) {
    const PORT = config.port;
    const server = app.listen(PORT, '0.0.0.0', async () => {
        console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);

        if (process.env.WS_ENABLED === 'true') {
            try {
                await initializeWebSocketServer(server);
                console.log('🌐 WebSocket server initialized');
            } catch (wsError) {
                console.error('⚠️ WebSocket server failed:', wsError.message);
            }
        }
    });

    /**
     * Graceful Shutdown Handlers
     */
    const gracefulShutdown = async (signal) => {
        console.log(`\n🔄 ${signal} received. Starting graceful shutdown...`);

        server.close(async () => {
            console.log('🛑 HTTP server closed');

            try {
                await shutdownWebSocketServer();
                await redisConfig.disconnect();
                await closeAllConnections();
                console.log('✅ All services shut down successfully');
                process.exit(0);
            } catch (err) {
                console.error('❌ Error during shutdown:', err);
                process.exit(1);
            }
        });

        // Force exit after 20s
        setTimeout(() => {
            console.error('⚠️ Forced shutdown after timeout');
            process.exit(1);
        }, 20000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (err) => {
        console.error('💥 UNCAUGHT EXCEPTION:', err);
        gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (err) => {
        console.error('💥 UNHANDLED REJECTION:', err);
        gracefulShutdown('unhandledRejection');
    });
}

module.exports = app;