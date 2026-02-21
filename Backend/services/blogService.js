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
    const { page = 1, limit = 9, status = 'published', categoryId, storeId, search, FrontBanner, sort = '-publishDate' } = queryParams;

    const cacheKey = cacheService.generateKey('blogs', { ...queryParams, brandId });
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) return cachedResult;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (FrontBanner !== undefined) query.FrontBanner = FrontBanner === 'true';
    if (categoryId) query['category.id'] = categoryId;
    if (storeId) query['store.id'] = storeId;
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await BlogPost.countDocuments(query);
    const blogs = await BlogPost.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('title slug shortDescription image.url image.alt author.name category.name category.slug status publishDate engagement.readingTime')
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
  try {
    const blog = await BlogPost.findById(id).lean();
    if (!blog) throw new AppError('Blog post not found', 404);
    const relatedPosts = await exports.getRelatedPosts(models, blog.category?.id, blog.store?.id, id);
    return { ...blog, relatedPosts };
  } catch (error) {
    throw error;
  }
};

exports.create = async (models, data) => {
  const { Blog: BlogPost, brandId } = models;
  const blog = await BlogPost.create(data);
  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'created', 'blog', blog._id, blog);
  await callFrontendRevalidation('blog', blog.slug || blog._id);
  return blog;
};

exports.update = async (models, id, data) => {
  const { Blog: BlogPost, brandId } = models;

  console.log(`[BlogService.update] Brand: ${brandId}, ID: ${id}`);

  // 1. Find the old blog to check for existing image
  const oldBlog = await BlogPost.findById(id);
  if (!oldBlog) {
    console.error(`[BlogService.update] Blog post not found: ${id}`);
    throw new AppError('Blog post not found', 404);
  }

  // 2. Perform the update
  const updatedBlog = await BlogPost.findByIdAndUpdate(id, data, { new: true, runValidators: true });

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
  await callFrontendRevalidation('blog', updatedBlog.slug || id);
  return updatedBlog;
};

exports.delete = async (models, id) => {
  const { Blog: BlogPost, brandId } = models;
  const blog = await BlogPost.findByIdAndDelete(id);
  if (!blog) throw new AppError('Blog post not found', 404);

  // Clean up image from S3 on deletion
  if (blog.image && blog.image.url) {
    console.log(`[BlogService.delete] Deleting image from S3 on blog deletion: ${blog.image.url}`);
    deleteImageFromS3(blog.image.url, brandId);
  }

  await cacheService.invalidateBlogCachesSafely(brandId);
  getWebSocketServer().notifyUpdate(models, 'deleted', 'blog', id, { id });
  await callFrontendRevalidation('blog', blog.slug || id, { action: 'deleted' });
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