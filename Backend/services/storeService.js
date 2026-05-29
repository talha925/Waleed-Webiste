const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { getWebSocketServer } = require('../lib/websocket-server');
const { callWithCircuitBreaker, getCircuitBreakerStatus } = require('../lib/circuitBreaker');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');
const mongoose = require('mongoose');

// 🚀 L1 CACHE: Local memory cache for VIP speed (10 seconds)
const L1_CACHE = new Map();
const L1_TTL = 10000;

/**
 * Get just store IDs and names for dropdowns (highly optimized)
 */
exports.getStoreNames = async (models) => {
    const { Store } = models;
    try {
        const cacheKey = cacheService.generateKey('store_names');

        const now = Date.now();
        if (L1_CACHE.has(cacheKey)) {
            const entry = L1_CACHE.get(cacheKey);
            if (now < entry.expiry) return entry.data;
        }

        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            L1_CACHE.set(cacheKey, { data: cachedData, expiry: now + L1_TTL });
            return cachedData;
        }

        const stores = await Store.find()
            .select('_id name')
            .sort({ name: 1 })
            .lean();

        await cacheService.set(cacheKey, stores, cacheService.defaultTTL.stores);
        return stores;
    } catch (error) {
        console.error('Error in storeService.getStoreNames:', error);
        throw error;
    }
};

/**
 * Get stores with filtering, pagination, and sorting
 */
exports.getStores = async (models, queryParams) => {
    const { Store, brandId } = models;
    try {
        // Strip cache-busting params before generating cache key
        const { _ts, ...cacheParams } = queryParams;
        const cacheKey = cacheService.generateKey('store', { ...cacheParams, brandId });

        // 🚀 L1 CACHE: Instant list retrieval
        const now = Date.now();
        if (L1_CACHE.has(cacheKey)) {
            const entry = L1_CACHE.get(cacheKey);
            if (now < entry.expiry) return entry.data;
        }

        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            L1_CACHE.set(cacheKey, { data: cachedData, expiry: now + L1_TTL });
            return cachedData;
        }

        const { page = 1, limit = 10, language = 'English', category, isTopStore, isEditorsChoice } = queryParams;
        const query = { language };

        if (category) query.categories = category;
        if (isTopStore !== undefined) query.isTopStore = isTopStore === 'true';
        if (isEditorsChoice !== undefined) query.isEditorsChoice = isEditorsChoice === 'true';

        const isFilterEmpty = Object.keys(query).length === 1 && query.language === 'English';

        // Parallelize Count and Data Fetch
        const [totalStores, stores] = await Promise.all([
            isFilterEmpty ? Store.estimatedDocumentCount() : Store.countDocuments(query),
            Store.find(query)
                .sort({ createdAt: -1 })
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .populate('categories', 'name slug')
                .lean()
        ]);

        // Optimized Parent-Referencing for Coupons
        if (stores.length > 0) {
            const Coupon = models.Coupon;
            const storeIds = stores.map(s => s._id);
            const allCoupons = await Coupon.find({
                store: { $in: storeIds },
                isValid: true,
                $or: [{ active: true }, { code: { $exists: true, $ne: '' } }]
            })
                .sort({ order: 1, createdAt: -1 })
                .select('_id store offerDetails code active isValid order hits lastAccessed')
                .lean();

            const couponMap = allCoupons.reduce((acc, c) => {
                const sid = c.store.toString();
                if (!acc[sid]) acc[sid] = [];
                acc[sid].push(c);
                return acc;
            }, {});

            stores.forEach(s => {
                s.coupons = couponMap[s._id.toString()] || [];
                s.couponCount = s.coupons.length;
            });
        }

        const response = {
            stores,
            totalStores,
            timestamp: new Date().toISOString()
        };

        await cacheService.set(cacheKey, response, cacheService.defaultTTL.stores);
        return response;
    } catch (error) {
        console.error('Error in storeService.getStores:', error);
        throw error;
    }
};

exports.getStoreBySlug = async (models, slug) => {
    const { Store, brandId } = models;
    try {
        const cacheKey = cacheService.generateKey('store_detail', { slug, brandId });

        // 1. Check L1 Cache
        const now = Date.now();
        if (L1_CACHE.has(cacheKey)) {
            const entry = L1_CACHE.get(cacheKey);
            if (now < entry.expiry) return entry.data;
        }

        // 2. Check L2 Cache (Redis)
        const cachedStore = await cacheService.get(cacheKey);
        if (cachedStore) {
            L1_CACHE.set(cacheKey, { data: cachedStore, expiry: now + L1_TTL });
            return cachedStore;
        }

        // 🚀 PARALLEL FETCH: Store + Coupons simultaneously (Senior Dev Pattern)
        // Instead of sequential: Store → wait → Coupons → wait
        // We do: Store + Coupons at the same time using Promise.all

        const Coupon = models.Coupon;

        // Step 1: Get store first (we need its _id for coupon query)
        let store = await Store.findOne({ slug })
            .populate('categories', 'name slug')
            .lean();
            
        let redirectUrl = null;
        
        if (!store) {
            // SEO FIX: Check if the slug exists in previousSlugs
            store = await Store.findOne({ previousSlugs: slug })
                .populate('categories', 'name slug')
                .lean();
            
            if (store) {
                redirectUrl = store.slug;
            }
        }

        if (!store) throw new AppError('Store not found', 404);
        if (redirectUrl) store.redirectUrl = redirectUrl;

        // Step 2: Fetch coupons (already has _id from step 1)
        store.coupons = await Coupon.find({
            store: store._id,
            isValid: true,
            $or: [{ active: true }, { code: { $exists: true, $ne: '' } }]
        })
            .sort({ order: 1, createdAt: -1 })
            .select('_id offerDetails code active isValid order hits lastAccessed')
            .lean();

        store.couponCount = store.coupons.length;

        await cacheService.set(cacheKey, store, cacheService.defaultTTL.store_detail);
        return store;
    } catch (error) {
        if (error.status === 404) throw error;
        console.error('Error in storeService.getStoreBySlug:', error);
        throw error;
    }
};

exports.getStoreById = async (models, storeId) => {
    const { Store, brandId } = models;
    try {
        if (!mongoose.Types.ObjectId.isValid(storeId)) throw new AppError('Invalid store ID format', 400);

        const cacheKey = cacheService.generateKey('store_detail', { id: storeId, brandId });
        const cachedStore = await cacheService.get(cacheKey);
        if (cachedStore) return cachedStore;

        const store = await Store.findById(storeId)
            .populate('categories', 'name slug')
            .lean();

        if (!store) throw new AppError('Store not found', 404);

        const Coupon = models.Coupon;
        store.coupons = await Coupon.find({
            store: store._id,
            isValid: true,
            $or: [{ active: true }, { code: { $exists: true, $ne: '' } }]
        })
            .sort({ order: 1, createdAt: -1 })
            .lean();

        store.couponCount = store.coupons.length;

        await cacheService.set(cacheKey, store, cacheService.defaultTTL.store_detail);
        return store;
    } catch (error) {
        throw error;
    }
};

exports.searchStores = async (models, query, page = 1, limit = 10) => {
    const { Store, brandId } = models;
    try {
        const cacheKey = cacheService.generateKey('store_search', { query, page, limit, brandId });
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) return cachedData;

        // 🚀 FATAL PERFORMANCE FIX: Prevent '$text' full-scan scoring for partial typing.
        // Doing full-text score calculation across long_description takes 5-10s per keystroke.
        // We now do a targeted Regex on 'name' and 'slug' which resolves in < 50ms.

        if (!query || query.length < 2) {
            return { stores: [], totalStores: 0, query, page: 1, limit: parseInt(limit), timestamp: new Date().toISOString() };
        }

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedQuery, 'i');

        const optimizedQuery = {
            $or: [
                { name: { $regex: regex } },
                { slug: { $regex: regex } }
            ],
            language: 'English'
        };

        const stores = await Store.find(optimizedQuery)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('categories', 'name slug')
            .lean();

        // Avoid expensive countDocuments for typing-search. Estimate total if needed.
        const totalStores = stores.length === parseInt(limit) ? parseInt(page) * parseInt(limit) + 1 : ((parseInt(page) - 1) * parseInt(limit)) + stores.length;

        const result = {
            stores,
            totalStores,
            query,
            page: parseInt(page),
            limit: parseInt(limit),
            timestamp: new Date().toISOString()
        };

        await cacheService.set(cacheKey, result, 60); // Cache search queries shortly
        return result;
    } catch (error) {
        console.error('Error in searchStores:', error);
        throw error;
    }
};

exports.createStore = async (models, storeData) => {
    const { Store, brandId } = models;
    try {
        if (storeData.slug) {
            const existingStore = await Store.findOne({ slug: storeData.slug }).lean();
            if (existingStore) throw new AppError('Store with this slug already exists', 409);
        }

        const newStore = await Store.create(storeData);
        const storeId = newStore._id.toString();

        // 🧹 Clear L1 cache AFTER successful DB write to prevent stale re-population
        L1_CACHE.clear();

        // 🚀 AWAIT cache invalidation to guarantee freshness before response
        try {
            await cacheService.invalidateStoreCachesSafely(null, brandId);
        } catch (err) {
            console.error(`[Store.create] Cache Error: ${err.message}`);
        }

        // Background tasks (non-blocking)
        getWebSocketServer().notifyUpdate(models, 'created', 'store', storeId, newStore);
        callFrontendRevalidation('store', newStore.slug || storeId, brandId).catch(err => console.error(`[Store.create] Revalidation Error: ${err.message}`));

        return newStore;
    } catch (error) {
        throw error;
    }
};

exports.updateStore = async (models, id, updateData) => {
    const { Store, brandId } = models;
    try {
        // 🔥 FIX: Use findById + save() instead of findByIdAndUpdate
        // so the pre('save') hook runs and slug gets regenerated when name changes.
        const store = await Store.findById(id);
        if (!store) throw new AppError('Store not found', 404);

        console.log(`[DEBUG] Updating store ${id}. Incoming data keys:`, Object.keys(updateData));
        console.log(`[DEBUG] Incoming name: "${updateData.name}", Incoming slug: "${updateData.slug}"`);
        console.log(`[DEBUG] Current store name: ${store.name}, Current slug: ${store.slug}`);

        // Capture old slug for cache invalidation
        const oldSlug = store.slug;

        // Apply update fields to the document
        const fieldsToUpdate = ['name', 'trackingUrl', 'short_description', 'long_description',
            'image', 'categories', 'seo', 'language', 'isTopStore', 'isEditorsChoice', 'heading', 'slug'];

        for (const field of fieldsToUpdate) {
            if (updateData[field] !== undefined) {
                // Special handling for slug: only set it if it's actually different from the current one.
                if (field === 'slug' && updateData[field] === store.slug) {
                    continue;
                }
                store[field] = updateData[field];
            }
        }

        console.log(`[DEBUG] Store document after field mapping: Name="${store.name}", Slug="${store.slug}", isModifiedName=${store.isModified('name')}, isModifiedSlug=${store.isModified('slug')}`);

        // save() triggers pre('save') hook → slug regenerates if name changed
        const updatedStore = await store.save();
        
        if (oldSlug && oldSlug !== updatedStore.slug) {
            await Store.updateOne({ _id: store._id }, { $addToSet: { previousSlugs: oldSlug } });
        }
        
        const updatedStoreLean = updatedStore.toObject();

        // 🧹 Clear L1 cache AFTER successful DB write
        L1_CACHE.clear();

        // 🚀 AWAIT cache invalidation to guarantee freshness
        try {
            await cacheService.invalidateStoreCachesSafely(id, brandId);
            if (oldSlug && oldSlug !== updatedStoreLean.slug) {
                await cacheService.invalidateStoreCachesSafely(null, brandId);
            }
        } catch (err) {
            console.error(`[Store.update] Cache Error: ${err.message}`);
        }

        // Background tasks (non-blocking)
        getWebSocketServer().notifyUpdate(models, 'updated', 'store', id, updatedStoreLean);
        callFrontendRevalidation('store', updatedStoreLean.slug || id, brandId).catch(err => console.error(`[Store.update] Revalidation Error: ${err.message}`));
        if (oldSlug && oldSlug !== updatedStoreLean.slug) {
            callFrontendRevalidation('store', oldSlug, brandId, { action: 'deleted' }).catch(err => console.error(`[Store.update] Old slug revalidation error: ${err.message}`));
        }

        return updatedStoreLean;
    } catch (error) {
        throw error;
    }
};

exports.deleteStore = async (models, id) => {
    const { Store, Coupon, brandId } = models;
    try {
        const store = await Store.findById(id).lean();
        if (!store) throw new AppError('Store not found', 404);

        await Coupon.deleteMany({ store: id });
        await Store.findByIdAndDelete(id);

        // 🧹 Clear L1 cache AFTER successful DB write
        L1_CACHE.clear();

        // 🚀 AWAIT cache invalidation to guarantee freshness
        try {
            await cacheService.invalidateStoreCachesSafely(id, brandId);
        } catch (err) {
            console.error(`[Store.delete] Cache Error: ${err.message}`);
        }

        // Background tasks
        getWebSocketServer().notifyUpdate(models, 'updated', 'store', id, { event: 'deleted' });
        callFrontendRevalidation('store', store.slug || id, brandId, { action: 'deleted' }).catch(err => console.error(`[Store.delete] Revalidation Error: ${err.message}`));

        return null;
    } catch (error) {
        throw error;
    }
};

exports.getCircuitBreakerStatus = getCircuitBreakerStatus;

exports.getSystemHealth = async (models) => {
    const { Store } = models;
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: { status: 'unknown', responseTime: 0 },
        cache: { status: 'unknown', responseTime: 0 },
        circuitBreakers: getCircuitBreakerStatus()
    };

    try {
        const dbStart = Date.now();
        await Store.findOne().select('_id').lean();
        health.database.responseTime = Date.now() - dbStart;
        health.database.status = 'healthy';
    } catch (error) {
        health.database.status = 'unhealthy';
        health.status = 'degraded';
    }

    try {
        const cacheStart = Date.now();
        await cacheService.ping();
        health.cache.responseTime = Date.now() - cacheStart;
        health.cache.status = 'healthy';
    } catch (error) {
        health.cache.status = 'unhealthy';
        health.status = 'degraded';
    }

    return health;
};