'use client';

import React, { useState, useEffect } from 'react';
import { coreWebVitalsMonitor, WebVitalsMetric } from '@/lib/core-web-vitals';
import { prefetchOptimizer } from '@/lib/prefetch-optimizer';

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [metrics, setMetrics] = useState<Map<string, WebVitalsMetric>>(new Map());
  const [score, setScore] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [prefetchStats, setPrefetchStats] = useState({ prefetched: 0, preloaded: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(coreWebVitalsMonitor.getMetrics());
      setScore(coreWebVitalsMonitor.getScore());
      setSuggestions(coreWebVitalsMonitor.getOptimizationSuggestions());
      setPrefetchStats(prefetchOptimizer.getStats());
    };

    // Initial update
    updateMetrics();

    // Listen for web vitals updates
    const handleMetricUpdate = () => {
      updateMetrics();
    };

    window.addEventListener('web-vitals-metric', handleMetricUpdate);

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => {
      window.removeEventListener('web-vitals-metric', handleMetricUpdate);
      clearInterval(interval);
    };
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatValue = (name: string, value: number): string => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  const getMetricDescription = (name: string): string => {
    switch (name) {
      case 'LCP': return 'Largest Contentful Paint - Loading performance';
      case 'FID': return 'First Input Delay - Interactivity';
      case 'CLS': return 'Cumulative Layout Shift - Visual stability';
      case 'FCP': return 'First Contentful Paint - Loading performance';
      case 'TTFB': return 'Time to First Byte - Server response time';
      case 'INP': return 'Interaction to Next Paint - Responsiveness';
      default: return name;
    }
  };

  if (!showDetails && metrics.size === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div 
        className="p-4 border-b cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h3 className="font-medium text-gray-900">Performance Monitor</h3>
          </div>
          <div className={`text-sm font-semibold ${getScoreColor(score)}`}>
            Score: {score}/100
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {metrics.size} metrics
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Core Web Vitals */}
          {metrics.size > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Core Web Vitals</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(metrics.entries()).map(([name, metric]) => (
                  <div key={name} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getRatingColor(metric.rating)}`}>
                        {metric.rating}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {formatValue(name, metric.value)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getMetricDescription(name)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prefetch Statistics */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Resource Optimization</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-blue-900">
                  {prefetchStats.prefetched}
                </div>
                <div className="text-xs text-blue-600">Resources Prefetched</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-lg font-semibold text-green-900">
                  {prefetchStats.preloaded}
                </div>
                <div className="text-xs text-green-600">Resources Preloaded</div>
              </div>
            </div>
          </div>

          {/* Optimization Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Optimization Suggestions</h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">{suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => prefetchOptimizer.prefetchCriticalResources()}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Prefetch Critical Resources
              </button>
              <button
                onClick={() => prefetchOptimizer.prefetchBasedOnBehavior()}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
              >
                Smart Prefetch
              </button>
              <button
                onClick={() => {
                  prefetchOptimizer.clearCache();
                  setPrefetchStats({ prefetched: 0, preloaded: 0 });
                }}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* Debug Info */}
          {showDetails && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Debug Information</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(
                    {
                      metrics: Object.fromEntries(metrics),
                      score,
                      prefetchStats,
                      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                      timestamp: new Date().toISOString()
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;