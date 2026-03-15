const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const blogValidator = require('../validators/blogValidator');

// Public routes - no authentication middleware
router.get('/', blogController.getBlogs);
router.get('/search', blogController.searchBlogs);
router.get('/:id', blogController.getBlogById);
router.get('/:id/related', blogController.getRelatedPosts);

// Protected routes - admin/super-admin only for now
router.use(protect);
router.use(restrictTo('admin', 'super-admin'));

// Routes for content management
router.route('/')
  .post(
    validate(blogValidator.createBlogSchema),
    blogController.createBlog
  );

router.route('/:id')
  .put(
    validate(blogValidator.updateBlogSchema),
    blogController.updateBlog
  )
  .delete(blogController.deleteBlog);

router.patch(
  '/:id/engagement',
  validate(blogValidator.updateEngagementSchema),
  blogController.updateEngagement
);

module.exports = router;
