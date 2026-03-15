const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { getWebSocketServer } = require('../lib/websocket-server');
const { callWithCircuitBreaker, getCircuitBreakerStatus } = require('../lib/circuitBreaker');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');
const mongoose = require('mongoose');

/**
 * Get stores with filtering, pagination, and sorting
 */
exports.getStores = async (models, queryParams) => {
    const { Store, brandId } = models;
    try {
        // Strip cache-busting params before generating cache key
        const { _ts, ...cacheParams } = queryParams;
        const cacheKey = cacheService.generateKey('store', { ...cacheParams, brandId });
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) return cachedData;

        const { page = 1, limit = 10, language = 'English', category, isTopStore, isEditorsChoice } = queryParams;
        const query = { language };

        if (category) query.categories = category;
        if (isTopStore !== undefined) query.isTopStore = isTopStore === 'true';
        if (isEditorsChoice !== undefined) query.isEditorsChoice = isEditorsChoice === 'true';

        const totalStores = (Object.keys(query).length === 1 && query.language === 'English')
            ? await Store.estimatedDocumentCount()
            : await Store.countDocuments(query);

        const stores = await Store.find(query)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate('categories')
            .populate({
                path: 'coupons',
                select: '_id offerDetails code active isValid order featuredForHome hits lastAccessed',
                match: {
                    isValid: true,
                    $or: [
                        { active: true },
                        { code: { $exists: true, $ne: '' } }
                    ]
                },
                options: { sort: { order: 1, createdAt: -1 } }
            })
            .lean();

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
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) return cachedData;

        const store = await Store.findOne({ slug })
            .lean()
            .populate('categories')
            .populate({
                path: 'coupons',
                select: '_id offerDetails code active isValid order createdAt',
                match: { isValid: true, $or: [{ active: true }, { code: { $exists: true, $ne: '' } }] },
                options: { sort: { order: 1, createdAt: -1 } }
            });

        if (!store) throw new AppError('Store not found', 404);

        await cacheService.set(cacheKey, store, cacheService.defaultTTL.store_detail);
        return store;
    } catch (error) {
        console.error('Error in storeService.getStoreBySlug:', error);
        throw error;
    }
};

exports.getStoreById = async (models, storeId) => {
    const { Store, brandId } = models;
    try {
        if (!mongoose.Types.ObjectId.isValid(storeId)) throw new AppError('Invalid store ID format', 400);

        const cacheKey = cacheService.generateKey('store_by_id', { storeId, brandId });
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) return cachedData;

        const store = await Store.findById(storeId)
            .select('name image trackingUrl short_description long_description coupons categories seo language isTopStore isEditorsChoice heading')
            .populate({
                path: 'coupons',
                select: '_id offerDetails code active isValid order createdAt',
                match: { isValid: true, $or: [{ active: true }, { code: { $exists: true, $ne: '' } }] },
                options: { sort: { order: 1, createdAt: -1 } }
            })
            .lean();

        if (!store) throw new AppError('Store not found', 404);

        await cacheService.set(cacheKey, store, 300);
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

        // Use text search for indexed fields
        const searchQuery = {
            $text: { $search: query },
            language: 'English'
        };

        const stores = await Store.find(searchQuery)
            .select({ score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('categories')
            .lean();

        // Fallback or secondary sorting refinement
        if (stores.length === 0) {
            // If text search yields no results (e.g. partial matches), fallback to regex
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedQuery, 'i');
            const regexQuery = {
                $or: [
                    { name: { $regex: regex } },
                    { slug: { $regex: regex } }
                ],
                language: 'English'
            };

            const regexStores = await Store.find(regexQuery)
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .populate('categories')
                .lean();

            stores.push(...regexStores);
        }

        const totalStores = await Store.countDocuments(searchQuery);

        const result = {
            stores,
            totalStores,
            query,
            page: parseInt(page),
            limit: parseInt(limit),
            timestamp: new Date().toISOString()
        };

        await cacheService.set(cacheKey, result, 300);
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

        await cacheService.invalidateStoreCachesSafely(null, brandId);
        getWebSocketServer().notifyUpdate(models, 'created', 'store', storeId, newStore);
        await callFrontendRevalidation('store', newStore.slug || storeId, brandId);

        return newStore;
    } catch (error) {
        throw error;
    }
};

exports.updateStore = async (models, id, updateData) => {
    const { Store, brandId } = models;
    try {
        const updatedStore = await Store.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
        if (!updatedStore) throw new AppError('Store not found', 404);

        await cacheService.invalidateStoreCachesSafely(id, brandId);
        getWebSocketServer().notifyUpdate(models, 'updated', 'store', id, updatedStore);
        await callFrontendRevalidation('store', updatedStore.slug || id, brandId);

        return updatedStore;
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

        await cacheService.invalidateStoreCachesSafely(id, brandId);
        getWebSocketServer().notifyUpdate(models, 'deleted', 'store', id, { id });
        await callFrontendRevalidation('store', store.slug || id, brandId, { action: 'deleted' });

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