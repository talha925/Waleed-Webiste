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
        const cacheKey = cacheService.generateKey('store', { ...queryParams, brandId });
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) return cachedData;

        const { page = 1, limit = 10, language = 'English', category, isTopStore, isEditorsChoice } = queryParams;
        const query = { language };

        if (category) query.categories = category;
        if (isTopStore !== undefined) query.isTopStore = isTopStore === 'true';
        if (isEditorsChoice !== undefined) query.isEditorsChoice = isEditorsChoice === 'true';

        const aggregation = [
            { $match: query },
            {
                $facet: {
                    stores: [
                        { $sort: { createdAt: -1 } },
                        { $skip: (parseInt(page) - 1) * parseInt(limit) },
                        { $limit: parseInt(limit) },
                        {
                            $lookup: {
                                from: 'categories',
                                localField: 'categories',
                                foreignField: '_id',
                                as: 'categories'
                            }
                        },
                        {
                            $lookup: {
                                from: 'coupons',
                                let: { storeId: '$_id' },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ['$store', '$$storeId'] },
                                            isValid: true,
                                            $or: [
                                                { active: true },
                                                { code: { $exists: true, $ne: '' } }
                                            ]
                                        }
                                    },
                                    { $sort: { order: 1, createdAt: -1 } },
                                    {
                                        $project: {
                                            _id: 1,
                                            offerDetails: 1,
                                            code: 1,
                                            active: 1,
                                            isValid: 1,
                                            order: 1,
                                            featuredForHome: 1,
                                            hits: 1,
                                            lastAccessed: 1
                                        }
                                    }
                                ],
                                as: 'coupons'
                            }
                        }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ];

        let result;
        try {
            result = await Store.aggregate(aggregation).exec();
        } catch (aggregationError) {
            console.error('❌ Aggregation failed, falling back to find:', aggregationError);
            return await exports.getStoresFallback(models, queryParams);
        }
        const stores = result[0]?.stores || [];
        const totalStores = result[0]?.totalCount[0]?.count || 0;

        const response = {
            stores,
            totalStores,
            timestamp: new Date().toISOString()
        };

        await cacheService.set(cacheKey, response, 300);
        return response;
    } catch (error) {
        console.error('Error in storeService.getStores:', error);
        throw error;
    }
};

exports.getStoresFallback = async (models, queryParams) => {
    const { Store, brandId } = models;
    const { page = 1, limit = 10, language = 'English', category, isTopStore, isEditorsChoice } = queryParams;
    const query = { language };
    if (category) query.categories = category;
    if (isTopStore !== undefined) query.isTopStore = isTopStore === 'true';
    if (isEditorsChoice !== undefined) query.isEditorsChoice = isEditorsChoice === 'true';

    const stores = await Store.find(query)
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate('categories')
        .populate({
            path: 'coupons',
            select: '_id offerDetails code active isValid featuredForHome hits lastAccessed order',
            match: { isValid: true, $or: [{ active: true }, { code: { $exists: true, $ne: '' } }] },
            options: { sort: { order: 1, createdAt: -1 } }
        })
        .lean();

    const totalStores = await Store.countDocuments(query);

    return {
        stores,
        totalStores,
        timestamp: new Date().toISOString()
    };
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

        await cacheService.set(cacheKey, store, 300);
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

        const searchQuery = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { short_description: { $regex: query, $options: 'i' } }
            ]
        };

        const stores = await Store.find(searchQuery)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('categories')
            .lean();

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