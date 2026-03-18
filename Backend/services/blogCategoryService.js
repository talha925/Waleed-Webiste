const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');

// 🚀 L1 CACHE: In-memory cache to bypass Redis/DB for common lookups
const L1_CACHE = new Map();
const L1_TTL = 60000; // 60 seconds

exports.findAll = async (models, queryParams = {}) => {
    const { BlogCategory, brandId } = models;
    try {
        const { page = 1, limit = 20, sort = 'name' } = queryParams;

        const cacheKey = cacheService.generateKey('blog_categories', { ...queryParams, brandId });

        // 1. Check L1 Cache (Memory)
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

        const isFilterEmpty = Object.keys(queryParams).length === 0;

        // Parallelize Count and Data Fetch
        const [total, categories] = await Promise.all([
            isFilterEmpty ? BlogCategory.estimatedDocumentCount() : BlogCategory.countDocuments({}),
            BlogCategory.find()
                .sort(sort)
                .select('name slug')
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .lean()
        ]);

        const result = {
            categories,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
        };

        await cacheService.set(cacheKey, result, 3600);
        return result;
    } catch (error) {
        throw new AppError('Failed to fetch blog categories', 500);
    }
};

exports.findById = async (models, id) => {
    const { BlogCategory } = models;
    try {
        const category = await BlogCategory.findById(id).lean();
        if (!category) throw new AppError('Blog category not found', 404);
        return category;
    } catch (error) {
        throw error;
    }
};

exports.create = async (models, data) => {
    const { BlogCategory, brandId } = models;
    try {
        const category = await BlogCategory.create(data);
        await cacheService.invalidateBlogCachesSafely(brandId);
        await callFrontendRevalidation('blogCategory', category.slug || category._id, brandId);
        return category;
    } catch (error) {
        if (error.code === 11000) throw new AppError('Category with this name or slug already exists', 400);
        throw error;
    }
};

exports.update = async (models, id, data) => {
    const { BlogCategory, brandId } = models;
    try {
        const category = await BlogCategory.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!category) throw new AppError('Blog category not found', 404);

        await cacheService.invalidateBlogCachesSafely(brandId);
        await callFrontendRevalidation('blogCategory', category.slug || id, brandId);
        return category;
    } catch (error) {
        if (error.code === 11000) throw new AppError('Category with this name or slug already exists', 400);
        throw error;
    }
};

exports.delete = async (models, id) => {
    const { BlogCategory, brandId } = models;
    try {
        const category = await BlogCategory.findByIdAndDelete(id);
        if (!category) throw new AppError('Blog category not found', 404);

        await cacheService.invalidateBlogCachesSafely(brandId);
        await callFrontendRevalidation('blogCategory', category.slug || id, brandId, { action: 'deleted' });
        return null;
    } catch (error) {
        throw error;
    }
};
