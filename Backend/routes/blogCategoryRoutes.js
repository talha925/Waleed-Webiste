// routes/blogCategoryRoutes.js
const express = require('express');
const blogCategoryController = require('../controllers/blogCategoryController');
const validate = require('../middlewares/validationMiddleware');  // Correct import for default export
const { createBlogCategorySchema, updateBlogCategorySchema } = require('../validators/blogCategoryValidator');

const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
    .get(blogCategoryController.getAllCategories)
    .post(
        protect,
        restrictTo('admin', 'super-admin'),
        validate(createBlogCategorySchema),
        blogCategoryController.createCategory
    );

router.route('/:id')
    .get(blogCategoryController.getCategory)
    .put(
        protect,
        restrictTo('admin', 'super-admin'),
        validate(updateBlogCategorySchema),
        blogCategoryController.updateCategory
    )
    .delete(
        protect,
        restrictTo('admin', 'super-admin'),
        blogCategoryController.deleteCategory
    );

module.exports = router;
