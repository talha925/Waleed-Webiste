const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { getWebSocketServer } = require('../lib/websocket-server');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');
const { deleteImageFromS3 } = require('../utils/s3Utils');

// 🚀 L1 CACHE: Local memory cache for high-traffic lists
const L1_CACHE = new Map();
const L1_TTL = 60000; // 60 seconds (Professional Production standard)

// ✅ Optimized helper for related posts
exports.getRelatedPosts = async (models, categoryId, storeId, excludeId, limit = 5) => {
  const { Blog: BlogPost, brandId } = models;
  try {
    if (!categoryId && !storeId) return [];

    const cacheKey = cacheService.generateKey('related_posts', { categoryId, storeId, excludeId, brandId });
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const query = { _id: { $ne: excludeId }, status: 'published', $or: [] };
    if (categoryId) query.$or.push({ 'category.id': categoryId });
    if (storeId) query.$or.push({ 'store.id': storeId });
    if (query.$or.length === 0) delete query.$or;

    const relatedPosts = await BlogPost.find(query)
      .sort({ publishDate: -1 })
      .limit(limit)
      .select('title slug shortDescription image.url image.alt publishDate engagement.readingTime')
      .lean();

    await cacheService.set(cacheKey, relatedPosts, 1800);
    return relatedPosts;
  } catch (error) {
    console.error('❌ getRelatedPostsOptimized Error:', error);
    return [];
  }
};

exports.findAll = async (models, queryParams = {}) => {
  const { Blog: BlogPost, brandId } = models;
  try {
    const {
      page = 1,
      limit = 9,
      status = 'published',
      categoryId,
      category,
      storeId,
      search,
      FrontBanner,
      frontBanner,
      isFeaturedForHome,
      featured,
      slug,
      sort = '-publishDate' // Default to publishDate to match compound indexes
    } = queryParams;

    const cacheKey = cacheService.generateKey('blogs', { ...queryParams, brandId });
    
    // 1. Check L1 Cache
    const now = Date.now();
    if (L1_CACHE.has(cacheKey)) {
      const entry = L1_CACHE.get(cacheKey);
      if (now < entry.expiry) return entry.data;
    }

    // 2. Check L2 Cache (Redis)
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      L1_CACHE.set(cacheKey, { data: cachedResult, expiry: now + L1_TTL });
      return cachedResult;
    }

    const query = {};
    if (status && status !== 'all') query.status = status;

    // Use text search for indexed fields if search query is provided
    let isTextSearch = false;
    if (search && search.trim()) {
      isTextSearch = true;
      query.$text = { $search: search };
    }

    // Normalize FrontBanner / frontBanner
    const bannerVal = FrontBanner !== undefined ? FrontBanner : frontBanner;
    if (bannerVal !== undefined) {
      query.FrontBanner = bannerVal === 'true' || bannerVal === true;
    }

    if (isFeaturedForHome !== undefined) {
      query.isFeaturedForHome = isFeaturedForHome === 'true' || isFeaturedForHome === true;
    }

    if (featured !== undefined) {
      query.isFeatured = featured === 'true' || featured === true;
    }

    if (categoryId) query['category.id'] = categoryId;
    if (category) query['category.slug'] = category;
    if (storeId) query['store.id'] = storeId;
    if (slug) query.slug = slug;

    // Optimised Count Logic
    const isFilterEmpty = Object.keys(query).length === 0 || 
                         (Object.keys(query).length === 1 && query.status === 'published');

    let mongoQuery = BlogPost.find(query);

    if (isTextSearch) {
      // Sort by text relevance score if performing text search
      mongoQuery = mongoQuery
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      // Allow dynamic field selection for optimized fetching (e.g. sitemaps)
      const selectFields = queryParams.fields 
        ? queryParams.fields.split(',').join(' ') 
        : 'title slug shortDescription image.url image.alt publishDate author.name category.name category.slug FrontBanner isFeaturedForHome engagement.readingTime updatedAt createdAt';

      mongoQuery = mongoQuery
        .sort(sort)
        .select(selectFields);
    }

    // 🔥 ROOT PERFORMANCE OPTIMIZATION: Parallelize Count and Data Fetch
    // This halves the query time for cache-misses
    const [total, blogs] = await Promise.all([
      isFilterEmpty ? BlogPost.estimatedDocumentCount() : BlogPost.countDocuments(query),
      mongoQuery
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean()
    ]);

    // Fallback if text search yields no results (handle partial matches)
    if (isTextSearch && blogs.length === 0) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSearch, 'i');
      const fallbackQuery = {
        $or: [
          { title: { $regex: regex } },
          { slug: { $regex: regex } }
        ],
        status: status === 'all' ? { $exists: true } : status
      };
      
      blogs = await BlogPost.find(fallbackQuery)
        .sort({ publishDate: -1 })
        .limit(parseInt(limit))
        .select('title slug shortDescription image.url image.alt author.name category.name category.slug category.id store.id status publishDate engagement.readingTime FrontBanner isFeaturedForHome isFeatured createdAt')
        .lean();
    }

    // Secondary sorting: If it's a non-text search or we need JS-side refinement
    if (search && !isTextSearch) {
      const searchLower = search.toLowerCase();
      blogs.sort((a, b) => {
        const aTitle = (a.title || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        if (aTitle === searchLower && bTitle !== searchLower) return -1;
        if (bTitle === searchLower && aTitle !== searchLower) return 1;
        if (aTitle.startsWith(searchLower) && !bTitle.startsWith(searchLower)) return -1;
        if (bTitle.startsWith(searchLower) && !aTitle.startsWith(searchLower)) return 1;
        return 0;
      });
    }

    const result = {
      blogs,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    };

    await cacheService.set(cacheKey, result, cacheService.defaultTTL.blogPost);
    return result;
  } catch (error) {
    throw new AppError('Failed to fetch blog posts', 500);
  }
};

exports.findById = async (models, id) => {
  const { Blog: BlogPost, brandId } = models;
  const mongoose = require('mongoose');
  try {
    if (!id || id === 'undefined') throw new AppError('Valid ID or Slug is required', 400);

    const cacheKey = cacheService.generateKey('blog_detail', { id, brandId });

    // 1. L1 Check
    const now = Date.now();
    if (L1_CACHE.has(cacheKey)) {
      const entry = L1_CACHE.get(cacheKey);
      if (now < entry.expiry) return entry.data;
    }

    // 2. L2 Check (Redis)
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      L1_CACHE.set(cacheKey, { data: cached, expiry: now + L1_TTL });
      return cached;
    }

    // 3. DB Fetch — Blog data
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const blog = await BlogPost.findOne(query).lean();
    if (!blog) throw new AppError('Blog post not found', 404);

    // 4. Related Posts (depends on blog data, but isolated with allSettled for safety)
    let relatedPosts = [];
    try {
      relatedPosts = await exports.getRelatedPosts(models, blog.category?.id, blog.store?.id, blog._id);
    } catch (relErr) {
      console.error(`[BlogService.findById] Non-fatal error fetching related posts:`, relErr.message);
    }

    const result = { ...blog, relatedPosts };

    // 5. Cache in both layers
    await cacheService.set(cacheKey, result, cacheService.defaultTTL.blogPost || 3600);
    L1_CACHE.set(cacheKey, { data: result, expiry: now + L1_TTL });

    return result;
  } catch (error) {
    console.error(`[BlogService.findById] Error fetching blog [${id}]:`, error);
    throw error;
  }
};

exports.create = async (models, data) => {
  const { Blog: BlogPost, brandId } = models;
  const blog = await BlogPost.create(data);
  L1_CACHE.clear(); // 🧹 Clear memory cache on create
  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'created', 'blog', blog._id, blog);
  // 🔥 Optimization: Don't wait for revalidation to finish (Prevents Deadlock in Dev)
  callFrontendRevalidation('blog', blog.slug || blog._id.toString(), brandId);
  return blog;
};

exports.update = async (models, id, data) => {
  const { Blog: BlogPost, brandId } = models;

  console.log(`[BlogService.update] Brand: ${brandId}, ID: ${id}`);

  // 1. Find the old blog to check for existing image
  // Root fix: Support lookup by slug during update to prevent CastError
  const mongoose = require('mongoose');
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { slug: id };

  const oldBlog = await BlogPost.findOne(query);
  if (!oldBlog) {
    console.error(`[BlogService.update] Blog post not found: ${id}`);
    throw new AppError('Blog post not found', 404);
  }

  const blogId = oldBlog._id;

  // 2. Perform the update
  const updatedBlog = await BlogPost.findByIdAndUpdate(blogId, data, { new: true, runValidators: true });

  // 3. Handle S3 image cleanup if the image URL has changed
  if (data.image && data.image.url && oldBlog.image && oldBlog.image.url) {
    if (data.image.url !== oldBlog.image.url) {
      const oldImageUrl = oldBlog.image.url;
      console.log(`[BlogService.update] Image changed. Scheduling deletion for: ${oldImageUrl}`);

      // 🛡️ SENIOR DEV FIX: Immediate deletion with robust logging
      // The grace period was causing issues with server restarts.
      // We rely on SafeImage.tsx on the frontend to handle potential temporary 403s.
      try {
        console.log(`[BlogService.update] Deleting old image from S3: ${oldImageUrl}`);
        const { deleteImageFromS3 } = require('../utils/s3Utils');
        await deleteImageFromS3(oldImageUrl, brandId);
      } catch (err) {
        console.error(`[BlogService.update] Error deleting old image:`, err.message);
      }
    }
  }

  console.log(`[BlogService.update] Successfully updated in DB. New status:`, updatedBlog.status);

  L1_CACHE.clear(); // 🧹 Clear memory cache on update
  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'updated', 'blog', id, updatedBlog);
  
  // 🔥 Revalidation Fix: Pass category slugs so the frontend clears specific category pages
  const categorySlug = updatedBlog.category?.slug;
  const oldCategorySlug = oldBlog.category?.slug;
  
  console.log(`[BlogService.update] Triggering revalidation for blog: ${updatedBlog.slug}, Category: ${categorySlug}`);
  
  callFrontendRevalidation('blog', updatedBlog.slug || id.toString(), brandId, { 
    categorySlug,
    oldCategorySlug 
  });
  return updatedBlog;
};

exports.delete = async (models, id) => {
  const { Blog: BlogPost, brandId } = models;

  const mongoose = require('mongoose');
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { slug: id };

  const blog = await BlogPost.findOneAndDelete(query);
  if (!blog) throw new AppError('Blog post not found', 404);

  // Clean up image from S3 on deletion
  if (blog.image && blog.image.url) {
    console.log(`[BlogService.delete] Deleting image from S3 on blog deletion: ${blog.image.url}`);
    deleteImageFromS3(blog.image.url, brandId);
  }

  L1_CACHE.clear(); // 🧹 Clear memory cache on delete
  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'deleted', 'blog', id, { id });
  // 🔥 Optimization: Don't wait for revalidation to finish (Prevents Deadlock in Dev)
  callFrontendRevalidation('blog', blog.slug || id.toString(), brandId, { action: 'deleted' });
  return null;
};

exports.updateEngagementMetrics = async (models, id, metrics) => {
  const { Blog: BlogPost } = models;
  const blog = await BlogPost.findByIdAndUpdate(
    id,
    metrics.views ? { $inc: { 'engagement.views': 1 } } : { $set: metrics },
    { new: true }
  );
  if (!blog) throw new AppError('Blog post not found', 404);
  return blog;
};