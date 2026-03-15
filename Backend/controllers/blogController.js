const BlogService = require('../services/blogService');
const AppError = require('../errors/AppError');
const { catchAsync } = require('../utils/errorUtils');

exports.getBlogs = catchAsync(async (req, res) => {
  const result = await BlogService.findAll(req.models, req.query);

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Blog posts retrieved successfully',
    data: result.blogs,
    metadata: result.pagination
  });
});

exports.searchBlogs = catchAsync(async (req, res) => {
  const { q, search, query, page, limit } = req.query;
  const searchTerm = q || search || query;

  if (!searchTerm) {
    return res.status(200).json({
      success: true,
      data: [],
      metadata: { total: 0, page: 1, limit: limit || 10 }
    });
  }

  const result = await BlogService.findAll(req.models, {
    ...req.query,
    search: searchTerm,
    page: page || 1,
    limit: limit || 10
  });

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Blog search completed',
    data: result.blogs,
    metadata: result.pagination
  });
});

exports.getBlogById = catchAsync(async (req, res) => {
  const blog = await BlogService.findById(req.models, req.params.id);

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Blog post retrieved successfully',
    data: blog
  });
});

exports.createBlog = catchAsync(async (req, res) => {
  const blog = await BlogService.create(req.models, req.body);

  res.status(201).json({
    success: true,
    status: 'success',
    message: 'Blog post created successfully',
    data: blog
  });
});

exports.updateBlog = catchAsync(async (req, res) => {
  const blog = await BlogService.update(req.models, req.params.id, req.body);

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Blog post updated successfully',
    data: blog
  });
});

exports.deleteBlog = catchAsync(async (req, res) => {
  await BlogService.delete(req.models, req.params.id);

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Blog post deleted successfully',
    data: null
  });
});

// Additional endpoints for engagement
exports.getRelatedPosts = catchAsync(async (req, res) => {
  const { categoryId, storeId, limit } = req.query;
  const relatedPosts = await BlogService.getRelatedPosts(
    req.models,
    categoryId,
    storeId,
    req.params.id,
    parseInt(limit) || 3
  );

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Related posts retrieved successfully',
    data: relatedPosts
  });
});

exports.updateEngagement = catchAsync(async (req, res) => {
  const blog = await BlogService.updateEngagementMetrics(
    req.models,
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    status: 'success',
    message: 'Engagement metrics updated successfully',
    data: blog
  });
});
