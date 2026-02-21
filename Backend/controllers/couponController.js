const couponService = require('../services/couponService');
const { updateCouponOrderSchema } = require('../validators/couponValidator');
const AppError = require('../errors/AppError');

// Get all coupons for a specific store
exports.getCouponsByStore = async (req, res, next) => {
  try {
    const result = await couponService.getCouponsByStore(req.models, req.query, req.params.storeId);
    res.status(200).json({
      status: 'success',
      data: result.coupons,
      metadata: {
        totalCoupons: result.totalCoupons,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all coupons
exports.getCoupons = async (req, res, next) => {
  try {
    const result = await couponService.getCoupons(req.models, req.query);
    res.status(200).json({
      status: 'success',
      data: result.coupons,
      metadata: {
        totalCoupons: result.totalCoupons,
        currentPage: result.currentPage,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a new coupon
exports.createCoupon = async (req, res, next) => {
  try {
    const newCoupon = await couponService.createCoupon(req.models, req.body);
    res.status(201).json({ status: 'success', data: newCoupon });
  } catch (error) {
    next(error);
  }
};

// Update a coupon
exports.updateCoupon = async (req, res, next) => {
  try {
    const updatedCoupon = await couponService.updateCoupon(req.models, req.params.id, req.body);
    res.status(200).json({ status: 'success', data: updatedCoupon });
  } catch (error) {
    next(error);
  }
};

// Delete a coupon
exports.deleteCoupon = async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.models, req.params.id);
    res.status(200).json({ status: 'success', message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Track URL hits for a coupon
exports.trackCouponUrl = async (req, res, next) => {
  try {
    const coupon = await couponService.trackCouponUsage(req.models, req.params.couponId);
    res.status(200).json({ status: 'success', data: coupon });
  } catch (error) {
    next(error);
  }
};

// Get a coupon by ID
exports.getCouponById = async (req, res, next) => {
  try {
    const coupon = await couponService.getCouponById(req.models, req.params.id);
    res.status(200).json({ status: 'success', data: coupon });
  } catch (error) {
    next(error);
  }
};

// Update coupon order
exports.updateCouponOrder = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { orderedCouponIds } = req.body;

    const { error } = updateCouponOrderSchema.validate({ orderedCouponIds });
    if (error) return next(new AppError(error.details[0].message, 400));

    const result = await couponService.updateCouponOrder(req.models, storeId, orderedCouponIds);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};
