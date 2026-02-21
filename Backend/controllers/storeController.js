const storeService = require('../services/storeService');
const AppError = require('../errors/AppError');

const htmlDecode = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
};

// Get stores with pagination
exports.getStores = async (req, res, next) => {
  try {
    const result = await storeService.getStores(req.models, req.query);
    res.status(200).json({
      status: 'success',
      data: result.stores,
      metadata: {
        totalStores: result.totalStores,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search stores
exports.searchStores = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    if (!q) {
      return next(new AppError('Search query is required', 400));
    }
    const result = await storeService.searchStores(req.models, q, page, limit);
    res.status(200).json({
      status: 'success',
      data: result.stores,
      metadata: {
        totalStores: result.totalStores,
        query: result.query,
        page: result.page,
        limit: result.limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch a store by slug
exports.getStoreBySlug = async (req, res, next) => {
  try {
    const store = await storeService.getStoreBySlug(req.models, req.params.slug);
    res.status(200).json({ status: 'success', data: store });
  } catch (error) {
    next(error);
  }
};

// Get store by ID
exports.getStoreById = async (req, res, next) => {
  try {
    const store = await storeService.getStoreById(req.models, req.params.id);
    res.status(200).json({ status: 'success', data: store });
  } catch (error) {
    next(error);
  }
};

// Create a new store
exports.createStore = async (req, res, next) => {
  try {
    if (req.body.trackingUrl) req.body.trackingUrl = htmlDecode(req.body.trackingUrl);
    if (req.body.heading) req.body.heading = htmlDecode(req.body.heading);

    const newStore = await storeService.createStore(req.models, req.body);
    res.status(201).json({ status: 'success', data: newStore });
  } catch (error) {
    next(error);
  }
};

// Update a store by ID
exports.updateStore = async (req, res, next) => {
  try {
    const updatedStore = await storeService.updateStore(req.models, req.params.id, req.body);
    res.status(200).json({ status: 'success', data: updatedStore });
  } catch (error) {
    next(error);
  }
};

// Delete a store by ID
exports.deleteStore = async (req, res, next) => {
  try {
    await storeService.deleteStore(req.models, req.params.id);
    res.status(200).json({ status: 'success', message: 'Store deleted successfully' });
  } catch (error) {
    next(error);
  }
};