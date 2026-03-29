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
// const { performanceMiddleware: performanceMonitoring } = require('./middlewares/performanceMonitoring');
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
// performanceMiddleware.setupQueryMonitoring(); // Disabled for clean logs

// Initialize services AND pre-warm database connections
async function initializeServices() {
    try {
        // 1. Shared services across all brands
        await redisConfig.connect();
        await cacheService.ensureInitialized();
        console.log('✅ Base services (Redis/Cache) initialized');

        // 2. 🔥 Pre-warm Central Connection ONLY
        // We establish the central connection (for Users & Logging) at startup.
        // Tenant-specific DBs will be connected on first request via brandDetection middleware.
        // This prevents slamming the database cluster with 10+ connections simultaneously 
        // during a Vercel cold start.
        const { getCentralConnection } = require('./config/db');
        await getCentralConnection();

        console.log(`✅ Base services & central connection initialized`);
    } catch (error) {
        console.error('❌ Service initialization error:', error);
    }
}

// Initialize services in background to prevent blocking app startup
// Store the promise so brandDetection middleware can await it before handling requests
const initPromise = initializeServices().catch(err => console.error('Background init failure:', err));
app.locals.initPromise = initPromise; // Expose for middleware use

// Note: createFirstSuperAdmin() removed from global startup
// as it requires a specific tenant DB connection.

// Request Logging and Performance Monitoring
// app.use(performanceMonitoring || ((req, res, next) => next())); // Disabled for clean logs
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

// 🔥 WARMUP ENDPOINT: Vercel Cron hits this every 5 min to keep function + DB warm
// Placed BEFORE brand detection so it skips tenant resolution
app.get('/ping', async (req, res) => {
    try {
        // Ensure DB connections are established (critical for preventing cold starts)
        await initPromise;
        const { getCentralConnection } = require('./config/db');
        const conn = await getCentralConnection();
        const isDbReady = conn && conn.readyState === 1;
        res.status(200).json({ 
            status: 'warm', 
            db: isDbReady ? 'connected' : 'connecting',
            redis: redisConfig.isReady() ? 'connected' : 'disconnected',
            ts: Date.now() 
        });
    } catch (err) {
        // Still respond 200 so cron doesn't alert, but log the issue
        console.warn('⚠️ Ping warmup partial failure:', err.message);
        res.status(200).json({ status: 'warming', error: err.message, ts: Date.now() });
    }
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