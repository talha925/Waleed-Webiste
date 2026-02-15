'use client';

import React, { useState, useEffect } from 'react';
import { coreWebVitalsMonitor, WebVitalsMetric } from '@/lib/core-web-vitals';
import { prefetchOptimizer } from '@/lib/prefetch-optimizer';
import { websocketHealthMonitor } from '@/lib/websocket-health';
import config from '@/lib/config';
import PerformanceMonitor from '@/components/common/PerformanceMonitor';

interface AnalyticsData {
  data: any[];
  stats: Record<string, any>;
  total: number;
}

const PerformanceDashboard: React.FC = () => {
  const [webVitalsData, setWebVitalsData] = useState<AnalyticsData | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<Map<string, WebVitalsMetric>>(new Map());
  const [prefetchStats, setPrefetchStats] = useState({ prefetched: 0, preloaded: 0 });
  const [websocketHealth, setWebsocketHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await fetch('/api/analytics/web-vitals?limit=500');
        if (response.ok) {
          const data = await response.json();
          setWebVitalsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      }
    };

    const updateCurrentMetrics = () => {
      setCurrentMetrics(coreWebVitalsMonitor.getMetrics());
      setPrefetchStats(prefetchOptimizer.getStats());
      setWebsocketHealth(websocketHealthMonitor.getHealthStatus());
    };

    // Initial load
    fetchAnalyticsData();
    updateCurrentMetrics();
    setIsLoading(false);

    // Set up periodic updates
    const interval = setInterval(() => {
      updateCurrentMetrics();
      fetchAnalyticsData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatValue = (metric: string, value: number): string => {
    if (metric === 'CLS') return value.toFixed(3);
    return `${Math.round(value)}ms`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor Core Web Vitals, prefetch optimization, and WebSocket health</p>
        </div>

        {/* Current Performance Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(coreWebVitalsMonitor.getScore()).split(' ')[0]}`}>
                  {coreWebVitalsMonitor.getScore()}/100
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prefetched Resources</p>
                <p className="text-3xl font-bold text-blue-600">{prefetchStats.prefetched}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Preloaded Resources</p>
                <p className="text-3xl font-bold text-green-600">{prefetchStats.preloaded}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">WebSocket Health</p>
                {(() => {
                  const wsMode = config.realtime.mode;
                  const wsEnabled = wsMode === 'ws-managed' && (!!config.realtime.wsUrl || !!config.realtime.managedProvider);
                  const status = wsEnabled ? websocketHealth?.status : 'disabled';

                  const textClass = !wsEnabled
                    ? 'text-gray-600'
                    : status === 'healthy'
                      ? 'text-green-600'
                      : status === 'degraded'
                        ? 'text-yellow-600'
                        : 'text-red-600';

                  const label = !wsEnabled
                    ? 'Disabled'
                    : status === 'healthy'
                      ? 'Healthy'
                      : status === 'degraded'
                        ? 'Degraded'
                        : 'Unhealthy';

                  return (
                    <p className={`text-3xl font-bold ${textClass}`}>{label}</p>
                  );
                })()}
              </div>
              {(() => {
                const wsMode = config.realtime.mode;
                const wsEnabled = wsMode === 'ws-managed' && (!!config.realtime.wsUrl || !!config.realtime.managedProvider);
                const status = wsEnabled ? websocketHealth?.status : 'disabled';

                const bgClass = !wsEnabled
                  ? 'bg-gray-100'
                  : status === 'healthy'
                    ? 'bg-green-100'
                    : status === 'degraded'
                      ? 'bg-yellow-100'
                      : 'bg-red-100';

                const dotClass = !wsEnabled
                  ? 'bg-gray-500'
                  : status === 'healthy'
                    ? 'bg-green-500'
                    : status === 'degraded'
                      ? 'bg-yellow-500'
                      : 'bg-red-500';

                return (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}>
                    <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Current Web Vitals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Web Vitals</h2>
            <div className="space-y-4">
              {Array.from(currentMetrics.entries()).map(([name, metric]) => (
                <div key={name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-sm text-gray-600">
                      {name === 'LCP' && 'Largest Contentful Paint'}
                      {name === 'FID' && 'First Input Delay'}
                      {name === 'CLS' && 'Cumulative Layout Shift'}
                      {name === 'FCP' && 'First Contentful Paint'}
                      {name === 'TTFB' && 'Time to First Byte'}
                      {name === 'INP' && 'Interaction to Next Paint'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatValue(name, metric.value)}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      metric.rating === 'good' ? 'bg-green-100 text-green-800' :
                      metric.rating === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {metric.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Analytics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Summary</h2>
            {webVitalsData?.stats && Object.keys(webVitalsData.stats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(webVitalsData.stats).map(([metric, stats]: [string, any]) => (
                  <div key={metric} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{metric}</h3>
                      <span className="text-sm text-gray-600">{stats.count} samples</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Average</p>
                        <p className="font-medium">{formatValue(metric, stats.average)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">P95</p>
                        <p className="font-medium">{formatValue(metric, stats.p95)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Good Rating</p>
                        <p className="font-medium text-green-600">
                          {Math.round((stats.ratings.good / stats.count) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No analytics data available yet</p>
                <p className="text-sm text-gray-400 mt-1">Data will appear as users interact with the site</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Monitor Component */}
        <div className="mb-8">
          <PerformanceMonitor showDetails={true} />
        </div>

        {/* Optimization Suggestions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Optimization Suggestions</h2>
          <div className="space-y-3">
            {coreWebVitalsMonitor.getOptimizationSuggestions().map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-yellow-800">{suggestion}</p>
              </div>
            ))}
            {coreWebVitalsMonitor.getOptimizationSuggestions().length === 0 && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-600 font-medium">All metrics are performing well!</p>
                <p className="text-sm text-gray-500 mt-1">No optimization suggestions at this time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;