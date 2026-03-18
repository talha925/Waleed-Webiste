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

        // 2. Homepage Featured Blogs (Handpicked Stories)
        // 🔥 CRITICAL: Must match the frontend's query exactly to avoid Cache MISS
        // Frontend URL: GET /api/blogs?page=1&limit=9&isFeaturedForHome=true
        await blogService.findAll(models, {
            page: '1',
            limit: '9',
            isFeaturedForHome: 'true'
        });

        // 2b. Also warm up with sort if needed
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

        // 6. 🔥 DYNAMIC VIP STORES (Ad Landing Pages / Top Stores)
        // Root Fix: Warm up by database flags instead of hardcoding slugs.
        // This ensures the top 50 most important stores are always in memory.
        const Store = models.Store;
        const vipStores = await Store.find({ 
            $or: [
                { isTopStore: true }, 
                { isEditorsChoice: true }
            ] 
        })
        .sort({ updatedAt: -1 })
        .limit(50)
        .select('slug')
        .lean();

        if (vipStores && vipStores.length > 0) {
            console.log(`🚀 Warming up ${vipStores.length} VIP Stores...`);
            for (const store of vipStores) {
                try {
                    await storeService.getStoreBySlug(models, store.slug);
                } catch (e) {
                    // Fail silently for individual stores
                }
            }
        } else {
            // Fallback: Warm up 20 most recent stores if no flags are set
            const recentStores = await Store.find({ language: 'English' })
                .sort({ createdAt: -1 })
                .limit(20)
                .select('slug')
                .lean();
            
            for (const store of recentStores) {
                try {
                    await storeService.getStoreBySlug(models, store.slug);
                } catch (e) {}
            }
        }

        console.log(`✅ Cache warmed up for [${brandId}]`);
    } catch (err) {
        console.error(`⚠️ Cache warming failed for [${brandId}]:`, err.message);
    }
}

module.exports = { preWarmCache };
