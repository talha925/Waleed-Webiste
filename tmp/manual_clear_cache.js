const path = require('path');
const dotenv = require('dotenv');

// Load .env from Backend folder
dotenv.config({ path: path.resolve(__dirname, '../Backend/.env') });

const redisConfig = require('../Backend/config/redis');
const cacheService = require('../Backend/services/cacheService');

async function clear() {
    console.log('🧹 Manual cache purging starting...');
    try {
        // Initialize Redis connection (Singleton)
        console.log('🔗 Connecting to Redis...');
        await redisConfig.connect();
        
        await cacheService.ensureInitialized();
        const status = cacheService.getStatus();
        console.log('📡 Cache Service Status:', status);

        if (!status.redisAvailable) {
            console.error('❌ Redis is not available. Please check environment variables/connection.');
            process.exit(1);
        }

        console.log('🚨 Purging all coupon_backend:* keys...');
        const count = await cacheService.invalidateAllCaches();
        console.log(`✅ COMPLETE! Deleted ${count} stale entries.`);
        
        await redisConfig.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('💥 Crash during cache purge:', err);
        process.exit(1);
    }
}

clear();
