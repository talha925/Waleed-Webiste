const AppError = require('../errors/AppError');
const cacheService = require('./cacheService');
const { getWebSocketServer } = require('../lib/websocket-server');
const { callFrontendRevalidation } = require('../utils/revalidationUtils');
const { deleteImageFromS3 } = require('../utils/s3Utils');

// ✅ Optimized helper for related posts
exports.getRelatedPosts = async (models, categoryId, storeId, excludeId, limit = 5) => {
  const { Blog: BlogPost, brandId } = models;
  try {
    if (!categoryId && !storeId) return [];

    const cacheKey = cacheService.generateKey('related_posts', { excludeId, brandId });
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const query = { _id: { $ne: excludeId }, status: 'published', $or: [] };
    if (categoryId) query.$or.push({ 'category.id': categoryId });
    if (storeId) query.$or.push({ 'store.id': storeId });
    if (query.$or.length === 0) delete query.$or;

    const relatedPosts = await BlogPost.find(query)
      .sort({ createdAt: -1 })
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
      slug, // 🔥 Added direct slug lookup for massive performance boost
      sort = '-createdAt'
    } = queryParams;

    const cacheKey = cacheService.generateKey('blogs', { ...queryParams, brandId });
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) return cachedResult;

    const query = {};
    if (status && status !== 'all') query.status = status;

    // Normalize FrontBanner / frontBanner (case-insensitive and type-safe)
    const bannerVal = FrontBanner !== undefined ? FrontBanner : frontBanner;
    if (bannerVal !== undefined) {
      query.FrontBanner = bannerVal === 'true' || bannerVal === true;
    }

    // Support isFeaturedForHome filtering
    if (isFeaturedForHome !== undefined) {
      query.isFeaturedForHome = isFeaturedForHome === 'true' || isFeaturedForHome === true;
    }

    // Support generic featured filtering
    if (featured !== undefined) {
      query.isFeatured = featured === 'true' || featured === true;
    }

    if (categoryId) query['category.id'] = categoryId;
    if (category) query['category.slug'] = category;
    if (storeId) query['store.id'] = storeId;
    if (slug) query.slug = slug;
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await BlogPost.countDocuments(query);
    const blogs = await BlogPost.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('title slug shortDescription image.url image.alt author.name category.name category.slug category.id store.id status publishDate engagement.readingTime FrontBanner isFeaturedForHome isFeatured createdAt')
      .lean();

    const result = {
      blogs,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    };

    await cacheService.set(cacheKey, result, 300);
    return result;
  } catch (error) {
    throw new AppError('Failed to fetch blog posts', 500);
  }
};

exports.findById = async (models, id) => {
  const { Blog: BlogPost } = models;
  const mongoose = require('mongoose');
  try {
    if (!id || id === 'undefined') throw new AppError('Valid ID or Slug is required', 400);

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const blog = await BlogPost.findOne(query).lean();
    if (!blog) throw new AppError('Blog post not found', 404);

    // Fetch related posts but don't let it crash the main request
    let relatedPosts = [];
    try {
      relatedPosts = await exports.getRelatedPosts(models, blog.category?.id, blog.store?.id, blog._id);
    } catch (relErr) {
      console.error(`[BlogService.findById] Non-fatal error fetching related posts:`, relErr.message);
    }

    return { ...blog, relatedPosts };
  } catch (error) {
    console.error(`[BlogService.findById] Error fetching blog [${id}]:`, error);
    throw error;
  }
};

exports.create = async (models, data) => {
  const { Blog: BlogPost, brandId } = models;
  const blog = await BlogPost.create(data);
  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'created', 'blog', blog._id, blog);
  // 🔥 Optimization: Don't wait for revalidation to finish (Prevents Deadlock in Dev)
  callFrontendRevalidation('blog', blog.slug || blog._id, brandId);
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
      console.log(`[BlogService.update] Image changed. Deleting old image: ${oldBlog.image.url}`);
      // Don't wait for S3 deletion to complete to keep the response fast
      deleteImageFromS3(oldBlog.image.url, brandId);
    }
  }

  console.log(`[BlogService.update] Successfully updated in DB. New status:`, updatedBlog.status);

  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'updated', 'blog', id, updatedBlog);
  // 🔥 Optimization: Don't wait for revalidation to finish (Prevents Deadlock in Dev)
  callFrontendRevalidation('blog', updatedBlog.slug || id, brandId);
  return updatedBlog;
};

exports.delete = async (models, id) => {
  const { Blog: BlogPost, brandId } = models;

  const mongoose = require('mongoose');
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const query = isObjectId ? { _id: id } : { slug: id };

  const blog = await BlogPost.findOne(query);
  if (!blog) throw new AppError('Blog post not found', 404);

  const blogId = blog._id;
  await BlogPost.findByIdAndDelete(blogId);

  // Clean up image from S3 on deletion
  if (blog.image && blog.image.url) {
    console.log(`[BlogService.delete] Deleting image from S3 on blog deletion: ${blog.image.url}`);
    deleteImageFromS3(blog.image.url, brandId);
  }

  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'deleted', 'blog', id, { id });
  // 🔥 Optimization: Don't wait for revalidation to finish (Prevents Deadlock in Dev)
  callFrontendRevalidation('blog', blog.slug || id, brandId, { action: 'deleted' });
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