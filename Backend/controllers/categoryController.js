const categoryService = require('../services/categoryService');
const AppError = require('../errors/AppError');
const { catchAsync } = require('../utils/errorUtils');

// Get all categories with standardized response
exports.getCategories = catchAsync(async (req, res, next) => {
    const result = await categoryService.getCategories(req.models, req.query);
    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Categories retrieved successfully',
        data: {
            categories: result.categories
        },
        metadata: {
            totalCategories: result.totalCategories,
            currentPage: result.currentPage,
            totalPages: result.totalPages
        }
    });
});

// Create a new category with standardized response
exports.createCategory = catchAsync(async (req, res, next) => {
    const newCategory = await categoryService.createCategory(req.models, req.body);
    res.status(201).json({
        success: true,
        status: 'success',
        message: 'Category created successfully',
        data: newCategory
    });
});

// Get a category by ID with standardized response
exports.getCategoryById = catchAsync(async (req, res, next) => {
    const category = await categoryService.getCategoryById(req.models, req.params.id);
    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Category retrieved successfully',
        data: category
    });
});

// Update a category with standardized response
exports.updateCategory = catchAsync(async (req, res, next) => {
    const updatedCategory = await categoryService.updateCategory(req.models, req.params.id, req.body);
    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Category updated successfully',
        data: updatedCategory
    });
});

// Delete a category with standardized response
exports.deleteCategory = catchAsync(async (req, res, next) => {
    await categoryService.deleteCategory(req.models, req.params.id);
    res.status(200).json({
        success: true,
        status: 'success',
        message: 'Category deleted successfully',
        data: null
    });
});
