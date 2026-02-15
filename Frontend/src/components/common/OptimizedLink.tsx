'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface OptimizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchPriority?: 'high' | 'medium' | 'low';
  prefetchOnHover?: boolean;
  prefetchOnVisible?: boolean;
  prefetch?: boolean;
  [key: string]: any;
}

const OptimizedLink: React.FC<OptimizedLinkProps> = ({
  href,
  children,
  className = '',
  prefetchPriority = 'medium',
  prefetchOnHover = true,
  prefetchOnVisible = false,
  prefetch = true,
  ...props
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const {
    handleMouseEnter,
    handleMouseLeave,
    observeForPrefetch
  } = usePerformanceOptimization({
    enablePrefetch: prefetch,
    prefetchOnHover,
    prefetchOnVisible
  });

  // Set up viewport-based prefetching
  useEffect(() => {
    if (prefetchOnVisible && linkRef.current) {
      observeForPrefetch(linkRef.current, href, prefetchPriority);
    }
  }, [href, prefetchPriority, prefetchOnVisible, observeForPrefetch]);

  const handleMouseEnterEvent = () => {
    if (prefetchOnHover) {
      handleMouseEnter(href, prefetchPriority);
    }
  };

  const handleMouseLeaveEvent = () => {
    if (prefetchOnHover) {
      handleMouseLeave();
    }
  };

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      onMouseEnter={handleMouseEnterEvent}
      onMouseLeave={handleMouseLeaveEvent}
      prefetch={false} // We handle prefetching manually for better control
      {...props}
    >
      {children}
    </Link>
  );
};

export default OptimizedLink;