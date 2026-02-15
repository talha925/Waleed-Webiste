'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SSEMessage<T = any> {
  data: T;
  timestamp?: string;
}

interface UseSSEOptions {
  url?: string;
  autoConnect?: boolean;
  withCredentials?: boolean;
}

interface UseSSEReturn<T = any> {
  isConnected: boolean;
  lastEvent: SSEMessage<T> | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Lightweight SSE hook for admin dashboards and low-maintenance realtime.
 * Works on Vercel serverless and plays nicely with Next.js App Router.
 */
export function useSSE<T = any>(options: UseSSEOptions = {}): UseSSEReturn<T> {
  const defaultUrl = process.env.NEXT_PUBLIC_SSE_URL || '/api/sse?topic=admin';
  const url = options.url || defaultUrl;
  const autoConnect = options.autoConnect ?? true;
  const withCredentials = options.withCredentials ?? false;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEMessage<T> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (sourceRef.current) return; // already connected
    try {
      const es = new EventSource(url, { withCredentials });
      sourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          setLastEvent({ data: parsed, timestamp: new Date().toISOString() });
        } catch {
          setLastEvent({ data: e.data as unknown as T, timestamp: new Date().toISOString() });
        }
      };

      es.onerror = () => {
        setError('SSE connection error');
        setIsConnected(false);
        // Browsers auto-reconnect EventSource; keep instance
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown SSE error');
    }
  }, [url, withCredentials]);

  const disconnect = useCallback(() => {
    const es = sourceRef.current;
    if (es) {
      es.close();
      sourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return { isConnected, lastEvent, error, connect, disconnect };
}