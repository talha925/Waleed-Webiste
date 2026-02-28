'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BlogCard from './BlogCard';
import { themeClasses } from '@/lib/theme/utils';

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
          setBlogPosts(prev => {
            const existingIds = new Set(prev.map(b => b._id));
            const uniqueNewBlogs = newBlogs.filter((b: BlogPost) => !existingIds.has(b._id));
            return [...prev, ...uniqueNewBlogs];
          });
        }

        if (pagination) {
          const totalPages = pagination.pages || pagination.totalPages || 0;
          const currentPage = pagination.page || pageNum;
          setHasMore(currentPage < totalPages);
        } else {
          setHasMore(newBlogs.length === BLOGS_PER_PAGE);
        }

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
      <div className="min-h-[400px] flex flex-col items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary shadow-lg"></div>
        <p className={`mt-6 text-lg ${themeClasses.text.primary} font-medium`}>Loading blog posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 flex justify-center">
        <div className="bg-card rounded-2xl shadow-xl p-8 max-w-lg mx-auto border-l-4 border-destructive">
          <h2 className={`text-xl font-semibold ${themeClasses.text.primary} mb-2`}>Unable to Load Blog Posts</h2>
          <p className={`${themeClasses.text.secondary} mb-6`}>{error}</p>
          <button
            onClick={() => fetchBlogPosts(1, true)}
            className={themeClasses.buttons.orange}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const content = (
    <>
      {(!isEmbedded || title) && (
        <div className="text-center mb-12">
          {title && <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-4`}>{title}</h1>}
          {description && (
            <p className={`${themeClasses.text.secondary} mb-8`}>{description}</p>
          )}
          {showCreateButton && (
            <Link
              href="/admin/blogs"
              className={themeClasses.buttons.orange}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Blog Post
            </Link>
          )}
        </div>
      )}

      {blogPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-card rounded-2xl shadow-lg p-12 max-w-lg mx-auto">
            <h3 className={`text-2xl font-semibold ${themeClasses.text.primary} mb-3`}>{emptyStateMessage}</h3>
            <p className={`${themeClasses.text.secondary} mb-8 leading-relaxed`}>{emptyStateDescription}</p>
            {showCreateButton && (
              <Link
                href="/admin/blogs"
                className={themeClasses.buttons.orange}
              >
                Create Your First Post
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <BlogCard
                key={post._id}
                blog={post}
                variant="list"
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-12 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={themeClasses.buttons.orange}
              >
                {loadingMore ? 'Loading More...' : 'Load More'}
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
    <div className="container mx-auto px-4 py-12">
      {content}
    </div>
  );
};

export default BlogList;