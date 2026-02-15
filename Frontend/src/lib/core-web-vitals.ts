// Declare gtag function for TypeScript
declare global {
  function gtag(...args: any[]): void;
}

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface WebVitalsThresholds {
  good: number;
  needsImprovement: number;
}

interface WebVitalsConfig {
  enableAnalytics: boolean;
  enableConsoleLogging: boolean;
  enablePerformanceObserver: boolean;
  sampleRate: number;
}

class CoreWebVitalsMonitor {
  private config: WebVitalsConfig;
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private observers: PerformanceObserver[] = [];
  
  // Web Vitals thresholds (in milliseconds)
  private readonly thresholds: Record<string, WebVitalsThresholds> = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FID: { good: 100, needsImprovement: 300 },
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 800, needsImprovement: 1800 },
    INP: { good: 200, needsImprovement: 500 }
  };

  constructor(config: Partial<WebVitalsConfig> = {}) {
    this.config = {
      enableAnalytics: true,
      enableConsoleLogging: false,
      enablePerformanceObserver: true,
      sampleRate: 1,
      ...config
    };

    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring(): void {
    // Initialize performance observers
    if (this.config.enablePerformanceObserver) {
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();
      this.observeINP();
    }

    // Monitor page visibility changes
    this.observePageVisibility();
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[name];
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private reportMetric(metric: WebVitalsMetric): void {
    this.metrics.set(metric.name, metric);

    if (this.config.enableConsoleLogging) {
      console.log(`[Web Vitals] ${metric.name}:`, metric);
    }

    if (this.config.enableAnalytics && Math.random() <= this.config.sampleRate) {
      this.sendToAnalytics(metric);
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('web-vitals-metric', { detail: metric }));
  }

  private sendToAnalytics(metric: WebVitalsMetric): void {
    // Send to analytics service (Google Analytics, etc.)
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        custom_map: {
          metric_id: metric.id,
          metric_rating: metric.rating,
          metric_delta: metric.delta
        }
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    }).catch(() => {
      // Silently handle analytics errors
    });
  }

  // Largest Contentful Paint (LCP)
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { size?: number };
      
      if (lastEntry) {
        const metric: WebVitalsMetric = {
          name: 'LCP',
          value: lastEntry.startTime,
          rating: this.getRating('LCP', lastEntry.startTime),
          delta: lastEntry.startTime - (this.metrics.get('LCP')?.value || 0),
          id: this.generateId(),
          navigationType: this.getNavigationType()
        };
        
        this.reportMetric(metric);
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Fallback for browsers that don't support LCP
    }
  }

  // First Input Delay (FID)
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const metric: WebVitalsMetric = {
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          rating: this.getRating('FID', entry.processingStart - entry.startTime),
          delta: (entry.processingStart - entry.startTime) - (this.metrics.get('FID')?.value || 0),
          id: this.generateId(),
          navigationType: this.getNavigationType()
        };
        
        this.reportMetric(metric);
      });
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Fallback for browsers that don't support FID
    }
  }

  // Cumulative Layout Shift (CLS)
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue && 
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            
            const metric: WebVitalsMetric = {
              name: 'CLS',
              value: clsValue,
              rating: this.getRating('CLS', clsValue),
              delta: clsValue - (this.metrics.get('CLS')?.value || 0),
              id: this.generateId(),
              navigationType: this.getNavigationType()
            };
            
            this.reportMetric(metric);
          }
        }
      });
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Fallback for browsers that don't support CLS
    }
  }

  // First Contentful Paint (FCP)
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          const metric: WebVitalsMetric = {
            name: 'FCP',
            value: entry.startTime,
            rating: this.getRating('FCP', entry.startTime),
            delta: entry.startTime - (this.metrics.get('FCP')?.value || 0),
            id: this.generateId(),
            navigationType: this.getNavigationType()
          };
          
          this.reportMetric(metric);
        }
      });
    });

    try {
      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Fallback for browsers that don't support FCP
    }
  }

  // Time to First Byte (TTFB)
  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.responseStart > 0) {
          const metric: WebVitalsMetric = {
            name: 'TTFB',
            value: entry.responseStart,
            rating: this.getRating('TTFB', entry.responseStart),
            delta: entry.responseStart - (this.metrics.get('TTFB')?.value || 0),
            id: this.generateId(),
            navigationType: this.getNavigationType()
          };
          
          this.reportMetric(metric);
        }
      });
    });

    try {
      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Fallback for browsers that don't support TTFB
    }
  }

  // Interaction to Next Paint (INP)
  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return;

    let longestInteraction = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const duration = entry.processingEnd - entry.startTime;
        if (duration > longestInteraction) {
          longestInteraction = duration;
          
          const metric: WebVitalsMetric = {
            name: 'INP',
            value: duration,
            rating: this.getRating('INP', duration),
            delta: duration - (this.metrics.get('INP')?.value || 0),
            id: this.generateId(),
            navigationType: this.getNavigationType()
          };
          
          this.reportMetric(metric);
        }
      });
    });

    try {
      observer.observe({ type: 'event', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // Fallback for browsers that don't support INP
    }
  }

  private observePageVisibility(): void {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Report final metrics when page becomes hidden
        this.reportFinalMetrics();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => this.reportFinalMetrics());
  }

  private reportFinalMetrics(): void {
    // Report final values for all metrics
    this.metrics.forEach((metric) => {
      this.sendToAnalytics(metric);
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNavigationType(): string {
    if ('navigation' in performance) {
      const nav = performance.navigation as any;
      return nav.type === 1 ? 'reload' : nav.type === 2 ? 'back-forward' : 'navigate';
    }
    return 'navigate';
  }

  // Public methods
  getMetrics(): Map<string, WebVitalsMetric> {
    return new Map(this.metrics);
  }

  getMetric(name: string): WebVitalsMetric | undefined {
    return this.metrics.get(name);
  }

  getScore(): number {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length === 0) return 0;

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    return Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length);
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    const lcp = this.metrics.get('LCP');
    if (lcp && lcp.rating !== 'good') {
      suggestions.push('Optimize Largest Contentful Paint: Consider image optimization, preloading critical resources, or improving server response times.');
    }

    const fid = this.metrics.get('FID');
    if (fid && fid.rating !== 'good') {
      suggestions.push('Improve First Input Delay: Reduce JavaScript execution time, split long tasks, or use web workers.');
    }

    const cls = this.metrics.get('CLS');
    if (cls && cls.rating !== 'good') {
      suggestions.push('Fix Cumulative Layout Shift: Set dimensions for images and embeds, avoid inserting content above existing content.');
    }

    const fcp = this.metrics.get('FCP');
    if (fcp && fcp.rating !== 'good') {
      suggestions.push('Optimize First Contentful Paint: Eliminate render-blocking resources, minify CSS, or improve server response times.');
    }

    return suggestions;
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Singleton instance
export const coreWebVitalsMonitor = new CoreWebVitalsMonitor();

// Export types
export type { WebVitalsMetric, WebVitalsConfig, WebVitalsThresholds };
export { CoreWebVitalsMonitor };