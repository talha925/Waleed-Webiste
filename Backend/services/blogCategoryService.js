const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');

exports.findAll = async (models, queryParams = {}) => {
    const { BlogCategory, brandId } = models;
    try {
        const { page = 1, limit = 20, sort = 'name' } = queryParams;

        const cacheKey = cacheService.generateKey('blog_categories', { ...queryParams, brandId });
        const cached = await cacheService.get(cacheKey);
        if (cached) return cached;

        const total = await BlogCategory.estimatedDocumentCount();
        const categories = await BlogCategory.find()
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

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
