const slugify = require('slugify');
const sanitizeHtml = require('sanitize-html');

// Generate SEO-friendly slug from blog title
exports.generateSlug = (title) => slugify(title, {
  lower: true,
  strict: true,
  remove: /[*+~.()'"!:@]/g
});

// Sanitize HTML content to prevent malicious XSS scripts while preserving rich styling, carousels, and embeds
exports.sanitizeContent = (content) => {
  if (!content || typeof content !== 'string') return content;
  return sanitizeHtml(content, {
    allowedTags: false,
    allowedAttributes: false,
    allowVulnerableTags: true
  });
};

// Calculate reading time (in minutes) from plain text (200 words per min)
exports.calculateReadingTime = (content) => {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const wordsPerMinute = 200;
  return Math.ceil(words.length / wordsPerMinute);
};

// Standardize blog response (convert _id to id, etc.)
exports.formatBlogResponse = (blog) => ({
  id: blog._id,
  title: blog.title,
  slug: blog.slug,
  shortDescription: blog.shortDescription,
  longDescription: blog.longDescription,
  image: blog.image,
  meta: blog.meta,
  author: blog.author,
  category: blog.category,
  store: blog.store,
  seo: blog.seo,
  engagement: blog.engagement,
  navigation: blog.navigation,
  tags: blog.tags,
  status: blog.status,
  isFeaturedForHome: blog.isFeaturedForHome,
  publishDate: blog.publishDate,
  lastUpdated: blog.lastUpdated,
  version: blog.version,
  createdAt: blog.createdAt,
  updatedAt: blog.updatedAt
});
