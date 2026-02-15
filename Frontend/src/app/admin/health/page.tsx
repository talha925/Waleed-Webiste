'use client';

import React, { useEffect, useState, useCallback } from 'react';

type HealthResponse = {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  backend: {
    url: string;
    healthy: boolean;
    status?: number;
    statusText?: string;
    error?: string;
  };
  environment: {
    nodeEnv?: string;
    apiBaseUrl?: string;
    siteUrl?: string;
  };
  error?: string;
};

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json();
      setHealth(data);
      setLastUpdated(Date.now());
    } catch (err: any) {
      setError(err?.message || 'Failed to load health status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(() => fetchHealth(), 15000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const statusColor = (status?: string, healthy?: boolean) => {
    const ok = status === 'healthy' || healthy === true;
    return ok ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
  };

  const formatTime = (ts?: string | number | null) => {
    if (!ts) return '-';
    const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            <p className="text-sm text-gray-600">Backend connectivity, environment, and status overview</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchHealth}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <span className="text-xs text-gray-500">Last updated: {formatTime(lastUpdated)}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* App Status */}
          <div className={`rounded-lg border p-6 ${statusColor(health?.status)}`}>
            <h2 className="text-lg font-semibold">App Status</h2>
            <p className="mt-2 text-sm">Status: <span className="font-medium">{health?.status ?? 'unknown'}</span></p>
            <p className="text-sm">Timestamp: {formatTime(health?.timestamp)}</p>
          </div>

          {/* Backend Connectivity */}
          <div className={`rounded-lg border p-6 ${statusColor(undefined, health?.backend?.healthy)}`}>
            <h2 className="text-lg font-semibold">Backend Connectivity</h2>
            <p className="mt-2 text-sm break-all">URL: <span className="font-mono">{health?.backend?.url ?? '-'}</span></p>
            <p className="text-sm">Healthy: {String(health?.backend?.healthy ?? false)}</p>
            <p className="text-sm">Status: {health?.backend?.status ?? '-'} {health?.backend?.statusText ? `(${health?.backend?.statusText})` : ''}</p>
            {health?.backend?.error && <p className="text-sm text-red-600">Error: {health.backend.error}</p>}
          </div>

          {/* Environment */}
          <div className="rounded-lg border p-6 bg-white">
            <h2 className="text-lg font-semibold">Environment</h2>
            <p className="mt-2 text-sm">Node Env: <span className="font-mono">{health?.environment?.nodeEnv ?? '-'}</span></p>
            <p className="text-sm break-all">API Base URL: <span className="font-mono">{health?.environment?.apiBaseUrl ?? '-'}</span></p>
            <p className="text-sm break-all">Site URL: <span className="font-mono">{health?.environment?.siteUrl ?? '-'}</span></p>
          </div>
        </div>

        {/* Details */}
        <div className="mt-8 rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold mb-4">Details</h3>
          <pre className="text-xs overflow-auto p-4 bg-gray-50 rounded border">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}