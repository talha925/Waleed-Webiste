const path = require('path');
const dotenv = require('dotenv');

// Load .env relative to Backend folder
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const redisConfig = require('./config/redis');
const cacheService = require('./services/cacheService');

async function clear() {
    console.log('🧹 Manual cache purging starting from Backend folder...');
    try {
        // Initialize Redis connection
        await redisConfig.connect();
        
        await cacheService.ensureInitialized();
        const status = cacheService.getStatus();
        console.log('📡 Cache Service Status:', status);

        if (!status.redisAvailable) {
            console.error('❌ Redis is NOT available in this environment.');
            process.exit(1);
        }

        console.log('🚨 Purging all *:coupon_backend:* keys...');
        const count = await cacheService.delPattern('*:coupon_backend:*');
        console.log(`✅ COMPLETE! Deleted ${count} entries.`);
        
        await redisConfig.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('💥 Crash during purge:', err);
        process.exit(1);
    }
}

clear();
