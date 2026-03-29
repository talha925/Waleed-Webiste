const mongoose = require('mongoose');
const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');

/**
 * Get all categories with pagination
 * @param {Object} models - Tenant models
 * @param {Object} queryParams - Query parameters
 * @returns {Object} Categories with pagination info
 */
exports.getCategories = async (models, queryParams) => {
    const { Category, brandId } = models;
    try {
        const cacheKey = cacheService.generateKey('categories', { ...queryParams, brandId });
        const cached = await cacheService.get(cacheKey);
        if (cached) return cached;

        const { page = 1, limit = 50, active } = queryParams;
        const query = {};
        if (active !== undefined) query.active = active === 'true';

        const isFilterEmpty = Object.keys(query).length === 0;

        // Parallelize Count and Data Fetch
        const [categories, totalCategories] = await Promise.all([
            Category.find(query)
                .select('name slug')
                .skip((parseInt(page) - 1) * parseInt(limit))
                .limit(parseInt(limit))
                .sort({ name: 1 })
                .lean(),
            isFilterEmpty ? Category.estimatedDocumentCount() : Category.countDocuments(query)
        ]);

        const result = {
            categories,
            totalPages: Math.ceil(totalCategories / parseInt(limit)),
            currentPage: parseInt(page),
            totalCategories
        };

        await cacheService.set(cacheKey, result, 3600);
        return result;
    } catch (error) {
        console.error('Error in categoryService.getCategories:', error);
        throw error;
    }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (models, id) => {
    const { Category } = models;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Category ID', 400);
        const category = await Category.findById(id).lean();
        if (!category) throw new AppError('Category not found', 404);
        return category;
    } catch (error) {
        throw error;
    }
};

/**
 * Create a new category
 */
exports.createCategory = async (models, categoryData) => {
    const { Category, brandId } = models;
    try {
        const { name } = categoryData;
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) throw new AppError('Category with this name already exists', 400);

        const newCategory = await Category.create(categoryData);

        cacheService.invalidateCategoryCachesSafely(brandId).catch(err => console.error(`[Category.create] Cache Error: ${err.message}`));
        callFrontendRevalidation('category', newCategory.slug || newCategory._id, brandId).catch(err => console.error(`[Category.create] Revalidation Error: ${err.message}`));

        return newCategory;
    } catch (error) {
        throw error;
    }
};

/**
 * Update a category
 */
exports.updateCategory = async (models, id, updateData) => {
    const { Category, brandId } = models;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Category ID', 400);

        if (updateData.name) {
            const existingCategory = await Category.findOne({ name: updateData.name, _id: { $ne: id } });
            if (existingCategory) throw new AppError('Category with this name already exists', 400);
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedCategory) throw new AppError('Category not found', 404);

        cacheService.invalidateCategoryCachesSafely(brandId).catch(err => console.error(`[Category.update] Cache Error: ${err.message}`));
        callFrontendRevalidation('category', updatedCategory.slug || updatedCategory._id, brandId).catch(err => console.error(`[Category.update] Revalidation Error: ${err.message}`));

        return updatedCategory;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a category
 */
exports.deleteCategory = async (models, id) => {
    const { Category, brandId } = models;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid Category ID', 400);
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) throw new AppError('Category not found', 404);

        cacheService.invalidateCategoryCachesSafely(brandId).catch(err => console.error(`[Category.delete] Cache Error: ${err.message}`));
        callFrontendRevalidation('category', deletedCategory.slug || deletedCategory._id, brandId, { action: 'deleted' }).catch(err => console.error(`[Category.delete] Revalidation Error: ${err.message}`));

        return deletedCategory;
    } catch (error) {
        throw error;
    }
};