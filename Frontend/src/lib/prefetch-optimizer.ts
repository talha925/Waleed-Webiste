interface PrefetchConfig {
  priority: 'high' | 'medium' | 'low';
  preload?: boolean;
  prefetch?: boolean;
  preconnect?: boolean;
  dnsPrefetch?: boolean;
}

interface ResourceHint {
  href: string;
  as?: string;
  type?: string;
  crossorigin?: string;
  rel: string;
}

class PrefetchOptimizer {
  private prefetchedUrls = new Set<string>();
  private preloadedUrls = new Set<string>();
  private observer: IntersectionObserver | null = null;
  private isEnabled = true;

  constructor() {
    this.initializeIntersectionObserver();
    this.setupNetworkAwareLoading();
  }

  // Initialize intersection observer for viewport-based prefetching
  private initializeIntersectionObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const href = element.getAttribute('data-prefetch-href');
            const priority = element.getAttribute('data-prefetch-priority') as PrefetchConfig['priority'];
            
            if (href) {
              this.prefetchUrl(href, { priority: priority || 'low' });
              this.observer?.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  // Setup network-aware loading
  private setupNetworkAwareLoading(): void {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Disable prefetching on slow connections
      if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
        this.isEnabled = false;
      }

      // Listen for connection changes
      connection?.addEventListener('change', () => {
        this.isEnabled = connection.effectiveType !== 'slow-2g' && connection.effectiveType !== '2g';
      });
    }
  }

  // Prefetch a URL
  prefetchUrl(url: string, config: PrefetchConfig = { priority: 'low' }): void {
    if (!this.isEnabled || this.prefetchedUrls.has(url)) {
      return;
    }

    this.prefetchedUrls.add(url);

    if (config.preload) {
      this.preloadResource(url, config);
    } else if (config.prefetch) {
      this.prefetchResource(url, config);
    } else {
      // Default to prefetch for low priority
      this.prefetchResource(url, config);
    }
  }

  // Preload critical resources
  preloadResource(url: string, config: PrefetchConfig): void {
    if (this.preloadedUrls.has(url)) {
      return;
    }

    this.preloadedUrls.add(url);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    // Determine resource type
    if (url.match(/\.(js|mjs)$/)) {
      link.as = 'script';
    } else if (url.match(/\.css$/)) {
      link.as = 'style';
    } else if (url.match(/\.(jpg|jpeg|png|webp|avif|svg)$/)) {
      link.as = 'image';
    } else if (url.match(/\.(woff|woff2|ttf|otf)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    }

    // Set priority
    if (config.priority === 'high') {
      link.setAttribute('importance', 'high');
    } else if (config.priority === 'low') {
      link.setAttribute('importance', 'low');
    }

    document.head.appendChild(link);
  }

  // Prefetch resources
  private prefetchResource(url: string, config: PrefetchConfig): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;

    if (config.priority === 'high') {
      link.setAttribute('importance', 'high');
    }

    document.head.appendChild(link);
  }

  // Preconnect to domains
  preconnectDomain(domain: string, crossorigin = false): void {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  }

  // DNS prefetch for domains
  dnsPrefetchDomain(domain: string): void {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  }

  // Prefetch page routes
  prefetchRoute(route: string, priority: PrefetchConfig['priority'] = 'low'): void {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(route, window.location.origin).href;
    this.prefetchUrl(url, { priority, prefetch: true });
  }

  // Prefetch API endpoints
  prefetchApi(endpoint: string, priority: PrefetchConfig['priority'] = 'low'): void {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(endpoint, window.location.origin).href;
    
    // Use fetch with cache for API prefetching
    if (!this.prefetchedUrls.has(url)) {
      this.prefetchedUrls.add(url);
      
      fetch(url, {
        method: 'GET',
        cache: 'force-cache',
        priority: priority as RequestPriority
      }).catch(() => {
        // Silently handle prefetch errors
        this.prefetchedUrls.delete(url);
      });
    }
  }

  // Observe element for viewport-based prefetching
  observeElement(element: HTMLElement, href: string, priority: PrefetchConfig['priority'] = 'low'): void {
    if (!this.observer) {
      return;
    }

    element.setAttribute('data-prefetch-href', href);
    element.setAttribute('data-prefetch-priority', priority);
    this.observer.observe(element);
  }

  // Prefetch critical resources for the current page
  prefetchCriticalResources(): void {
    // Prefetch common API endpoints
    this.prefetchApi('/api/stores', 'high');
    this.prefetchApi('/api/categories', 'high');
    this.prefetchApi('/api/coupons', 'medium');

    // Preconnect to external domains
    this.preconnectDomain('https://fonts.googleapis.com');
    this.preconnectDomain('https://fonts.gstatic.com', true);
    
    // DNS prefetch for potential external resources
    this.dnsPrefetchDomain('https://cdn.jsdelivr.net');
    this.dnsPrefetchDomain('https://unpkg.com');
  }

  // Prefetch resources based on user behavior
  prefetchBasedOnBehavior(): void {
    // Prefetch likely next pages based on current route
    const currentPath = window.location.pathname;
    
    if (currentPath === '/') {
      // From homepage, users likely go to stores or categories
      this.prefetchRoute('/stores', 'medium');
      this.prefetchRoute('/categories', 'medium');
    } else if (currentPath.startsWith('/store/')) {
      // From store page, users might go to coupons or other stores
      this.prefetchApi('/api/coupons', 'medium');
      this.prefetchRoute('/stores', 'low');
    } else if (currentPath.startsWith('/category/')) {
      // From category page, users might explore stores
      this.prefetchRoute('/stores', 'medium');
    }
  }

  // Prefetch images with lazy loading
  prefetchImages(images: string[], priority: PrefetchConfig['priority'] = 'low'): void {
    images.forEach(src => {
      if (!this.prefetchedUrls.has(src)) {
        this.prefetchedUrls.add(src);
        
        const img = new Image();
        img.src = src;
        
        // Set loading priority
        if (priority === 'high') {
          img.loading = 'eager';
        } else {
          img.loading = 'lazy';
        }
      }
    });
  }

  // Get prefetch statistics
  getStats(): { prefetched: number; preloaded: number } {
    return {
      prefetched: this.prefetchedUrls.size,
      preloaded: this.preloadedUrls.size
    };
  }

  // Clear prefetch cache
  clearCache(): void {
    this.prefetchedUrls.clear();
    this.preloadedUrls.clear();
  }

  // Cleanup
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.clearCache();
  }
}

// Singleton instance
export const prefetchOptimizer = new PrefetchOptimizer();

// Export types
export type { PrefetchConfig, ResourceHint };
export { PrefetchOptimizer };