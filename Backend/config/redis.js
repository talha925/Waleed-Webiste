const redis = require('redis');

/**
 * Redis Configuration and Connection Management
 */
class RedisConfig {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        try {
            // Use REDIS_URL if available, otherwise fallback to individual components
            const options = process.env.REDIS_URL ? {
                url: process.env.REDIS_URL
            } : {
                url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
                password: process.env.REDIS_PASSWORD || undefined,
                database: process.env.REDIS_DB || 0
            };

            // Add socket configuration with better error handling and remote-connection optimizations
            options.socket = {
                connectTimeout: 2000,
                commandTimeout: 2000,
                keepAlive: 5000, // Reuse connection and prevent extra TCP handshakes
                noDelay: true,   // Disable Nagle's algorithm for faster small-packet transmission
                reconnectStrategy: (retries) => {
                    if (retries > 3) return false;
                    return Math.min(retries * 100, 3000);
                }
            };

            // Create Redis client
            this.client = redis.createClient(options);

            // 🔥 CRITICAL: Prevent memory leaks from event listeners
            this.client.setMaxListeners(10);

            // Event handlers with proper error boundaries
            this.client.on('connect', () => {
                console.log('🔗 Redis connecting...');
            });

            this.client.on('ready', () => {
                console.log('✅ Redis connected and ready');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                // Only log once, don't spam - prevent memory leaks from repeated logging
                if (this.isConnected) {
                    console.log('⚠️ Redis connection lost - Running without cache');
                }
                this.isConnected = false;

                // 🔥 CRITICAL: Don't let Redis errors crash the process
                // Errors are handled gracefully by setting isConnected = false
            });

            this.client.on('end', () => {
                this.isConnected = false;
            });

            // 🔥 CRITICAL: Add reconnecting event handler
            this.client.on('reconnecting', () => {
                console.log('🔄 Redis reconnecting...');
            });

            // Try to connect with a short timeout
            await Promise.race([
                this.client.connect(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), 3000)  // 🔥 FIX: Reduced from 6s to 3s
                )
            ]);

        } catch (error) {
            console.log('⚠️ Redis not available - Application will run without caching');
            this.isConnected = false;
            this.client = null;

            // 🔥 CRITICAL: Don't throw errors that could crash the process
            // Return gracefully and let the application continue without cache
        }
    }

    /**
     * Get Redis client instance
     */
    getClient() {
        return this.client;
    }

    /**
     * Check if Redis is connected
     */
    isReady() {
        return this.isConnected && this.client && this.client.isReady;
    }

    /**
     * Gracefully close Redis connection
     */
    async disconnect() {
        if (this.client) {
            try {
                await this.client.quit();
                console.log('✅ Redis connection closed gracefully');
            } catch (error) {
                console.error('❌ Error closing Redis connection:', error);
            }
        }
    }
}

// Export singleton instance
const redisConfig = new RedisConfig();

module.exports = redisConfig;