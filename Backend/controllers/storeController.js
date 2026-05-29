const storeService = require('../services/storeService');
const AppError = require('../errors/AppError');
const { catchAsync } = require('../utils/errorUtils');
const { logActivity } = require('../utils/activityLogger');


const htmlDecode = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
};

// Get stores with pagination
exports.getStores = catchAsync(async (req, res, next) => {
  const result = await storeService.getStores(req.models, req.query);
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Stores retrieved successfully',
    data: result.stores,
    metadata: {
      totalStores: result.totalStores,
      timestamp: result.timestamp
    }
  });
});

// Get store names for dropdowns
exports.getStoreNames = catchAsync(async (req, res, next) => {
  const stores = await storeService.getStoreNames(req.models);
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Store names retrieved successfully',
    data: stores
  });
});

// Search stores
exports.searchStores = catchAsync(async (req, res, next) => {
  const { q, page, limit } = req.query;
  if (!q) {
    return next(new AppError('Search query is required', 400));
  }
  const result = await storeService.searchStores(req.models, q, page, limit);
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Store search completed',
    data: result.stores,
    metadata: {
      totalStores: result.totalStores,
      query: result.query,
      page: result.page,
      limit: result.limit
    }
  });
});

// Fetch a store by slug
exports.getStoreBySlug = catchAsync(async (req, res, next) => {
  const store = await storeService.getStoreBySlug(req.models, req.params.slug);
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Store found by slug',
    data: store
  });
});

// Get store by ID
exports.getStoreById = catchAsync(async (req, res, next) => {
  const store = await storeService.getStoreById(req.models, req.params.id);
  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Store found by ID',
    data: store
  });
});

// Create a new store
exports.createStore = catchAsync(async (req, res, next) => {
  if (req.body.trackingUrl) req.body.trackingUrl = htmlDecode(req.body.trackingUrl);
  if (req.body.heading) req.body.heading = htmlDecode(req.body.heading);

  // Add tracking data
  const storeData = {
    ...req.body,
    createdBy: req.user._id,
    createdByName: req.user.name,
    updatedBy: req.user._id,
    updatedByName: req.user.name
  };

  const newStore = await storeService.createStore(req.models, storeData);

  // Log Activity
  logActivity(req, {
    action: 'CREATE_STORE',
    targetId: newStore._id,
    targetName: newStore.name,
    details: `Store "${newStore.name}" created.`
  });

  res.status(201).json({
    success: true,
    status: 'success',
    message: 'Store created successfully',
    data: newStore
  });
});

// Update a store by ID
exports.updateStore = catchAsync(async (req, res, next) => {
  // Add tracking data
  const updateData = {
    ...req.body,
    updatedBy: req.user._id,
    updatedByName: req.user.name
  };

  const updatedStore = await storeService.updateStore(req.models, req.params.id, updateData);

  // Log Activity
  logActivity(req, {
    action: 'UPDATE_STORE',
    targetId: updatedStore._id,
    targetName: updatedStore.name,
    details: `Store "${updatedStore.name}" updated.`
  });

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Store updated successfully',
    data: updatedStore
  });
});

// Delete a store by ID
exports.deleteStore = catchAsync(async (req, res, next) => {
  const store = await storeService.getStoreById(req.models, req.params.id);
  await storeService.deleteStore(req.models, req.params.id);

  // Log Activity
  if (store) {
    logActivity(req, {
      action: 'DELETE_STORE',
      targetId: store._id,
      targetName: store.name,
      details: `Store "${store.name}" deleted.`
    });
  }

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Store deleted successfully',
    data: null
  });
});