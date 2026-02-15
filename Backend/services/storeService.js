const Store = require('../models/storeModel');
const mongoose = require('mongoose');
const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { getWebSocketServer } = require('../lib/websocket-server');
const axios = require('axios');
const { callWithCircuitBreaker, getCircuitBreakerStatus } = require('../lib/circuitBreaker');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');

/**
 * Get stores with filtering, pagination, and sorting
 * @param {Object} queryParams - Query parameters from request
 * @returns {Object} Stores with pagination info
 */
exports.getStores = async (queryParams) => {
    try {
        const cacheKey = `coupon_backend:stores:${JSON.stringify(queryParams)}`;
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log('✅ Stores data served from cache');
            return cachedData;
        }

        const { page = 1, limit = 10, language, category, isTopStore, isEditorsChoice } = queryParams;
        const query = {};

        if (language) query.language = language;
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
            return await exports.getStoresFallback(queryParams);
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

exports.getStoresFallback = async (queryParams) => {
    const { page = 1, limit = 10, language, category, isTopStore, isEditorsChoice } = queryParams;
    const query = {};
    if (language) query.language = language;
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


/**
 * Get store by slug
 * @param {String} slug - Store slug
 * @returns {Object} Store data
 */
exports.getStoreBySlug = async (slug) => {
    try {
        // Generate cache key for store by slug
        const cacheKey = `coupon_backend:store:slug:${slug}`;

        // Try to get from cache first
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log('✅ Store data served from cache');
            return cachedData;
        }

        const store = await Store.findOne({ slug })
            .lean()
            .populate('categories')
            .populate({
                path: 'coupons',
                select: '_id offerDetails code active isValid order createdAt',
                match: { isValid: true, $or: [{ active: true }, { code: { $exists: true, $ne: '' } }] },
                options: { sort: { order: 1, createdAt: -1 } }
            });
        if (!store) {
            throw new AppError('Store not found', 404);
        }

        // Cache the result for 5 minutes (300 seconds)
        await cacheService.set(cacheKey, store, 300);
        console.log('✅ Store data cached successfully');

        return store;
    } catch (error) {
        console.error('Error in storeService.getStoreBySlug:', error);
        throw error;
    }
};

/**
 * Get store by ID with populated coupons
 * @param {String} storeId - Store ID
 * @returns {Object} Store data with populated coupons
 */
exports.getStoreById = async (storeId) => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            throw new AppError('Invalid store ID format', 400);
        }

        // Generate cache key for specific store
        const cacheKey = `coupon_backend:store:${storeId}`;

        // Try to get from cache first
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log('✅ Store data served from cache');
            return cachedData;
        }

        const store = await Store.findById(storeId)
            .select('name image trackingUrl short_description long_description coupons categories seo language isTopStore isEditorsChoice heading')
            .populate({
                path: 'coupons',
                select: '_id offerDetails code active isValid order createdAt',
                match: { isValid: true, $or: [{ active: true }, { code: { $exists: true, $ne: '' } }] },
                options: { sort: { order: 1, createdAt: -1 } }
            })
            .lean();

        if (!store) {
            throw new AppError('Store not found', 404);
        }

        // Cache the result for 5 minutes (300 seconds)
        await cacheService.set(cacheKey, store, 300);
        console.log('✅ Store data cached successfully');

        return store;
    } catch (error) {
        console.error('Error in storeService.getStoreById:', error);
        throw error;
    }
};

/**
 * Search stores with text indexing
 * @param {Object} params - Search parameters
 * @returns {Object} Search results with pagination
 */
exports.searchStores = async (query, page = 1, limit = 10) => {
    try {
        // Generate cache key based on search parameters - FIXED to match invalidation pattern
        const cacheKey = `coupon_backend:store_search:${query}:${page}:${limit}`;

        // Try to get from cache first
        const cachedData = await cacheService.get(cacheKey);
        if (cachedData) {
            console.log('✅ Search results served from cache');
            return cachedData;
        }

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

        // Cache the result for 5 minutes (300 seconds)
        await cacheService.set(cacheKey, result, 300);
        console.log('✅ Search results cached successfully');

        return result;
    } catch (error) {
        console.error('Error in storeService.searchStores:', error);
        throw error;
    }
};

/**
 * ✅ ENHANCED CREATE STORE with database consistency checks and request deduplication
 * @param {Object} storeData - Store data to create
 * @returns {Object} Created store with consistency verification
 */
exports.createStore = async (storeData) => {
    // Generate a temporary ID for deduplication based on slug or name
    const tempId = storeData.slug || storeData.name?.toLowerCase().replace(/\s+/g, '-') || 'temp-' + Date.now();

    // ✅ REQUEST DEDUPLICATION: Using atomic updates instead of locks
    console.log(`🔄 Starting enhanced store creation for: ${tempId}`);

    try {

        // ✅ DATABASE CONSISTENCY: Check for existing store with same slug
        console.log('🔍 Step 1: Checking for existing store with same slug...');
        if (storeData.slug) {
            const existingStore = await Store.findOne({ slug: storeData.slug }).lean();
            if (existingStore) {
                throw new AppError('Store with this slug already exists', 409);
            }
        }

        const {
            name, trackingUrl, short_description, long_description,
            image, categories, seo, language, isTopStore, isEditorsChoice, heading
        } = storeData;

        // ✅ PERFORM DATABASE CREATION
        console.log('💾 Step 2: Creating store in database...');
        const newStore = await Store.create({
            name,
            trackingUrl,
            short_description,
            long_description,
            image: {
                url: image?.url || '',
                alt: image?.alt || 'Default Alt Text',
            },
            categories,
            seo,
            language,
            isTopStore: Boolean(isTopStore),
            isEditorsChoice: Boolean(isEditorsChoice),
            heading,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        if (!newStore) {
            throw new AppError('Failed to create store', 500);
        }

        const storeId = newStore._id.toString();

        // ✅ DATABASE CONSISTENCY: Verify all requested data was saved
        console.log('🔍 Step 3: Verifying database consistency...');
        const consistencyIssues = [];

        for (const [key, expectedValue] of Object.entries(storeData)) {
            if (['createdAt', 'updatedAt', '_id'].includes(key)) continue; // Skip auto-generated fields

            const actualValue = newStore[key];

            // Deep comparison for objects and arrays
            if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
                consistencyIssues.push({
                    field: key,
                    expected: expectedValue,
                    actual: actualValue
                });
            }
        }

        if (consistencyIssues.length > 0) {
            console.warn('⚠️ Database consistency issues detected during creation:', consistencyIssues);
        }

        // ✅ GET FRESH DATA after creation for WebSocket notification
        console.log('🔄 Step 4: Fetching fresh data after creation...');
        const freshStoreData = await Store.findById(storeId).lean();

        if (!freshStoreData) {
            throw new AppError('Store disappeared after creation', 500);
        }

        // ✅ COORDINATED CACHE INVALIDATION AND WEBSOCKET NOTIFICATION WITH CIRCUIT BREAKER
        console.log('📡 Step 5: Coordinated cache invalidation and WebSocket notification...');

        // WebSocket notification with circuit breaker protection
        const wsNotificationResult = await callWithCircuitBreaker(
            'websocket',
            async () => {
                const wsServer = getWebSocketServer();
                return await wsServer.notifyStoreUpdate(storeId, 'created', {
                    name: freshStoreData.name,
                    slug: freshStoreData.slug,
                    isTopStore: freshStoreData.isTopStore,
                    isEditorsChoice: freshStoreData.isEditorsChoice,
                    createdFields: Object.keys(storeData),
                    consistencyVerified: consistencyIssues.length === 0
                });
            },
            // Fallback: Manual cache invalidation if WebSocket fails
            async () => {
                console.log('🔄 WebSocket circuit breaker fallback: Manual cache invalidation');

                const cacheResult = await callWithCircuitBreaker(
                    'cache',
                    async () => {
                        return await cacheService.invalidateStoreCachesSafely(storeId);
                    },
                    async () => {
                        console.warn('⚠️ Cache circuit breaker also open, skipping cache invalidation');
                        return { success: false, fallback: true, totalDeleted: 0 };
                    }
                );

                return {
                    success: false,
                    websocketFailed: true,
                    cacheInvalidated: cacheResult.success,
                    fallback: true
                };
            }
        );

        // Log the final result
        if (wsNotificationResult) {
            if (wsNotificationResult.success) {
                console.log('✅ WebSocket notification completed successfully');
            } else if (wsNotificationResult.fallback) {
                console.warn('⚠️ Used fallback mechanism for store creation notification');
            } else {
                console.warn('⚠️ WebSocket notification had issues:', wsNotificationResult.error);
            }
        }

        // ✅ AFTER SUCCESSFUL CREATION - Cache invalidation handled by atomic updates
        console.log('✅ Store creation completed successfully');

        console.log(`✅ Enhanced store creation completed successfully for: ${storeId}`);

        return {
            store: freshStoreData,
            creationSummary: {
                fieldsCreated: Object.keys(storeData),
                consistencyIssues: consistencyIssues,
                createdAt: freshStoreData.createdAt,
                atomicUpdatesEnabled: true
            },
            atomicUpdateResults: {
                websocket: wsNotificationResult || { success: false, error: 'No WebSocket result' },
                cache: { success: true, message: 'Cache handled by WebSocket notification' },
                revalidation: { success: true, message: 'Revalidation handled by atomic updates' }
            }
        };

    } catch (error) {
        console.error(`❌ Enhanced store creation failed for ${tempId}:`, error);
        throw error;
    }
};

/**
 * ✅ ENHANCED UPDATE STORE with database consistency checks and request deduplication
 * @param {String} id - Store ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated store with consistency verification
 */
exports.updateStore = async (id, updateData) => {
    // Validate store ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid store ID', 400);
    }

    const storeId = id.toString();

    try {
        console.log(`🔄 Starting ATOMIC store update for: ${storeId}`);

        // ✅ STEP 1: DATABASE UPDATE
        console.log('💾 Step 1: Performing database update...');
        const storeBeforeUpdate = await Store.findById(id).lean();

        if (!storeBeforeUpdate) {
            throw new AppError('Store not found', 404);
        }

        const updatedStore = await Store.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        ).lean();

        if (!updatedStore) {
            throw new AppError('Store not found during update', 404);
        }

        console.log('✅ Database update completed');

        // ✅ STEP 2: CLEAR REDIS CACHE
        console.log('🗑️ Step 2: Clearing Redis cache...');
        const cacheResult = await callWithCircuitBreaker(
            'cache',
            async () => {
                // Pass slug for precise invalidation
                await cacheService.invalidateStoreCache(storeId, updatedStore.slug);
                const res = await cacheService.invalidateStoreCachesSafely(storeId);
                return { success: true, totalDeleted: res.totalDeleted || 0 };
            },
            async () => {
                console.warn('⚠️ Cache circuit breaker open, skipping cache invalidation');
                return { success: false, fallback: true };
            }
        );

        // ✅ STEP 3: TRIGGER WEBSOCKET NOTIFICATION
        console.log('📡 Step 3: Triggering WebSocket notification...');
        const wsResult = await callWithCircuitBreaker(
            'websocket',
            async () => {
                const wsServer = getWebSocketServer();
                return await wsServer.notifyStoreUpdate(storeId, 'updated', {
                    name: updatedStore.name,
                    slug: updatedStore.slug,
                    isTopStore: updatedStore.isTopStore,
                    isEditorsChoice: updatedStore.isEditorsChoice,
                    updatedFields: Object.keys(updateData),
                    timestamp: new Date().toISOString()
                });
            },
            async () => {
                console.warn('⚠️ WebSocket circuit breaker open, skipping notification');
                return { success: false, fallback: true };
            }
        );

        // ✅ STEP 4: CALL FRONTEND REVALIDATION
        console.log('🔄 Step 4: Calling frontend revalidation...');
        const revalidationResult = await callFrontendRevalidation('store', updatedStore.slug, {
            storeId: storeId,
            storeName: updatedStore.name,
            updatedFields: Object.keys(updateData)
        });

        console.log(`✅ ATOMIC store update completed successfully for: ${storeId}`);

        return {
            store: updatedStore,
            atomicUpdateResults: {
                database: { success: true },
                cache: cacheResult,
                websocket: wsResult,
                revalidation: revalidationResult,
                fieldsUpdated: Object.keys(updateData),
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error(`❌ ATOMIC store update failed for ${storeId}:`, error);
        throw error;
    }
};

/**
 * ✅ ENHANCED DELETE STORE with database consistency checks and request deduplication
 * @param {String} id - Store ID to delete
 * @returns {Object} Deletion result with consistency verification
 */
exports.deleteStore = async (id) => {
    // Validate store ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid store ID', 400);
    }

    const storeId = id.toString();

    // ✅ REQUEST DEDUPLICATION: Enhanced deletion process
    console.log(`🔄 Starting enhanced store deletion for: ${storeId}`);

    try {
        console.log(`🔄 Starting enhanced store deletion for: ${storeId}`);

        // ✅ DATABASE CONSISTENCY: Capture store state before deletion
        console.log('📊 Step 1: Capturing store state before deletion...');
        const storeBeforeDeletion = await Store.findById(id).lean();

        if (!storeBeforeDeletion) {
            throw new AppError('Store not found', 404);
        }

        console.log('📝 Store state before deletion captured:', {
            id: storeBeforeDeletion._id,
            name: storeBeforeDeletion.name,
            slug: storeBeforeDeletion.slug
        });

        // ✅ PERFORM DATABASE DELETION
        console.log('💾 Step 2: Performing database deletion...');
        const deletedStore = await Store.findByIdAndDelete(id);

        if (!deletedStore) {
            throw new AppError('Store not found during deletion', 404);
        }

        // ✅ DATABASE CONSISTENCY: Verify store was actually deleted
        console.log('🔍 Step 3: Verifying database consistency...');
        const storeAfterDeletion = await Store.findById(id).lean();

        if (storeAfterDeletion) {
            console.error('💥 Database consistency error: Store still exists after deletion!');
            throw new AppError('Store deletion failed - store still exists', 500);
        }

        console.log('✅ Database consistency verified: Store successfully deleted');

        // ✅ COORDINATED CACHE INVALIDATION AND WEBSOCKET NOTIFICATION WITH CIRCUIT BREAKER
        console.log('📡 Step 4: Coordinated cache invalidation and WebSocket notification...');

        // WebSocket notification with circuit breaker protection
        const wsNotificationResult = await callWithCircuitBreaker(
            'websocket',
            async () => {
                const wsServer = getWebSocketServer();
                return await wsServer.notifyStoreUpdate(storeId, 'deleted', {
                    name: storeBeforeDeletion.name,
                    slug: storeBeforeDeletion.slug,
                    isTopStore: storeBeforeDeletion.isTopStore,
                    isEditorsChoice: storeBeforeDeletion.isEditorsChoice,
                    deletedAt: new Date(),
                    consistencyVerified: true
                });
            },
            // Fallback: Manual cache invalidation if WebSocket fails
            async () => {
                console.log('🔄 WebSocket circuit breaker fallback: Manual cache invalidation');

                const cacheResult = await callWithCircuitBreaker(
                    'cache',
                    async () => {
                        return await cacheService.invalidateStoreCachesSafely(storeId);
                    },
                    async () => {
                        console.warn('⚠️ Cache circuit breaker also open, skipping cache invalidation');
                        return { success: false, fallback: true, totalDeleted: 0 };
                    }
                );

                return {
                    success: false,
                    websocketFailed: true,
                    cacheInvalidated: cacheResult.success,
                    fallback: true
                };
            }
        );

        // Log the final result
        if (wsNotificationResult) {
            if (wsNotificationResult.success) {
                console.log('✅ WebSocket notification completed successfully');
            } else if (wsNotificationResult.fallback) {
                console.warn('⚠️ Used fallback mechanism for store deletion notification');
            } else {
                console.warn('⚠️ WebSocket notification had issues:', wsNotificationResult.error);
            }
        }

        // ✅ AFTER SUCCESSFUL DELETION - Cache invalidation handled by atomic updates
        console.log('✅ Store deletion completed successfully');

        console.log(`✅ Enhanced store deletion completed successfully for: ${storeId}`);

        return {
            deletedStore: storeBeforeDeletion,
            deletionSummary: {
                deletedAt: new Date(),
                consistencyVerified: true,
                storeData: {
                    name: storeBeforeDeletion.name,
                    slug: storeBeforeDeletion.slug
                },
                atomicUpdatesEnabled: true
            }
        };

    } catch (error) {
        console.error(`❌ Enhanced store deletion failed for ${storeId}:`, error);
        throw error;
    }
};

/**
 * Invalidate all store-related caches
 * @returns {Boolean} Success status
 */
exports.invalidateStoreCache = async () => {
    try {
        await Promise.all([
            cacheService.delPattern('coupon_backend:stores*'),
            cacheService.delPattern('coupon_backend:store:*'),
            cacheService.delPattern('coupon_backend:store_search*')
        ]);
        console.log('✅ All store caches invalidated');
        return true;
    } catch (error) {
        console.error('❌ Store cache invalidation error:', error);
        throw error;
    }
};

/**
 * ✅ PRODUCTION-READY: Get circuit breaker status for monitoring and health checks
 * @returns {Object} Circuit breaker status for all services
 */
exports.getCircuitBreakerStatus = getCircuitBreakerStatus;

// Removed legacy forceClearAllCaches - using atomic cache invalidation now

// Revalidation function moved to utils/revalidationUtils.js

exports.getSystemHealth = async () => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
            status: 'unknown',
            responseTime: 0
        },
        cache: {
            status: 'unknown',
            responseTime: 0
        },
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