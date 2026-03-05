const couponService = require('../services/couponService');
const { updateCouponOrderSchema } = require('../validators/couponValidator');
const AppError = require('../errors/AppError');
const { logActivity } = require('../utils/activityLogger');
const { catchAsync } = require('../utils/errorUtils');


// Get all coupons for a specific store
exports.getCouponsByStore = catchAsync(async (req, res, next) => {
  const result = await couponService.getCouponsByStore(req.models, req.query, req.params.storeId);
  res.status(200).json({
    success: true,
    message: 'Coupons for store retrieved successfully',
    data: result.coupons,
    metadata: {
      totalCoupons: result.totalCoupons,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    },
  });
});

// Get all coupons
exports.getCoupons = catchAsync(async (req, res, next) => {
  const result = await couponService.getCoupons(req.models, req.query);
  res.status(200).json({
    success: true,
    message: 'Coupons retrieved successfully',
    data: result.coupons,
    metadata: {
      totalCoupons: result.totalCoupons,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    },
  });
});

// Create a new coupon
exports.createCoupon = catchAsync(async (req, res, next) => {
  // Add tracking data
  const couponData = {
    ...req.body,
    createdBy: req.user._id,
    createdByName: req.user.name,
    updatedBy: req.user._id,
    updatedByName: req.user.name
  };

  const newCoupon = await couponService.createCoupon(req.models, couponData);

  // Log Activity
  logActivity(req, {
    action: 'CREATE_COUPON',
    targetId: newCoupon._id,
    targetName: newCoupon.offerDetails,
    details: `Coupon created for store ID: ${newCoupon.store}`
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: newCoupon
  });
});

// Update a coupon
exports.updateCoupon = catchAsync(async (req, res, next) => {
  // Add tracking data
  const updateData = {
    ...req.body,
    updatedBy: req.user._id,
    updatedByName: req.user.name
  };

  const updatedCoupon = await couponService.updateCoupon(req.models, req.params.id, updateData);

  // Log Activity
  logActivity(req, {
    action: 'UPDATE_COUPON',
    targetId: updatedCoupon._id,
    targetName: updatedCoupon.offerDetails,
    details: `Coupon updated.`
  });

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: updatedCoupon
  });
});

// Delete a coupon
exports.deleteCoupon = catchAsync(async (req, res, next) => {
  const coupon = await couponService.getCouponById(req.models, req.params.id);
  await couponService.deleteCoupon(req.models, req.params.id);

  // Log Activity
  if (coupon) {
    logActivity(req, {
      action: 'DELETE_COUPON',
      targetId: coupon._id,
      targetName: coupon.offerDetails,
      details: `Coupon deleted.`
    });
  }

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully',
    data: null
  });
});

// Track URL hits for a coupon
exports.trackCouponUrl = catchAsync(async (req, res, next) => {
  const coupon = await couponService.trackCouponUsage(req.models, req.params.couponId);
  res.status(200).json({
    success: true,
    message: 'Coupon click tracked',
    data: coupon
  });
});

// Get a coupon by ID
exports.getCouponById = catchAsync(async (req, res, next) => {
  const coupon = await couponService.getCouponById(req.models, req.params.id);
  res.status(200).json({
    success: true,
    message: 'Coupon retrieved successfully',
    data: coupon
  });
});

// Update coupon order
exports.updateCouponOrder = catchAsync(async (req, res, next) => {
  const { storeId } = req.params;
  const { orderedCouponIds } = req.body;

  const { error } = updateCouponOrderSchema.validate({ orderedCouponIds });
  if (error) return next(new AppError(error.details[0].message, 400));

  const result = await couponService.updateCouponOrder(req.models, storeId, orderedCouponIds);
  res.status(200).json({
    success: true,
    message: 'Coupon order updated successfully',
    data: result
  });
});
