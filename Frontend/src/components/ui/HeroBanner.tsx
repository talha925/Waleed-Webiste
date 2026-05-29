'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { Blog } from '@/lib/types/blog';
import { themeClasses } from '@/lib/theme/utils';
import { BannerCache } from '@/lib/cache/bannerCache';

interface HeroBannerProps {
  className?: string;
  initialBlogs?: Blog[];
}

export default function HeroBanner({ className = '', initialBlogs = [] }: HeroBannerProps) {
  const [bannerBlogs, setBannerBlogs] = useState<Blog[]>(initialBlogs);
  const [loading, setLoading] = useState(initialBlogs.length === 0);
  const [isFirstLoad, setIsFirstLoad] = useState(initialBlogs.length === 0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  // Initialize with cached data to prevent skeleton flicker
  useEffect(() => {
    // 💡 Performance Optimization: If server already gave us blogs, don't fetch on mount
    if (initialBlogs && initialBlogs.length > 0) {
      setBannerBlogs(initialBlogs);
      setLoading(false);
      setIsFirstLoad(false);
      return;
    }

    const cacheKey = 'heroBannerData_v11';
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        const isExpired = cacheAge > 5 * 60 * 1000; // 5 minutes

        // Always load cached data immediately for instant display
        if (data?.length > 0) {
          setBannerBlogs(data);
          setLoading(false);
          setIsFirstLoad(false);

          // If cache is expired, trigger a background refresh
          if (isExpired) {
            fetchBannerBlogs();
          }
        } else {
          // No cached data, need to fetch
          fetchBannerBlogs();
        }
      } catch (error) {
        console.error('Error parsing cached data:', error);
        localStorage.removeItem(cacheKey);
        fetchBannerBlogs();
      }
    } else {
      // No cache, fetch fresh data
      fetchBannerBlogs();
    }
  }, [initialBlogs]);

  // Cache invalidation function for urgent updates
  const invalidateCache = () => {
    localStorage.removeItem('heroBannerData_v11');
    fetchBannerBlogs(true);
  };

  // Listen for global cache invalidation events
  useEffect(() => {
    const handleCacheInvalidation = () => {
      fetchBannerBlogs(true);
    };

    window.addEventListener('bannerCacheInvalidated', handleCacheInvalidation);
    return () => {
      window.removeEventListener('bannerCacheInvalidated', handleCacheInvalidation);
    };
  }, []);

  const fetchBannerBlogs = async (forceRefresh = false) => {
    const cacheKey = 'heroBannerData_v11'; // Incremented version to ensure fresh data

    console.log('[HeroBanner] Starting fetch, forceRefresh:', forceRefresh);

    // Only check cache if not forcing refresh
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const cacheAge = Date.now() - timestamp;
          const isExpired = cacheAge > 5 * 60 * 1000; // 5 minutes

          console.log('[HeroBanner] Cache found, age:', cacheAge, 'expired:', isExpired, 'data count:', data?.length);

          // If cache is fresh and has data, use it immediately
          if (!isExpired && data?.length > 0) {
            console.log('[HeroBanner] Using cached data');
            setBannerBlogs(data);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('[HeroBanner] Error parsing cached data:', error);
        }
      }
    }

    try {
      console.log('[HeroBanner] Fetching from API: /api/blogs?frontBanner=true&sort=-createdAt&limit=50');
      // Request a high limit and sort descending by date directly from the backend
      const response = await fetch('/api/blogs?frontBanner=true&sort=-createdAt&limit=3');

      console.log('[HeroBanner] API Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[HeroBanner] API Response decoded:', result);

      let blogsArray = [];
      if (Array.isArray(result)) {
        blogsArray = result;
      } else if (result.blogs && Array.isArray(result.blogs)) {
        blogsArray = result.blogs;
      } else if (result.data?.blogs && Array.isArray(result.data.blogs)) {
        blogsArray = result.data.blogs;
      } else if (result.data && Array.isArray(result.data)) {
        blogsArray = result.data;
      }

      console.log(`[HeroBanner] Found ${blogsArray.length} blogs in response`);

      // Backend filtered, we just sort and take 3
      const filteredBlogs = Array.isArray(blogsArray) ? blogsArray
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.publishDate || 0).getTime();
          const dateB = new Date(b.createdAt || b.publishDate || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 3) : []; // Strictly 3 banners as per root requirements

      console.log('[HeroBanner] Final banner blogs count:', filteredBlogs.length);

      setBannerBlogs(filteredBlogs);
      setError(null); // Clear any previous errors

      // Cache the fresh data with current timestamp
      if (filteredBlogs.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: filteredBlogs,
          timestamp: Date.now()
        }));
        console.log('[HeroBanner] Cached new data');
      }

    } catch (error) {
      console.error('[HeroBanner] Error fetching banner blogs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load banner');
      // Only clear loading if we don't have cached data to show
      if (bannerBlogs.length === 0) {
        setBannerBlogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Removed redundant useEffect fetch on mount as handled by initialBlogs effect above

  // Refresh when window gains focus (user returns from admin panel)
  // Only refresh if user was away for more than 5 seconds to avoid tab switching issues
  useEffect(() => {
    let lastBlurTime = 0;

    const handleBlur = () => {
      lastBlurTime = Date.now();
    };

    const handleFocus = () => {
      const timeSinceBlur = Date.now() - lastBlurTime;
      // Only refresh if user was away for more than 5 seconds (likely from admin panel)
      if (timeSinceBlur > 5000) {
        fetchBannerBlogs(true); // Force refresh when returning from admin
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    if (bannerBlogs.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerBlogs.length);
      }, 6000); // 6 seconds per slide

      return () => clearInterval(interval);
    }
  }, [bannerBlogs.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerBlogs.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerBlogs.length) % bannerBlogs.length);
  };

  if (loading && isFirstLoad) {
    return (
      <div className={`relative h-[450px] md:h-80 lg:h-96 ${className} overflow-hidden mt-8 mb-12 rounded-3xl shadow-2xl`}>
        {/* Enhanced Shimmer Background */}
        <div className="absolute inset-0 bg-background-secondary animate-pulse" />

        {/* Shimmer Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear'
          }} />

        {/* Enhanced Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent backdrop-blur-md border border-white/20" />

        {/* Content Skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-700 px-6 md:px-12 max-w-5xl">
            {/* Title Skeleton */}
            <div className="h-10 md:h-14 lg:h-18 bg-background-tertiary rounded-2xl mb-6 animate-pulse shadow-lg" />
            <div className="h-6 md:h-8 bg-background-secondary rounded-xl mb-10 max-w-3xl mx-auto animate-pulse shadow-md" />
            {/* Button Skeleton */}
            <div className="h-14 w-48 bg-background-tertiary rounded-2xl mx-auto animate-pulse shadow-lg" />
          </div>
        </div>
        {/* CLS FIX: Pre-render invisible indicators so DOM structure is stable */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 opacity-0" aria-hidden="true">
          <div className="w-4 h-4 rounded-full bg-white/30" />
          <div className="w-4 h-4 rounded-full bg-white/30" />
          <div className="w-4 h-4 rounded-full bg-white/30" />
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[HeroBanner] Error state:', error);
    return (
      <div className={`relative h-[450px] md:h-80 lg:h-96 overflow-hidden rounded-3xl mt-8 mb-12 shadow-2xl ${className}`}>
        <div className={`absolute inset-0 bg-background-secondary`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 md:px-12 max-w-5xl">
            <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${themeClasses.text.primary}`}>Unable to Load Banner</h2>
            <p className={`text-lg ${themeClasses.text.secondary} mb-6`}>We're having trouble loading the featured content.</p>
            <button
              onClick={() => {
                setError(null);
                fetchBannerBlogs(true);
              }}
              disabled={loading}
              className={themeClasses.buttons.orange}
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bannerBlogs.length === 0) {
    return (
      <div className={`relative h-[450px] md:h-80 lg:h-96 overflow-hidden rounded-3xl mt-8 mb-12 shadow-2xl ${className}`}>
        <div className={`absolute inset-0 ${themeClasses.backgrounds.secondary}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 md:px-12 max-w-5xl">
            <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${themeClasses.text.primary}`}>No Featured Blogs</h2>
            <p className={`text-lg ${themeClasses.text.secondary} mb-6`}>No blogs are currently marked as front banner.</p>
            <button
              onClick={() => fetchBannerBlogs(true)} // Force refresh on manual click
              disabled={loading}
              className={themeClasses.buttons.orange}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentBlog = bannerBlogs[currentSlide];
  const imageUrl = currentBlog.image?.url || '';

  return (
    <div className={`relative h-[450px] md:h-80 lg:h-96 overflow-hidden rounded-3xl mt-8 mb-12 shadow-2xl group ${className}`}>
      {/* Background Image / Fallback */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <SafeImage
            src={imageUrl}
            alt={currentBlog.image?.alt || currentBlog.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-brand-to-accent opacity-20" />
        )}
        {/* Multi-layer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {/* Stronger Mobile Bottom Gradient for Text Readability */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/60 to-transparent md:hidden" />
      </div>

      {/* Glassmorphism Content Overlay */}
      <div className="absolute inset-0 flex items-end justify-center md:items-center md:justify-start pb-12 md:pb-0">
        <div className="text-center md:text-left text-white px-4 md:px-12 max-w-4xl mx-4 md:ml-12 lg:ml-16 w-full md:w-auto z-10">
          {/* Enhanced Glassmorphism Card (Desktop Only) / Clean Text (Mobile) */}
          <div className="md:backdrop-blur-lg md:bg-white/5 md:rounded-3xl p-2 md:p-6 md:border md:border-white/15 md:shadow-2xl md:hover:bg-white/8 transition-all duration-500">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 leading-relaxed text-white drop-shadow-2xl break-words max-w-full whitespace-pre-wrap">
              {currentBlog.title && currentBlog.title.length > 40
                ? currentBlog.title.replace(/(.{1,25})(\s|$)/g, '$1\n').trim()
                : currentBlog.title}
            </h1>
            <p className="text-sm md:text-base lg:text-lg mb-4 opacity-95 max-w-2xl leading-relaxed text-white/95 drop-shadow-lg break-words">
              {(() => {
                if (!currentBlog.shortDescription) return '';
                // Match title length - approximately 40-50 characters
                if (currentBlog.shortDescription.length <= 50) return currentBlog.shortDescription;
                return currentBlog.shortDescription.substring(0, 47) + '...';
              })()}
            </p>
            <Link
              href={`/blog/${currentBlog.slug || currentBlog._id}`}
              className="inline-flex items-center px-8 py-4 bg-gradient-vibrant text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group/btn uppercase tracking-widest text-xs"
            >
              <span>Explore Now</span>
              <svg
                className="ml-3 w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Hidden on Mobile, Visible on Tablet/Desktop */}
      {bannerBlogs.length > 1 && (
        <div className="hidden md:block">
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white w-14 h-14 rounded-2xl cursor-pointer z-10 flex items-center justify-center transition-all duration-500 border border-white/25 hover:border-white/40 shadow-xl hover:shadow-2xl hover:scale-110 group"
            aria-label="Previous blog"
          >
            <svg className="w-7 h-7 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white w-14 h-14 rounded-2xl cursor-pointer z-10 flex items-center justify-center transition-all duration-500 border border-white/25 hover:border-white/40 shadow-xl hover:shadow-2xl hover:scale-110 group"
            aria-label="Next blog"
          >
            <svg className="w-7 h-7 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Slide Indicators (only show if multiple blogs) */}
      {bannerBlogs.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {bannerBlogs.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-500 border-2 ${index === currentSlide
                ? 'bg-white border-white shadow-lg scale-125'
                : 'bg-white/30 border-white/50 hover:bg-white/60 hover:border-white/80 hover:scale-110'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
