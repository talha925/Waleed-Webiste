  'use client';

  import { useEffect, useCallback, useRef } from 'react';
  import { prefetchOptimizer } from '@/lib/prefetch-optimizer';
  import { coreWebVitalsMonitor } from '@/lib/core-web-vitals';

  interface UsePerformanceOptimizationOptions {
    enablePrefetch?: boolean;
    enableWebVitals?: boolean;
    enableSmartPrefetch?: boolean;
    prefetchOnHover?: boolean;
    prefetchOnVisible?: boolean;
  }

  export const usePerformanceOptimization = (
    options: UsePerformanceOptimizationOptions = {}
  ) => {
    const {
      enablePrefetch = true,
      enableWebVitals = true,
      enableSmartPrefetch = true,
      prefetchOnHover = true,
      prefetchOnVisible = true
    } = options;

    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const observedElementsRef = useRef<Set<HTMLElement>>(new Set());

    // Initialize performance optimization
    useEffect(() => {
      if (enablePrefetch) {
        // Prefetch critical resources on mount
        prefetchOptimizer.prefetchCriticalResources();
        
        if (enableSmartPrefetch) {
          // Smart prefetch based on user behavior
          const timer = setTimeout(() => {
            prefetchOptimizer.prefetchBasedOnBehavior();
          }, 2000);
          
          return () => clearTimeout(timer);
        }
      }
    }, [enablePrefetch, enableSmartPrefetch]);

    // Prefetch on hover
    const handleMouseEnter = useCallback((href: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
      if (!enablePrefetch || !prefetchOnHover) return;

      hoverTimeoutRef.current = setTimeout(() => {
        prefetchOptimizer.prefetchRoute(href, priority);
      }, 100); // Small delay to avoid prefetching on accidental hovers
    }, [enablePrefetch, prefetchOnHover]);

    const handleMouseLeave = useCallback(() => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    }, []);

    // Prefetch when element becomes visible
    const observeForPrefetch = useCallback((
      element: HTMLElement, 
      href: string, 
      priority: 'high' | 'medium' | 'low' = 'low'
    ) => {
      if (!enablePrefetch || !prefetchOnVisible || observedElementsRef.current.has(element)) {
        return;
      }

      observedElementsRef.current.add(element);
      prefetchOptimizer.observeElement(element, href, priority);
    }, [enablePrefetch, prefetchOnVisible]);

    // Prefetch API endpoints
    const prefetchApi = useCallback((
      endpoint: string, 
      priority: 'high' | 'medium' | 'low' = 'medium'
    ) => {
      if (!enablePrefetch) return;
      prefetchOptimizer.prefetchApi(endpoint, priority);
    }, [enablePrefetch]);

    // Prefetch images
    const prefetchImages = useCallback((
      images: string[], 
      priority: 'high' | 'medium' | 'low' = 'low'
    ) => {
      if (!enablePrefetch) return;
      prefetchOptimizer.prefetchImages(images, priority);
    }, [enablePrefetch]);

    // Preconnect to external domains
    const preconnectDomain = useCallback((domain: string, crossorigin = false) => {
      if (!enablePrefetch) return;
      prefetchOptimizer.preconnectDomain(domain, crossorigin);
    }, [enablePrefetch]);

    // Get performance metrics
    const getWebVitalsScore = useCallback(() => {
      if (!enableWebVitals) return 0;
      return coreWebVitalsMonitor.getScore();
    }, [enableWebVitals]);

    const getWebVitalsMetrics = useCallback(() => {
      if (!enableWebVitals) return new Map();
      return coreWebVitalsMonitor.getMetrics();
    }, [enableWebVitals]);

    const getOptimizationSuggestions = useCallback(() => {
      if (!enableWebVitals) return [];
      return coreWebVitalsMonitor.getOptimizationSuggestions();
    }, [enableWebVitals]);

    // Performance-aware image loading
    const getOptimalImageProps = useCallback((src: string, alt: string) => {
      const connection = (navigator as any)?.connection;
      const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g'
      );

      return {
        src,
        alt,
        loading: 'lazy' as const,
        decoding: 'async' as const,
        ...(isSlowConnection && {
          // Use smaller images on slow connections
          sizes: '(max-width: 768px) 50vw, 25vw'
        })
      };
    }, []);

    // Performance-aware component rendering
    const shouldRenderComponent = useCallback((priority: 'high' | 'medium' | 'low') => {
      const connection = (navigator as any)?.connection;
      const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g'
      );

      // On slow connections, only render high priority components immediately
      if (isSlowConnection && priority !== 'high') {
        return false;
      }

      return true;
    }, []);

    // Cleanup
    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        observedElementsRef.current.clear();
      };
    }, []);

    return {
      // Prefetch methods
      prefetchApi,
      prefetchImages,
      preconnectDomain,
      observeForPrefetch,
      
      // Event handlers for hover prefetching
      handleMouseEnter,
      handleMouseLeave,
      
      // Web Vitals methods
      getWebVitalsScore,
      getWebVitalsMetrics,
      getOptimizationSuggestions,
      
      // Performance-aware utilities
      getOptimalImageProps,
      shouldRenderComponent,
      
      // Stats
      getPrefetchStats: () => prefetchOptimizer.getStats(),
      
      // Manual controls
      clearPrefetchCache: () => prefetchOptimizer.clearCache(),
      prefetchCriticalResources: () => prefetchOptimizer.prefetchCriticalResources(),
      prefetchBasedOnBehavior: () => prefetchOptimizer.prefetchBasedOnBehavior()
    };
  };