'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';
import SidebarCard from './SidebarCard';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  image?: string | { url: string; alt?: string };
  createdAt: string;
  author: string | { name: string; _id: string };
}

interface RecentBlogsProps {
  currentBlogId?: string;
  limit?: number;
}

export default function RecentBlogs({ currentBlogId, limit = 5 }: RecentBlogsProps) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentBlogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/blogs?limit=${limit}${currentBlogId ? `&exclude=${currentBlogId}` : ''}`);
        if (!response.ok) {
          throw new Error('Failed to fetch blogs');
        }
        const data = await response.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBlogs();
  }, [currentBlogId, limit]);

  const getAuthorName = (author: string | { name: string; _id: string }): string => {
    if (typeof author === 'string') {
      return author;
    }
    return author?.name || 'Unknown Author';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <SidebarCard title="Top Articles" icon="📚">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </SidebarCard>
    );
  }

  if (error) {
    return (
      <SidebarCard title="Top Articles" icon="📚">
        <p className="text-destructive text-sm font-medium">{error}</p>
      </SidebarCard>
    );
  }

  return (
    <SidebarCard title="Top Articles" icon="📚">
      {blogs.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-2xl">📝</span>
          </div>
          <p className="text-gray-500 text-sm mb-6">No recent blogs available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {blogs.slice(0, 3).map((blog) => {
            const imageUrl = typeof blog.image === 'string' ? blog.image : blog.image?.url;
            return (
              <Link
                key={blog._id}
                href={`/blog/${blog.slug}`}
                className="block group hover:bg-white/50 rounded-xl p-2 transition-all duration-200 border border-transparent hover:border-white/30"
              >
                <div className="flex gap-2">
                  {imageUrl && (
                    <div className="flex-shrink-0">
                      <SafeImage
                        src={imageUrl}
                        alt={blog.title}
                        width={96}
                        height={64}
                        className="rounded-lg object-cover w-24 h-16"
                        fallbackSrc="/image/travel_cat.png"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold text-foreground group-hover:text-primary line-clamp-2 mb-0.5 transition-colors`}>
                      {blog.title}
                    </h4>
                    {blog.shortDescription && (
                      <p className="text-xs text-foreground-secondary line-clamp-2 mb-1">
                        {blog.shortDescription}
                      </p>
                    )}

                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-border/50">
        <Link
          href="/blog"
          className="block text-center text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          View All Blogs →
        </Link>
      </div>
    </SidebarCard>
  );
}