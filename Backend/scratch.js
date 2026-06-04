require('dotenv').config();
const cacheService = require('./services/cacheService');

async function test() {
    try {
        await cacheService.ensureInitialized();
        await cacheService.set('coupon_backend:testpattern:1', 'data1');
        await cacheService.set('coupon_backend:testpattern:2', 'data2');
        
        console.log('Set test keys.');
        const result = await cacheService.delPattern('coupon_backend:testpattern:*');
        console.log(`delPattern deleted ${result} keys.`);
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        if (cacheService.redis) {
            await cacheService.redis.quit();
        }
    }
}
test();
