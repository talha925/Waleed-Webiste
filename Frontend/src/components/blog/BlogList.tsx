'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import BlogCard from './BlogCard';
import { themeClasses } from '@/lib/theme/utils';
import { useBrand } from '@/context/BrandContext';

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
  layout?: 'grid' | 'bento';
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
  layout = 'grid',
  initialPosts = []
}) => {
  const brand = useBrand();
  const isNeonGlass = brand?.cardStyle === 'neon-glass' || brand?.brandId === 'specreveal' || brand?.brandId === 'trendfiltered';

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const BLOGS_PER_PAGE = 9;
  const [hasMore, setHasMore] = useState(initialPosts.length === BLOGS_PER_PAGE);

  // Strict deduplication by _id / slug to guarantee zero duplicate keys or duplicate articles
  const uniquePosts = useMemo(() => {
    const seen = new Set<string>();
    return blogPosts.filter((post) => {
      const id = post._id || post.slug;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [blogPosts]);

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

      const response = await fetch(url, {
        cache: 'no-store', // Prevent browser disk cache for listing
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });

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
    } else {
      setBlogPosts(initialPosts);
      setLoading(false);
    }
  }, [fetchBlogPosts, initialPosts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlogPosts(nextPage, false);
  };

  if (loading && initialPosts.length === 0) {
    const skeletonGrid = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[400px]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-6 space-y-4">
            <div className="bg-slate-200 h-48 rounded-2xl w-full" />
            <div className="space-y-3">
              <div className="bg-slate-200 h-4 rounded-full w-2/3" />
              <div className="bg-slate-200 h-3 rounded-full w-full" />
              <div className="bg-slate-200 h-3 rounded-full w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );

    if (isEmbedded) return skeletonGrid;
    return <div className="container mx-auto px-4 py-12">{skeletonGrid}</div>;
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
          {layout === 'bento' && uniquePosts.length >= 2 ? (
            <div className="space-y-8">
              {/* Bento Magazine Top Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Main Hero Spotlight Story (7 cols on lg) */}
                <div className="lg:col-span-7">
                  <BlogCard
                    blog={uniquePosts[0]}
                    variant="hero"
                    priority={true}
                  />
                </div>

                {/* Secondary Stories Stacked (5 cols on lg) */}
                <div className="lg:col-span-5 flex flex-col gap-6 justify-start">
                  {uniquePosts.slice(1, 3).map((post, idx) => (
                    <div key={post._id || post.slug || `post-${idx}`} className="w-full">
                      <BlogCard
                        blog={post}
                        variant="horizontal"
                        priority={idx === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Remaining Posts Grid (if any) */}
              {uniquePosts.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                  {uniquePosts.slice(3).map((post, idx) => (
                    <BlogCard
                      key={post._id || post.slug || `post-${idx}`}
                      blog={post}
                      variant="grid"
                      priority={false}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : layout === 'bento' && uniquePosts.length === 1 ? (
            <div className="max-w-4xl mx-auto">
              <BlogCard
                blog={uniquePosts[0]}
                variant="hero"
                priority={true}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {uniquePosts.map((post, idx) => (
                <BlogCard
                  key={post._id || post.slug || `post-${idx}`}
                  blog={post}
                  variant="grid"
                  priority={idx < 3}
                />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-12 text-center">
              {isNeonGlass ? (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl border-2 border-brand-primary/40 text-brand-primary font-bold hover:bg-brand-primary hover:text-white transition-all duration-300 uppercase tracking-wider text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <span>{loadingMore ? 'Loading More...' : 'Load More Stories'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${loadingMore ? 'animate-spin' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-accent text-[#0F3D5E] border-2 border-[#0F3D5E] font-black rounded-full shadow-[3px_3px_0_0_#0F3D5E] hover:shadow-[1px_1px_0_0_#0F3D5E] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[3px] active:translate-y-[3px] uppercase tracking-wider text-xs transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <span>{loadingMore ? 'Loading More...' : 'Load More'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${loadingMore ? 'animate-spin' : ''}`} />
                </button>
              )}
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