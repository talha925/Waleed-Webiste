'use client';

import BlogList from '@/components/blog/BlogList';

const BlogPage = () => {
  return (
    <BlogList
      apiEndpoint="/api/blogs"
      title="Blog Posts"
      description="View and manage all your blog posts"
      showCreateButton={false}
      emptyStateMessage="No Blog Posts Yet"
      emptyStateDescription="Start creating amazing content with our blog form!"
    />
  );
};

export default BlogPage;