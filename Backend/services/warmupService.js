const blogCategoryService = require('./blogCategoryService');
const blogService = require('./blogService');
const storeService = require('./storeService');

/**
 * Pre-warm commonly accessed data into Redis/Memory cache
 * 
 * CRITICAL: The query params here MUST exactly match the params
 * that the Frontend (serverData.ts) sends via API requests.
 * 
 * When Frontend hits /api/blogs?isFeaturedForHome=true&sort=-createdAt&limit=9
 * Express parses it as: req.query = { isFeaturedForHome: 'true', sort: '-createdAt', limit: '9' }
 * All values are STRINGS. The cache key is built from these string values.
 * So warmup must also use STRING values to produce identical cache keys.
 */
async function preWarmCache(models) {
    const brandId = models.brandId;
    console.log(`🔥 Pre-warming cache for brand: ${brandId}...`);

    try {
        // 1. Blog Categories
        //    Frontend: GET /api/blog-categories (no params → key = 'all')
        await blogCategoryService.findAll(models, {});

        // 2. Homepage Featured Blogs
        //    Frontend: GET /api/blogs?isFeaturedForHome=true&sort=-createdAt&limit=9
        await blogService.findAll(models, {
            isFeaturedForHome: 'true',
            sort: '-createdAt',
            limit: '9'
        });

        // 3. Homepage Banner Blogs
        //    Frontend: GET /api/blogs?frontBanner=true&sort=-createdAt&limit=3
        await blogService.findAll(models, {
            frontBanner: 'true',
            sort: '-createdAt',
            limit: '3'
        });

        // 4. Blog Index Page (first page)
        //    Frontend: GET /api/blogs?page=1&limit=9&status=published
        await blogService.findAll(models, {
            page: '1',
            limit: '9',
            status: 'published'
        });

        // 5. Top Stores
        //    Frontend: GET /api/stores?limit=50&page=1
        await storeService.getStores(models, {
            page: '1',
            limit: '50'
        });

        console.log(`✅ Cache warmed up for [${brandId}]`);
    } catch (err) {
        console.error(`⚠️ Cache warming failed for [${brandId}]:`, err.message);
    }
}

module.exports = { preWarmCache };
