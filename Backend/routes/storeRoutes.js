const express = require('express');
const storeController = require('../controllers/storeController');
const validator = require('../middlewares/validator');
const { createStoreSchema, updateStoreSchema } = require('../validators/storeValidator');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Search stores
router.get('/search', storeController.searchStores);

// Get all stores (with pagination and filtering)
router.get('/', storeController.getStores);

// Get all store names
router.get('/names', storeController.getStoreNames);

// Get store by slug
router.get('/slug/:slug', storeController.getStoreBySlug);

// Get store by ID with populated coupons
router.get('/:id', storeController.getStoreById);

// --- PROTECTED ROUTES (Admin Only) ---
router.use(protect);
router.use(restrictTo('admin', 'super-admin'));

// Create a new store with validation
router.post('/', validator(createStoreSchema), storeController.createStore);

// Update store by id with validation
router.put('/:id', validator(updateStoreSchema), storeController.updateStore);

// Delete store by id
router.delete('/:id', storeController.deleteStore);

// Note: Manual cache invalidation removed - now handled automatically via WebSocket notifications

module.exports = router;
