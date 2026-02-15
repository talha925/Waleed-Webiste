'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BlogCard from './BlogCard';

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  author?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  status?: 'draft' | 'published';
  isFeatured?: boolean;
  image?: {
    url: string;
    alt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BlogListProps {
  apiEndpoint: string;
  title?: string;
  description?: string;
  showCreateButton?: boolean;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  isEmbedded?: boolean;
  initialPosts?: BlogPost[];
}

const BlogList: React.FC<BlogListProps> = ({
  apiEndpoint,
  title,
  description,
  showCreateButton = false,
  emptyStateMessage = "No Blog Posts Yet",
  emptyStateDescription = "Start creating amazing content with our blog form!",
  isEmbedded = false,
  initialPosts = []
}) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const BLOGS_PER_PAGE = 9;
  const [hasMore, setHasMore] = useState(initialPosts.length === BLOGS_PER_PAGE);

  const fetchBlogPosts = useCallback(async (pageNum: number, isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Construct URL with pagination parameters
      const separator = apiEndpoint.includes('?') ? '&' : '?';
      const url = `${apiEndpoint}${separator}page=${pageNum}&limit=${BLOGS_PER_PAGE}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        const newBlogs = data.blogs || [];
        const pagination = data.pagination;

        if (isInitialLoad) {
          setBlogPosts(newBlogs);
        } else {
          // Filter out duplicates just in case, though backend should handle pagination
          setBlogPosts(prev => {
            const existingIds = new Set(prev.map(b => b._id));
            const uniqueNewBlogs = newBlogs.filter((b: BlogPost) => !existingIds.has(b._id));
            return [...prev, ...uniqueNewBlogs];
          });
        }

        // Determine if there are more pages
        if (pagination) {
          // Check various pagination formats
          const totalPages = pagination.pages || pagination.totalPages || 0;
          const currentPage = pagination.page || pageNum;
          setHasMore(currentPage < totalPages);
        } else {
          // Fallback if pagination object is missing
          setHasMore(newBlogs.length === BLOGS_PER_PAGE);
        }

        // If we received fewer items than the limit, we've reached the end
        if (newBlogs.length < BLOGS_PER_PAGE) {
          setHasMore(false);
        }

      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch blog posts');
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to fetch blog posts. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [apiEndpoint]);

  // Initial load
  useEffect(() => {
    if (initialPosts.length === 0) {
      setPage(1);
      fetchBlogPosts(1, true);
    }
  }, [fetchBlogPosts, initialPosts.length]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogPosts(nextPage, false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center" role="status" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
            <p className="mt-6 text-lg text-gray-700 font-medium">Loading blog posts...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we fetch the latest content</p>

            {/* Skeleton loading cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 ${isEmbedded ? '' : 'max-w-6xl mx-auto'}`}>
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="flex justify-between mb-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center" role="alert" aria-live="assertive">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg mx-auto border-l-4 border-red-500">
              {/* Error Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Blog Posts</h2>
              <p className="text-gray-600 mb-6">{error}</p>

              <div className="space-y-3">
                <button
                  onClick={() => fetchBlogPosts(1, true)}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
                  aria-label="Retry loading blog posts"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>

                <Link
                  href="/blog"
                  className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Go to All Blogs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <>
      {/* Header - Only show if not embedded or title is explicitly provided */}
      {(!isEmbedded || title) && (
        <div className="text-center mb-12">
          {title && <h1 className="text-4xl font-bold text-gray-800 mb-4">{title}</h1>}
          {description && (
            <p className="text-gray-600 mb-8">{description}</p>
          )}
          {showCreateButton && (
            <Link
              href="/admin/blogs"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Blog Post
            </Link>
          )}
        </div>
      )}

      {/* Blog Posts Grid */}
      {blogPosts.length === 0 ? (
        <div className="text-center py-16" role="region" aria-label="Empty state">
          <div className="bg-white rounded-xl shadow-lg p-12 max-w-lg mx-auto">
            {/* Empty State Illustration */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-6">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-semibold text-gray-800 mb-3">{emptyStateMessage}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">{emptyStateDescription}</p>

            <div className="space-y-4">
              {showCreateButton && (
                <Link
                  href="/admin/blogs"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg"
                  aria-label="Create your first blog post"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Post
                </Link>
              )}

              <div className="pt-4">
                <Link
                  href="/blog"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors focus:outline-none focus:underline"
                >
                  Browse All Blog Posts →
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <BlogCard
                key={post._id}
                blog={post}
                variant="list"
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center px-8 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading More...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4">
        {content}
      </div>
    </div>
  );
};

export default BlogList;