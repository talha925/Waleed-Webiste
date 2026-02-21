const categoryService = require('../services/categoryService');
const AppError = require('../errors/AppError');

// Get all categories
exports.getCategories = async (req, res, next) => {
    try {
        const result = await categoryService.getCategories(req.models, req.query);
        res.status(200).json({
            status: 'success',
            data: {
                categories: result.categories,
                totalCategories: result.totalCategories,
                currentPage: result.currentPage,
                totalPages: result.totalPages
            }
        });
    } catch (error) {
        next(new AppError(error.message || 'Error fetching categories', error.statusCode || 500));
    }
};

// Create a new category
exports.createCategory = async (req, res, next) => {
    try {
        const newCategory = await categoryService.createCategory(req.models, req.body);
        res.status(201).json({ status: 'success', data: newCategory });
    } catch (error) {
        next(new AppError(error.message || 'Error creating category', error.statusCode || 500));
    }
};

// Get a category by ID
exports.getCategoryById = async (req, res, next) => {
    try {
        const category = await categoryService.getCategoryById(req.models, req.params.id);
        res.status(200).json({ status: 'success', data: category });
    } catch (error) {
        next(new AppError(error.message || 'Error fetching category', error.statusCode || 500));
    }
};

// Update a category
exports.updateCategory = async (req, res, next) => {
    try {
        const updatedCategory = await categoryService.updateCategory(req.models, req.params.id, req.body);
        res.status(200).json({ status: 'success', data: updatedCategory });
    } catch (error) {
        next(new AppError(error.message || 'Error updating category', error.statusCode || 500));
    }
};

// Delete a category
exports.deleteCategory = async (req, res, next) => {
    try {
        await categoryService.deleteCategory(req.models, req.params.id);
        res.status(200).json({ status: 'success', message: 'Category deleted successfully' });
    } catch (error) {
        next(new AppError(error.message || 'Error deleting category', error.statusCode || 500));
    }
};
