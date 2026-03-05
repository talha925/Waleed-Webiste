const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Get all coupons for a specific store
router.get('/store/:storeId', couponController.getCouponsByStore);

// Get all coupons
router.get('/', couponController.getCoupons);

// Track coupon usage
router.post('/:couponId/track', couponController.trackCouponUrl);

// Public access to single coupon
router.get('/:id', couponController.getCouponById);

// --- PROTECTED ROUTES (Admin Only) ---
router.use(protect);
router.use(restrictTo('admin', 'super-admin'));

// Create a new coupon
router.post('/', couponController.createCoupon);

// Update coupon by ID
router.put('/:id', couponController.updateCoupon);

// Delete coupon by ID
router.delete('/:id', couponController.deleteCoupon);

// Update coupon order for a store
router.put('/store/:storeId/order', couponController.updateCouponOrder);


module.exports = router;
