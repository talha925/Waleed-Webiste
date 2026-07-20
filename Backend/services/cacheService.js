const redisConfig = require('../config/redis');
const { trackCache } = require('../middlewares/performanceMonitoring');
const NodeCache = require('node-cache');

// 🚀 L1 Cache: In-memory (node-cache) for sub-millisecond response times
// This is the LOCAL cache layer that sits in front of Redis (L2 cache)
// L1 TTL is short (30s) - prevents stale data while eliminating ~200-400ms Redis network round-trips
const l1Cache = new NodeCache({
  stdTTL: 30,           // Default 30 seconds - short enough to stay fresh
  checkperiod: 60,      // Cleanup expired keys every 60 seconds
  useClones: false,     // No deep-clone (faster, we trust our own data)
  maxKeys: 1000,        // Max 1000 keys in memory to prevent OOM
  deleteOnExpire: true  // Auto-delete on expire
});

class CacheService {
  static initializing = false;

  constructor() {
    this.redis = null;
    this.defaultTTL = {
      categories: 1800,        // 30 minutes
      frontBannerBlogs: 900,   // 15 minutes
      blogPost: 3600,          // 1 hour (Increased for stability)
      stores: 300,             // 5 minutes (reduced - invalidation handles freshness)
      coupons: 300,            // 5 minutes (reduced - invalidation handles freshness)
      store_detail: 600,       // 10 minutes (reduced - invalidation handles freshness)
      coupon_detail: 600,      // 10 minutes
      homepage: 300            // 5 minutes
    };
    this.isInitialized = false;
    this.initializationPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isReconnecting = false;
    this.connectionHealth = {
      lastConnected: null,
      lastError: null,
      totalReconnects: 0,
      isHealthy: false
    };

    this.pendingInvalidations = new Map();
    this.invalidationTimeout = null;

    if (!CacheService.initializing) {
      CacheService.initializing = true;
      this.initializeCache();
    }
  }

  async initializeCache() {
    if (this.initializationPromise) return this.initializationPromise;
    this.initializationPromise = this._initializeWithRetry();
    return this.initializationPromise;
  }

  async _initializeWithRetry(maxRetries = 3, retryDelay = 500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.redis = redisConfig.getClient();
        if (redisConfig.isReady()) {
          this.isInitialized = true;
          this.connectionHealth.isHealthy = true;
          this.connectionHealth.lastConnected = new Date();
          this.reconnectAttempts = 0;
          this._setupRedisEventListeners();
          console.log('✅ Cache service successfully connected to Redis with auto-reconnection');
          return true;
        }
      } catch (error) {
        this.connectionHealth.lastError = error.message;
        console.error(`❌ Cache initialization attempt ${attempt} failed:`, error.message);
        if (attempt === maxRetries) {
          console.log('⚠️ Cache service running in fallback mode after all retries');
          this.isInitialized = true;
          this.connectionHealth.isHealthy = false;
          return false;
        }
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    this.isInitialized = true;
    this.connectionHealth.isHealthy = false;
    return false;
  }

  _setupRedisEventListeners() {
    if (!this.redis) return;

    // Prevent duplicate event listeners from accumulating on reconnection
    this.redis.removeAllListeners('error');
    this.redis.removeAllListeners('connect');
    this.redis.removeAllListeners('disconnect');
    this.redis.removeAllListeners('reconnecting');

    this.redis.on('error', (error) => {
      console.error('🔴 Redis connection error:', error.message);
      this.connectionHealth.lastError = error.message;
      this.connectionHealth.isHealthy = false;
      this._handleReconnection();
    });

    this.redis.on('connect', () => {
      console.log('🟢 Redis connected');
      this.connectionHealth.isHealthy = true;
      this.connectionHealth.lastConnected = new Date();
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
    });

    this.redis.on('disconnect', () => {
      console.log('🟡 Redis disconnected');
      this.connectionHealth.isHealthy = false;
      this._handleReconnection();
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
      this.connectionHealth.totalReconnects++;
    });
  }

  async _handleReconnection() {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`🔄 Attempting Redis reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      try {
        this.redis = redisConfig.getClient();
        if (redisConfig.isReady()) {
          this.connectionHealth.isHealthy = true;
          this.connectionHealth.lastConnected = new Date();
          this.reconnectAttempts = 0;
          this.isReconnecting = false;
          console.log('✅ Redis reconnection successful');
        } else {
          this.isReconnecting = false;
          this._handleReconnection();
        }
      } catch (error) {
        console.error('❌ Redis reconnection failed:', error.message);
        this.connectionHealth.lastError = error.message;
        this.isReconnecting = false;
        this._handleReconnection();
      }
    }, delay);
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      redisAvailable: this.isAvailable(),
      hasRedisClient: !!this.redis,
      connectionHealth: this.connectionHealth,
      reconnectAttempts: this.reconnectAttempts,
      isReconnecting: this.isReconnecting
    };
  }

  async ensureInitialized() {
    if (!this.isInitialized) await this.initializationPromise;
  }

  isAvailable() {
    return this.redis && redisConfig.isReady();
  }

  async ping() {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      throw new Error('Redis not available');
    }
    const res = await this.redis.ping();
    return res;
  }

  generateKey(type, params = {}) {
    // Extract brandId once to avoid redundancy
    const { brandId, ...cleanParams } = params;
    const brandPrefix = brandId ? `${brandId}:` : '';
    const basePrefix = `${brandPrefix}coupon_backend:`;

    switch (type) {
      case 'store':
        // list or search
        return `${basePrefix}stores:list:${this._hashParams(cleanParams)}`;
      case 'store_names':
        return `${basePrefix}stores:names:${this._hashParams(cleanParams)}`;
      case 'store_detail':
        // detail by slug or id
        const sId = cleanParams.id || cleanParams.slug;
        return `${basePrefix}store:detail:${sId}`;
      case 'blog':
      case 'blogs':
        return `${basePrefix}blogs:list:${this._hashParams(cleanParams)}`;
      case 'blog_detail':
        const bId = cleanParams.id || cleanParams.slug;
        return `${basePrefix}blog:detail:${bId}`;
      case 'category':
      case 'categories':
        return `${basePrefix}categories:list:${this._hashParams(cleanParams)}`;
      case 'blog_categories':
        return `${basePrefix}blog_categories:list:${this._hashParams(cleanParams)}`;
      case 'related_posts':
        return `${basePrefix}related_posts:${this._hashParams(cleanParams)}`;
      case 'coupon':
        return cleanParams.id 
          ? `${basePrefix}coupon:id:${cleanParams.id}` 
          : `${basePrefix}coupons:list:${this._hashParams(cleanParams)}`;
      case 'coupon_detail':
        return `${basePrefix}coupon:id:${cleanParams.id}`;
      case 'store_coupons':
        return `${basePrefix}store:${cleanParams.storeId}:coupons:${this._hashParams(cleanParams)}`;
      case 'user':
        return `${basePrefix}user:id:${cleanParams.id}`;
      default:
        const baseKey = `${basePrefix}${type}`;
        if (Object.keys(cleanParams).length === 0) return baseKey;

        const filteredParams = Object.entries(cleanParams)
          .filter(([_, value]) => value !== undefined && value !== null)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});

        if (Object.keys(filteredParams).length === 0) return baseKey;

        const paramString = Object.keys(filteredParams)
          .map(key => `${key}:${filteredParams[key]}`)
          .join('|');

        return `${baseKey}:${paramString}`;
    }
  }

  _hashParams(params) {
    if (!params || Object.keys(params).length === 0) return 'all';

    // Remove brandId if it leaked into here
    const { brandId, ...cleanParams } = params;

    const filteredParams = Object.entries(cleanParams)
      .filter(([_, value]) => value !== undefined && value !== null)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    if (Object.keys(filteredParams).length === 0) return 'all';

    return Object.keys(filteredParams)
      .map(key => `${key}:${filteredParams[key]}`)
      .join('|');
  }

  // ✅ STORE-SPECIFIC CACHE METHODS
  async getStore(slug) {
    const key = this.generateKey('store', { slug });
    return await this.get(key);
  }

  async setStore(slug, storeData, ttl = null) {
    const key = this.generateKey('store', { slug });
    return await this.set(key, storeData, ttl || this.defaultTTL.stores);
  }

  async getStoreById(id) {
    const key = this.generateKey('store_detail', { id });
    return await this.get(key);
  }

  async setStoreById(id, storeData, ttl = null) {
    const key = this.generateKey('store_detail', { id });
    return await this.set(key, storeData, ttl || this.defaultTTL.store_detail);
  }

  // ✅ COUPON-SPECIFIC CACHE METHODS
  async getCoupon(id) {
    const key = this.generateKey('coupon', { id });
    return await this.get(key);
  }

  async setCoupon(id, couponData, ttl = null) {
    const key = this.generateKey('coupon', { id });
    return await this.set(key, couponData, ttl || this.defaultTTL.coupons);
  }

  async getStoreCoupons(storeId, params = {}) {
    const key = this.generateKey('store_coupons', { storeId, ...params });
    return await this.get(key);
  }

  async setStoreCoupons(storeId, couponsData, params = {}, ttl = null) {
    const key = this.generateKey('store_coupons', { storeId, ...params });
    return await this.set(key, couponsData, ttl || this.defaultTTL.coupons);
  }

  // ✅ ATOMIC CACHE INVALIDATION FOR STORES
  async invalidateStoreCache(storeId, storeSlug = null, brandId = null) {
    await this.ensureInitialized();
    if (!this.isAvailable() || (!storeId && !storeSlug)) return false;

    try {
      const keysToDelete = [];
      const brandPrefix = brandId ? `${brandId}:` : '';

      // 1. Direct Keys (O(1))
      if (storeSlug) {
        keysToDelete.push(this.generateKey('store_detail', { slug: storeSlug, brandId }));
      }
      if (storeId) {
        keysToDelete.push(this.generateKey('store_detail', { id: storeId, brandId }));
      }

      // 2. Optimized Patterns (Scan once per category)
      const patterns = [
        `${brandPrefix}coupon_backend:stores:list:*`,
        `${brandPrefix}coupon_backend:homepage:*`
      ];

      if (storeId) {
        patterns.push(`${brandPrefix}coupon_backend:store:${storeId}:coupons:*`);
      }

      for (const pattern of patterns) {
        const found = await this._getKeysByPattern(pattern);
        keysToDelete.push(...found);
      }

      // Bulk Delete
      if (keysToDelete.length > 0) {
        const uniqueKeys = [...new Set(keysToDelete)];
        this._flushL1ForKeys(uniqueKeys); // 🔥 ROOT FIX: Also clear L1 memory cache
        await this.redis.del(uniqueKeys);
        console.log(`🧹 Invalidated ${uniqueKeys.length} store-related keys for store ${storeId || storeSlug} [${brandId}]`);
      }

      return true;
    } catch (error) {
      console.error('❌ Store cache invalidation error:', error);
      return false;
    }
  }

  // ✅ ATOMIC CACHE INVALIDATION FOR COUPONS
  async invalidateCouponCache(couponId, storeId = null, brandId = null) {
    await this.ensureInitialized();
    if (!this.isAvailable()) return false;

    try {
      const keysToDelete = [];
      const brandPrefix = brandId ? `${brandId}:` : '';

      // Coupon-specific keys
      keysToDelete.push(this.generateKey('coupon_detail', { id: couponId, brandId }));

      const patternPromises = [];
      
      if (storeId) {
        patternPromises.push(this._getKeysByPattern(`${brandPrefix}coupon_backend:store:${storeId}:coupons:*`));
      }
      patternPromises.push(this._getKeysByPattern(`${brandPrefix}coupon_backend:coupons:list:*`));

      const results = await Promise.all(patternPromises);
      for (const keys of results) {
        keysToDelete.push(...keys);
      }

      // Delete all keys
      if (keysToDelete.length > 0) {
        this._flushL1ForKeys(keysToDelete); // 🔥 ROOT FIX: Also clear L1 memory cache
        await this.redis.del(keysToDelete);
        console.log(`✅ Invalidated ${keysToDelete.length} coupon cache keys for coupon ${couponId} (Brand: ${brandId})`);
      }

      return true;
    } catch (error) {
      console.error('❌ Coupon cache invalidation error:', error);
      return false;
    }
  }

  async _getKeysByPattern(pattern) {
    const keys = [];
    let timedOut = false;
    
    const timeout = setTimeout(() => {
      timedOut = true;
    }, 2000);

    try {
      // 🚀 Use non-blocking scanIterator with a loop-level timeout flag to prevent background runaway scans
      for await (const keyOrBatch of this.redis.scanIterator({
        MATCH: pattern,
        COUNT: 250 // Optimal batch size for high performance / low overhead
      })) {
        if (timedOut) {
          console.warn(`⚠️ Redis SCAN Timeout reached for pattern: ${pattern}`);
          break;
        }

        if (Array.isArray(keyOrBatch)) {
          keys.push(...keyOrBatch);
        } else {
          keys.push(keyOrBatch);
        }

        if (keys.length > 5000) break; // Hard threshold safety check
      }
    } catch (error) {
      console.error(`❌ Error scanning keys for pattern ${pattern}:`, error.message);
    } finally {
      clearTimeout(timeout);
    }
    return keys;
  }

  // 🔥 ROOT FIX: Centralized L1 cache flush for bulk Redis deletions
  // Without this, pattern-based invalidation only cleared Redis (L2) but left
  // stale data in L1 memory cache for up to 30 seconds after updates
  _flushL1ForKeys(keys) {
    if (!keys || keys.length === 0) return;
    for (const key of keys) {
      l1Cache.del(key);
    }
  }

  async get(key) {
    await this.ensureInitialized();

    // 🚀 L1 CHECK: In-memory cache (0ms) - check before hitting Redis (~200-400ms network)
    const l1Value = l1Cache.get(key);
    if (l1Value !== undefined) {
      if (typeof trackCache === 'function') trackCache('GET', key, true);
      return l1Value;
    }

    if (!this.isAvailable()) {
      trackCache('GET', key, false);
      return null;
    }
    
    let timer;
    try {
      // 🚨 L2: Redis GET with timeout
      const data = await Promise.race([
        this.redis.get(key),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Redis Timeout')), 3000); })
      ]);
      clearTimeout(timer);
      
      const hit = data !== null;
      if (typeof trackCache === 'function') trackCache('GET', key, hit);
      
      if (data) {
        const parsed = JSON.parse(data);
        // 🔥 Populate L1 cache so next request is instant
        l1Cache.set(key, parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      clearTimeout(timer);
      if (error.message !== 'Redis Timeout') {
        console.error('❌ Cache get error:', error);
      } else {
        console.warn('⚠️ Cache skip (Redis Timeout)');
      }
      if (typeof trackCache === 'function') trackCache('GET', key, false);
      return null;
    }
  }

  async set(key, data, ttl = null) {
    await this.ensureInitialized();

    // 🚀 Always write to L1 cache immediately (synchronous, instant)
    // L1 TTL is capped at 30s regardless of Redis TTL to keep data fresh
    const l1Ttl = Math.min(ttl || 30, 30);
    l1Cache.set(key, data, l1Ttl);

    if (!this.isAvailable()) {
      trackCache('SET', key, false);
      return false;
    }
    
    let timer;
    try {
      const serializedData = JSON.stringify(data);
      // 🔥 FIX: Write to Redis (L2) with timeout - non-blocking for L1 already done
      const setOp = ttl 
        ? this.redis.setEx(key, ttl, serializedData)
        : this.redis.set(key, serializedData);
      
      await Promise.race([
        setOp,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Redis SET Timeout')), 3000); })
      ]);
      clearTimeout(timer);
      
      trackCache('SET', key, true);
      return true;
    } catch (error) {
      clearTimeout(timer);
      if (error.message !== 'Redis SET Timeout') {
        console.error('❌ Cache set error:', error.message);
      }
      trackCache('SET', key, false);
      return false;
    }
  }

  async del(key) {
    // 🚀 Always invalidate L1 immediately
    l1Cache.del(key);

    await this.ensureInitialized();
    if (!this.isAvailable()) return false;
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('❌ Cache delete error:', error);
      return false;
    }
  }

  // ✅ ADDED: Professional pattern deletion using KEYS (safe for this scale)
  async delPattern(pattern) {
    await this.ensureInitialized();
    if (!this.isAvailable()) {
      console.log('❌ Redis not available for pattern deletion');
      return 0;
    }

    // ✅ SAFETY: Allow patterns inside coupon_backend namespace
    if (!pattern.includes('coupon_backend')) {
      console.warn(`⚠️ Unsafe pattern blocked: ${pattern}`);
      return 0;
    }

    try {
      // 🚨 ROOT FIX: Use SCAN (via _getKeysByPattern) instead of KEYS to prevent blocking the entire Redis server
      const keys = await this._getKeysByPattern(pattern);
      
      if (!keys || keys.length === 0) {
        console.log(`✅ No keys found for pattern: ${pattern}`);
        return 0;
      }

      console.log(`🧹 Found ${keys.length} keys for pattern [${pattern}]. Deleting...`);
      
      let deletedCount = 0;
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        this._flushL1ForKeys(batch); // 🔥 ROOT FIX: Also clear L1 memory cache
        // node-redis v4: pass array directly to del()
        const result = await this.redis.del(batch);
        deletedCount += result;
      }

      console.log(`✅ Successfully deleted ${deletedCount} cache keys for: ${pattern}`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Redis pattern deletion error:', error);
      throw error;
    }
  }

  // ✅ SCHEDULED INVALIDATION DEBOUNCER
  scheduleInvalidation(patterns) {
    if (!this.pendingPatterns) this.pendingPatterns = new Set();
    patterns.forEach(p => this.pendingPatterns.add(p));

    if (this.invalidationTimeout) clearTimeout(this.invalidationTimeout);

    this.invalidationTimeout = setTimeout(async () => {
      const patternsToProcess = Array.from(this.pendingPatterns);
      this.pendingPatterns.clear();
      
      console.log(`⏱️ Processing batched cache invalidation for ${patternsToProcess.length} patterns...`);
      
      try {
        // Execute sequentially to prevent event loop / Redis pressure spikes
        let totalDeleted = 0;
        for (const pattern of patternsToProcess) {
          totalDeleted += await this.delPattern(pattern);
        }
        console.log(`✅ Batched invalidation complete. Total keys deleted: ${totalDeleted}`);
      } catch (err) {
        console.error('❌ Batched invalidation error:', err);
      }
    }, 2000); // 2-second debounce window
  }

  // ✅ ENHANCED: Professional Invalidation with guaranteed patterns
  async invalidateBlogCaches(brandId = null) {
    if (!this.isAvailable()) return false;
    
    // If brandId is null, use wildcard to catch all brands (safety fallback)
    const prefix = brandId ? `${brandId}:` : '*:';
    
    try {
      // Broad patterns ensure lists, details, and paginated results are ALL cleared
      const patterns = [
        `${prefix}coupon_backend:blogs:*`,
        `${prefix}coupon_backend:blog:*`,
        `${prefix}coupon_backend:blog_categories:*`,
        `${prefix}coupon_backend:frontBannerBlogs*`,
        `${prefix}coupon_backend:related_posts*`,
        `${prefix}coupon_backend:homepage*`
      ];

      this.scheduleInvalidation(patterns);
      return true;
    } catch (err) {
      console.error('❌ invalidateBlogCaches Error:', err);
      return false;
    }
  }


  // ✅ COMPREHENSIVE CACHE INVALIDATION WITH ALL REQUIRED PATTERNS
  async invalidateStoreCaches(storeId = null, storeSlug = null, brandId = null) {
    const prefix = brandId ? `${brandId}:` : '';
    try {
      const patterns = [
        `${prefix}coupon_backend:stores:list*`,
        `${prefix}coupon_backend:stores:names*`,
        storeSlug ? `${prefix}coupon_backend:store:detail:${storeSlug}` : `${prefix}coupon_backend:store:detail*`,
        `${prefix}coupon_backend:store_search*`,
        `${prefix}coupon_backend:homepage*`,
        `${prefix}coupon_backend:categories:list*`,
        `${prefix}coupon_backend:coupons:list*`
      ];

      if (storeId) {
        patterns.push(
          `${prefix}coupon_backend:store:${storeId}:coupons*`
        );
      }

      this.scheduleInvalidation(patterns);
      return true;
    } catch (error) {
      console.error('❌ Store cache invalidation error:', error);
      throw error;
    }
  }

  // ✅ ENHANCED HOMEPAGE CACHE INVALIDATION
  async invalidateHomepageCaches(brandId = null) {
    const prefix = brandId ? `${brandId}:` : '';
    try {
      const patterns = [
        `${prefix}coupon_backend:homepage*`,
        `${prefix}coupon_backend:frontBannerBlogs*`,
        `${prefix}coupon_backend:categories*`,
        `${prefix}coupon_backend:stores*`
      ];

      this.scheduleInvalidation(patterns);
      return 1;
    } catch (error) {
      console.error('❌ Homepage cache invalidation error:', error);
      throw error;
    }
  }

  // ✅ ENHANCED CATEGORY CACHE INVALIDATION
  async invalidateCategoryCaches(brandId = null) {
    const prefix = brandId ? `${brandId}:` : '';
    try {
      const patterns = [
        `${prefix}coupon_backend:categories:list*`,
        `${prefix}coupon_backend:stores:list*`,
        `${prefix}coupon_backend:coupons:list*`,
        `${prefix}coupon_backend:homepage*`
      ];

      this.scheduleInvalidation(patterns);
      return true;
    } catch (error) {
      console.error('❌ Category cache invalidation error:', error);
      throw error;
    }
  }

  // ✅ NUCLEAR OPTION: INVALIDATE ALL CACHES
  async invalidateAllCaches() {
    try {
      // Matches both global namespace and brand-prefixed keys (e.g. brandId:coupon_backend:*)
      const deleted = await this.delPattern('*coupon_backend:*');
      console.log(`🚨 ALL CACHES INVALIDATED: ${deleted} keys deleted`);
      return deleted;
    } catch (error) {
      console.error('❌ All cache invalidation error:', error);
      throw error;
    }
  }

  // ✅ PRODUCTION-READY: SAFE CACHE INVALIDATION WITH ERROR HANDLING
  async invalidateStoreCachesSafely(storeId = null, storeSlug = null, brandId = null) {
    try {
      console.log(`🛡️ Starting safe cache invalidation for store: ${storeSlug || storeId || 'all'} (Brand: ${brandId})`);
      const success = await this.invalidateStoreCaches(storeId, storeSlug, brandId);
      console.log(`✅ Safe cache invalidation completed: ${success ? 'SUCCESS' : 'FAILED'} (Brand: ${brandId})`);
      return success;
    } catch (error) {
      console.error(`❌ Cache invalidation failed for store ${storeId}:`, error.message);

      // ✅ CRITICAL: Don't throw - continue without cache invalidation
      // This prevents cache failures from breaking the entire operation
      const fallbackResult = {
        totalDeleted: 0,
        error: error.message,
        fallback: true,
        timestamp: new Date(),
        storeId: storeId,
        brandId: brandId
      };

      console.warn(`⚠️ Continuing operation without cache invalidation:`, fallbackResult);
      return fallbackResult;
    }
  }

  // ✅ PRODUCTION-READY: SAFE HOMEPAGE CACHE INVALIDATION
  async invalidateHomepageCachesSafely(brandId = null) {
    try {
      const result = await this.invalidateHomepageCaches(brandId);
      console.log(`✅ Safe homepage cache invalidation completed: ${result} keys deleted (Brand: ${brandId})`);
      return { totalDeleted: result, success: true };
    } catch (error) {
      console.error('❌ Homepage cache invalidation failed:', error.message);
      return {
        totalDeleted: 0,
        error: error.message,
        fallback: true,
        success: false
      };
    }
  }

  // ✅ PRODUCTION-READY: SAFE BLOG CACHE INVALIDATION
  async invalidateBlogCachesSafely(brandId = null) {
    try {
      const result = await this.invalidateBlogCaches(brandId);
      console.log(`✅ Safe blog cache invalidation completed: ${result ? 'success' : 'partial'} (Brand: ${brandId})`);
      return { success: result, fallback: false };
    } catch (error) {
      console.error('❌ Blog cache invalidation failed:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  }

  // ✅ PRODUCTION-READY: SAFE CATEGORY CACHE INVALIDATION
  async invalidateCategoryCachesSafely(brandId = null) {
    try {
      const result = await this.invalidateCategoryCaches(brandId);
      console.log(`✅ Safe category cache invalidation completed: ${result} keys deleted (Brand: ${brandId})`);
      return { totalDeleted: result, success: true };
    } catch (error) {
      console.error('❌ Category cache invalidation failed:', error.message);
      return {
        totalDeleted: 0,
        error: error.message,
        fallback: true,
        success: false
      };
    }
  }

  async getCachedBlogPost(id) {
    const key = this.generateKey('blog_post', { id });
    return this.get(key);
  }

  async setCachedBlogPost(id, blog) {
    const key = this.generateKey('blog_post', { id });
    return this.set(key, blog, this.defaultTTL.blogPost);
  }
}

const cacheService = new CacheService();

process.nextTick(async () => {
  try {
    await cacheService.ensureInitialized();
    const status = cacheService.getStatus();
    console.log('🎯 Cache Service Status:', status);
  } catch (error) {
    console.error('💥 Cache Service initialization failed:', error);
  }
});

module.exports = cacheService;