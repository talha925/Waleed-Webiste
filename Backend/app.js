const express = require('express'); // restart 1
const dotenv = require('dotenv');
const { validateEnv, getConfig } = require('./config/env');
const { getTenantConnection, closeAllConnections } = require('./config/db');
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

// Load environment variables
dotenv.config();

// Validate environment variables
if (!validateEnv()) {
    console.error('❌ Environment validation failed. Please check your .env file.');
    process.exit(1);
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

// Setup performance monitoring
performanceMiddleware.setupQueryMonitoring();

// Initialize services
async function initializeServices() {
    try {
        // Shared services across all brands
        await redisConfig.connect();
        await cacheService.ensureInitialized();
        console.log('✅ Base services (Redis/Cache) initialized');
    } catch (error) {
        console.error('❌ Service initialization error:', error);
    }
}

initializeServices();

// Note: createFirstSuperAdmin() removed from global startup
// as it requires a specific tenant DB connection.

// Request Logging and Performance Monitoring
app.use(performanceMonitoring || ((req, res, next) => next()));
app.use(performanceMiddleware.requestTimer);
app.use(performanceMiddleware.performanceSummary);
app.use(requestLogger);

// Security Middleware
app.use(helmet());
app.use(security.setSecurityHeaders);
app.use(security.configureCors);

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

// Start the server
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

module.exports = app;