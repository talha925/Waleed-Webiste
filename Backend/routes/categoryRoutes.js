const express = require('express');
const {
    getCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const validator = require('../middlewares/validator');
const { createCategorySchema, updateCategorySchema } = require('../validators/categoryValidator');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all categories
router.get('/', getCategories);

// Get category by ID
router.get('/:id', getCategoryById);

// --- PROTECTED ROUTES (Admin Only) ---
router.use(protect);
router.use(restrictTo('admin', 'super-admin'));

// Create a new category with validation
router.post('/', validator(createCategorySchema), createCategory);

// Update category by ID with validation
router.put('/:id', validator(updateCategorySchema), updateCategory);

// Delete category by ID
router.delete('/:id', deleteCategory);

module.exports = router;
