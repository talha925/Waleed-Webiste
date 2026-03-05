const express = require('express');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register); // Moved here for testing
router.get('/admins', authController.getAllAdmins); // Moved here for testing
router.patch('/admins/:id', authController.updateUserAdmin); // Moved here for testing
router.get('/user-performance', authController.getUserPerformance); // Moved here for testing
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes (require authentication)
router.use(protect);

router.get('/me', authController.getMe);
router.patch('/update-me', authController.updateMe);
router.patch('/update-password', authController.updatePassword);
router.delete('/delete-me', authController.deleteMe);

// Admin-only routes
router.use(restrictTo('admin', 'super-admin'));

// Super-admin-only routes (Temporarily moved to public section for testing bypass login)

module.exports = router;