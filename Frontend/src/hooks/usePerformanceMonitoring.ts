'use client';

import { useEffect, useCallback } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface UsePerformanceMonitoringOptions {
  enableLogging?: boolean;
  enableAnalytics?: boolean;
  thresholds?: {
    fcp?: { good: number; poor: number };
    lcp?: { good: number; poor: number };
    fid?: { good: number; poor: number };
    cls?: { good: number; poor: number };
    ttfb?: { good: number; poor: number };
  };
}

const defaultThresholds = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 }
};

export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions = {}) => {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    enableAnalytics = process.env.NODE_ENV === 'production',
    thresholds = defaultThresholds
  } = options;

  const sendToAnalytics = useCallback((metric: PerformanceMetric) => {
    if (!enableAnalytics) return;

    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.value),
        custom_map: {
          metric_rating: metric.rating,
          metric_delta: metric.delta
        }
      });
    }

    // Send to custom analytics endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        url: window.location.href,
        timestamp: Date.now()
      })
    }).catch(error => {
      if (enableLogging) {
        console.warn('Failed to send web vitals to analytics:', error);
      }
    });
  }, [enableAnalytics, enableLogging]);

  const logMetric = useCallback((metric: PerformanceMetric) => {
    if (!enableLogging) return;

    const color = metric.rating === 'good' ? 'green' : metric.rating === 'needs-improvement' ? 'orange' : 'red';
    console.log(
      `%c${metric.name}: ${metric.value}ms (${metric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }, [enableLogging]);

  const handleMetric = useCallback((metric: any) => {
    const thresholdKey = metric.name.toLowerCase() as keyof typeof thresholds;
    const threshold = thresholds[thresholdKey];
    
    let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
    if (threshold) {
      if (metric.value > threshold.poor) {
        rating = 'poor';
      } else if (metric.value > threshold.good) {
        rating = 'needs-improvement';
      }
    }

    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating,
      delta: metric.delta,
      id: metric.id
    };

    logMetric(performanceMetric);
    sendToAnalytics(performanceMetric);
  }, [logMetric, sendToAnalytics, thresholds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // Monitor additional performance metrics
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // DOM Content Loaded
          const dcl = navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart;
          if (dcl > 0) {
            handleMetric({
              name: 'DCL',
              value: dcl,
              delta: 0,
              id: `dcl-${Date.now()}`
            });
          }

          // Page Load Time
          const plt = navEntry.loadEventEnd - navEntry.loadEventStart;
          if (plt > 0) {
            handleMetric({
              name: 'PLT',
              value: plt,
              delta: 0,
              id: `plt-${Date.now()}`
            });
          }
        }

        // Monitor long tasks
        if (entry.entryType === 'longtask') {
          handleMetric({
            name: 'Long Task',
            value: entry.duration,
            delta: 0,
            id: `longtask-${Date.now()}`
          });
        }
      });
    });

    // Observe navigation and long tasks
    try {
      observer.observe({ entryTypes: ['navigation', 'longtask'] });
    } catch (error) {
      if (enableLogging) {
        console.warn('Performance observer not supported:', error);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [handleMetric, enableLogging]);

  // Monitor resource loading performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkSlowResources = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      resources.forEach((resource) => {
        const loadTime = resource.responseEnd - resource.requestStart;
        
        // Flag slow resources (>2s)
        if (loadTime > 2000) {
          if (enableLogging) {
            console.warn(`Slow resource detected: ${resource.name} (${loadTime}ms)`);
          }
          
          if (enableAnalytics) {
            sendToAnalytics({
              name: 'Slow Resource',
              value: loadTime,
              rating: 'poor',
              delta: 0,
              id: `slow-resource-${Date.now()}`
            });
          }
        }
      });
    };

    // Check after page load
    const timer = setTimeout(checkSlowResources, 3000);
    
    return () => clearTimeout(timer);
  }, [enableLogging, enableAnalytics, sendToAnalytics]);
};

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}