const mongoose = require('mongoose');
const AppError = require('../errors/AppError');
const { formatCoupon } = require('../utils/couponUtils');
const { getWebSocketServer } = require('../lib/websocket-server');
const cacheService = require('./cacheService');
const { callWithCircuitBreaker } = require('../lib/circuitBreaker');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');

// 🚀 L1 CACHE: For high-traffic store coupons
const L1_CACHE = new Map();
const L1_TTL = 10000; // 10 seconds

// Get all coupons for a specific store with pagination (20 coupons per page)
exports.getCouponsByStore = async (models, queryParams, storeId) => {
  const { Coupon, brandId } = models;
  try {
    const { page = 1, active, isValid = true, featuredForHome } = queryParams;
    if (!mongoose.Types.ObjectId.isValid(storeId)) throw new AppError('Invalid store ID', 400);

    const query = { store: storeId };
    if (active !== undefined) query.active = active === 'true';
    if (featuredForHome !== undefined) query.featuredForHome = featuredForHome === 'true';
    if (isValid !== undefined) query.isValid = isValid === 'true';

    const cacheKey = cacheService.generateKey('store_coupons', { storeId, ...queryParams, brandId });
    
    // 1. Check L1 Cache
    const now = Date.now();
    if (L1_CACHE.has(cacheKey)) {
      const entry = L1_CACHE.get(cacheKey);
      if (now < entry.expiry) return entry.data;
    }

    // 2. Check L2 Cache (Redis)
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      L1_CACHE.set(cacheKey, { data: cached, expiry: now + L1_TTL });
      return cached;
    }

    // Parallelize Count and Data Fetch
    const [coupons, totalCoupons] = await Promise.all([
      Coupon.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip((parseInt(page) - 1) * 20)
        .limit(20)
        .select('-__v')
        .lean(),
      Coupon.countDocuments(query)
    ]);
    const result = {
      coupons,
      totalCoupons,
      totalPages: Math.ceil(totalCoupons / 20),
      currentPage: parseInt(page),
    };

    await cacheService.set(cacheKey, result, 1800);
    return result;
  } catch (error) {
    console.error('Error in couponService.getCouponsByStore:', error);
    throw error;
  }
};

// Get all coupons with pagination (for general coupons list)
exports.getCoupons = async (models, queryParams) => {
  const { Coupon, brandId } = models;
  try {
    const { page = 1, limit = 10, store, active, isValid = true, featuredForHome } = queryParams;
    const query = {};

    if (isValid !== undefined) query.isValid = isValid === 'true';
    else query.isValid = true;

    if (store) query.store = store;
    if (active !== undefined) query.active = active === 'true';
    if (featuredForHome !== undefined) query.featuredForHome = featuredForHome === 'true';

    const cacheKey = cacheService.generateKey('coupons', { ...queryParams, brandId });
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    // Parallelize Count and Data Fetch
    const [coupons, totalCoupons] = await Promise.all([
      Coupon.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .select('offerDetails code active isValid order store featuredForHome hits hits updatedAt createdAt')
        .lean(),
      Coupon.countDocuments(query)
    ]);
    const formattedCoupons = coupons.map(coupon => formatCoupon(coupon));

    const result = {
      coupons: formattedCoupons,
      totalPages: Math.ceil(totalCoupons / parseInt(limit)),
      currentPage: parseInt(page),
      totalCoupons,
    };

    await cacheService.set(cacheKey, result, 1800);
    return result;
  } catch (error) {
    throw error;
  }
};

// Create a new coupon
exports.createCoupon = async (models, couponData) => {
  const { Coupon, Store, brandId } = models;
  try {
    const store = await Store.findById(couponData.store).select('slug');
    if (!store) throw new AppError('Invalid Store ID', 400);

    const newCoupon = await Coupon.create(couponData);

    await Store.findByIdAndUpdate(couponData.store, { $push: { coupons: newCoupon._id } });

    // 🧹 Clear L1 cache AFTER successful DB write
    L1_CACHE.clear();

    const storeId = newCoupon.store.toString();
    const storeSlug = store.slug || storeId;

    // 🚀 AWAIT cache invalidation for instant freshness
    try {
      await cacheService.invalidateCouponCache(null, storeId, brandId);
      await cacheService.invalidateStoreCachesSafely(storeId, brandId);
    } catch (err) {
      console.error(`[Coupon.create] Cache Error: ${err.message}`);
    }

    // Background tasks
    getWebSocketServer().notifyUpdate(models, 'created', 'coupon', newCoupon._id, newCoupon);
    // 🔥 FIX: Pass store SLUG for revalidation, not ObjectId
    callFrontendRevalidation('store', storeSlug, brandId, { action: 'created', couponId: newCoupon._id.toString() }).catch(err => console.error(`[Coupon.create] Revalidation Error: ${err.message}`));

    return newCoupon;
  } catch (error) {
    throw error;
  }
};

// Update a coupon
exports.updateCoupon = async (models, id, updateData) => {
  const { Coupon, Store, brandId } = models;
  try {
    const existingCoupon = await Coupon.findById(id).select('code active store');
    if (!existingCoupon) throw new AppError('Coupon not found', 404);

    if (updateData.active === false) {
      const hasCode = (updateData.code || existingCoupon.code)?.trim().length > 0;
      if (!hasCode) throw new AppError('Cannot set coupon inactive without a code', 400);
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true, runValidators: true });

    // 🧹 Clear L1 cache AFTER successful DB write
    L1_CACHE.clear();

    const storeId = updatedCoupon.store.toString();
    // 🔥 FIX: Fetch store slug for proper revalidation
    const store = await Store.findById(storeId).select('slug').lean();
    const storeSlug = store?.slug || storeId;

    // 🚀 AWAIT cache invalidation
    try {
      await cacheService.invalidateCouponCache(id, storeId, brandId);
      await cacheService.invalidateStoreCachesSafely(storeId, brandId);
    } catch (err) {
      console.error(`[Coupon.update] Cache Error: ${err.message}`);
    }

    // Background tasks
    getWebSocketServer().notifyUpdate(models, 'updated', 'coupon', id, updatedCoupon);
    callFrontendRevalidation('store', storeSlug, brandId, { storeId, updatedFields: Object.keys(updateData) }).catch(err => console.error(`[Coupon.update] Revalidation Error: ${err.message}`));

    return formatCoupon(updatedCoupon);
  } catch (error) {
    throw error;
  }
};

// Delete a coupon
exports.deleteCoupon = async (models, id) => {
  const { Coupon, Store, brandId } = models;
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) throw new AppError('Coupon not found', 404);

    await Store.findByIdAndUpdate(deletedCoupon.store, { $pull: { coupons: deletedCoupon._id } });

    // 🧹 Clear L1 cache AFTER successful DB write
    L1_CACHE.clear();

    const storeId = deletedCoupon.store.toString();
    // 🔥 FIX: Fetch store slug for proper revalidation
    const store = await Store.findById(storeId).select('slug').lean();
    const storeSlug = store?.slug || storeId;

    // 🚀 AWAIT cache invalidation
    try {
      await cacheService.invalidateCouponCache(id, storeId, brandId);
      await cacheService.invalidateStoreCachesSafely(storeId, brandId);
    } catch (err) {
      console.error(`[Coupon.delete] Cache Error: ${err.message}`);
    }

    // Background tasks
    getWebSocketServer().notifyUpdate(models, 'deleted', 'coupon', id, { id });
    callFrontendRevalidation('store', storeSlug, brandId, { action: 'deleted', storeId }).catch(err => console.error(`[Coupon.delete] Revalidation Error: ${err.message}`));

    return deletedCoupon;
  } catch (error) {
    throw error;
  }
};

// Track coupon usage
exports.trackCouponUsage = async (models, couponId) => {
  const { Coupon } = models;
  try {
    if (!mongoose.Types.ObjectId.isValid(couponId)) throw new AppError('Invalid Coupon ID', 400);
    const coupon = await Coupon.findByIdAndUpdate(couponId, { $inc: { hits: 1 }, $set: { lastAccessed: new Date() } }, { new: true });
    if (!coupon) throw new AppError('Coupon not found', 404);
    return formatCoupon(coupon);
  } catch (error) {
    throw error;
  }
};

// Get coupon by ID
exports.getCouponById = async (models, id) => {
  const { Coupon } = models;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Coupon ID', 400);
    const coupon = await Coupon.findById(id).populate({ path: 'store', select: 'name image trackingUrl' }).lean();
    if (!coupon) throw new AppError('Coupon not found', 404);
    return formatCoupon(coupon);
  } catch (error) {
    throw error;
  }
};

// Update the order of coupons for a specific store
exports.updateCouponOrder = async (models, storeId, orderedCouponIds) => {
  const { Coupon, Store, brandId } = models;
  try {
    if (!mongoose.Types.ObjectId.isValid(storeId)) throw new AppError('Invalid store ID', 400);
    if (!Array.isArray(orderedCouponIds) || orderedCouponIds.length === 0) throw new AppError('Ordered coupon IDs array is required', 400);

    const storeExists = await Store.exists({ _id: storeId });
    if (!storeExists) throw new AppError('Store not found', 404);

    const bulkOps = orderedCouponIds.map((couponId, index) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(couponId), store: storeId },
        update: { $set: { order: index, updatedAt: new Date() } },
      }
    }));

    if (bulkOps.length > 0) await Coupon.bulkWrite(bulkOps);

    await Store.findByIdAndUpdate(storeId, { coupons: orderedCouponIds, updatedAt: new Date() });

    // 🧹 Clear L1 cache AFTER successful DB write
    L1_CACHE.clear();

    // 🔥 FIX: Fetch store slug for proper revalidation
    const store = await Store.findById(storeId).select('slug').lean();
    const storeSlug = store?.slug || storeId;

    // AWAIT cache invalidation
    try {
      await cacheService.invalidateStoreCachesSafely(storeId, brandId);
    } catch (err) {
      console.error(`[Coupon.order] Cache Error: ${err.message}`);
    }

    // Background tasks
    getWebSocketServer().notifyUpdate(models, 'updated', 'store', storeId, { event: 'coupon_order_updated' });
    callFrontendRevalidation('store', storeSlug, brandId, { event: 'coupon_order_updated' }).catch(err => console.error(`[Coupon.order] Revalidation Error: ${err.message}`));

    return { message: 'Coupon order updated successfully', totalUpdated: bulkOps.length };
  } catch (error) {
    throw error;
  }
};
