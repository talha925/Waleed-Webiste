/**
 * Unified Data Fetching Hook
 * Consolidates logic from useDataFetching and useAuthAwareDataFetching
 * Follows SOLID principles and DRY pattern
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '@/services/AuthService';
import HttpClient from '@/services/HttpClient';
import { RequestConfig } from '@/services/interfaces/IHttpClient';

interface DataFetchingOptions extends Omit<RequestConfig, 'method' | 'url'> {
  // Core options
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  
  // Behavior options
  autoFetch?: boolean;
  dependencies?: any[];
  enabled?: boolean;
  requireAuth?: boolean;
  waitForAuth?: boolean;
  debounce?: number; // Debounce delay in milliseconds

  
  // Retry options
  retryCount?: number;
  retryDelay?: number;
  
  // Cache options
  cacheKey?: string;
  cacheTTL?: number;
  
  // Callback options
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  
  // Debug options
  debug?: boolean;
}

interface DataFetchingState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isInitialized: boolean;
  isValidating: boolean;
  lastFetchTime: number | null;
}

interface DataFetchingActions {
  refetch: () => Promise<void>;
  mutate: (data: any) => void;
  reset: () => void;
  cancel: () => void;
}

type UseDataFetchingReturn<T> = DataFetchingState<T> & DataFetchingActions;

// Cache implementation
class DataCache {
  private static instance: DataCache;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache();
    }
    return DataCache.instance;
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const dataCache = DataCache.getInstance();
const httpClient = new HttpClient();

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

function createRequestKey(url: string, options: DataFetchingOptions): string {
  return `${options.method || 'GET'}:${url}:${JSON.stringify({
    body: options.body,
    params: options.params,
    headers: options.headers
  })}`;
}

export function useUnifiedDataFetching<T = any>(
  url: string,
  options: DataFetchingOptions = {}
): UseDataFetchingReturn<T> {
  const {
    method = 'GET',
    autoFetch = true,
    dependencies = [],
    enabled = true,
    requireAuth = false,
    waitForAuth = false,
    retryCount = 0,
    retryDelay = 1000,
    debounce = 0, // Default to no debounce
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    onSuccess,
    onError,
    onSettled,
    debug = false,
    ...requestConfig
  } = options;

  // State
  const [state, setState] = useState<DataFetchingState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isInitialized: false,
    isValidating: false,
    lastFetchTime: null
  });

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Auth state
  const [authState, setAuthState] = useState(authService.getAuthState());

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancel();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[useUnifiedDataFetching] ${message}`, data);
    }
  }, [debug]);

  const updateState = useCallback((updates: Partial<DataFetchingState<T>>) => {
    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const shouldFetch = useCallback((): boolean => {
    if (!enabled) {
      log('Fetch disabled');
      return false;
    }

    if (requireAuth && !authState.isAuthenticated) {
      if (waitForAuth) {
        log('Waiting for authentication');
        return false;
      } else {
        log('Authentication required but not authenticated');
        return false;
      }
    }

    if (requireAuth && authState.isLoading) {
      log('Authentication loading');
      return waitForAuth;
    }

    return true;
  }, [enabled, requireAuth, authState.isAuthenticated, authState.isLoading, waitForAuth, log]);

  const fetchData = useCallback(async (retryAttempt = 0): Promise<void> => {
    if (debounce > 0 && retryAttempt === 0) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      return new Promise(resolve => {
        debounceTimeoutRef.current = setTimeout(() => {
          debounceTimeoutRef.current = null;
          resolve(fetchDataInternal(retryAttempt));
        }, debounce);
      });
    } else {
      return fetchDataInternal(retryAttempt);
    }
  }, [url, method, requestConfig, shouldFetch, retryCount, retryDelay, cacheKey, cacheTTL, onSuccess, onError, onSettled, debug, log, updateState, state.data, state.error, debounce]);

  const fetchDataInternal = useCallback(async (retryAttempt = 0): Promise<void> => {
    if (!shouldFetch()) {
      return;
    }

    const requestKey = createRequestKey(url, options);
    const effectiveCacheKey = cacheKey || requestKey;

    // Check cache first
    if (method === 'GET' && cacheKey) {
      const cachedData = dataCache.get(effectiveCacheKey);
      if (cachedData) {
        log('Using cached data', cachedData);
        updateState({
          data: cachedData,
          error: null,
          isLoading: false,
          isInitialized: true,
          lastFetchTime: Date.now()
        });
        onSuccess?.(cachedData);
        onSettled?.();
        return;
      }
    }

    // Check for pending request (deduplication)
    if (pendingRequests.has(requestKey)) {
      log('Request already pending, waiting for result');
      try {
        const result = await pendingRequests.get(requestKey)!;
        updateState({
          data: result,
          error: null,
          isLoading: false,
          isInitialized: true,
          lastFetchTime: Date.now()
        });
        onSuccess?.(result);
      } catch (error) {
        updateState({
          error: error as Error,
          isLoading: false,
          isInitialized: true
        });
        onError?.(error as Error);
      } finally {
        onSettled?.();
      }
      return;
    }

    // Cancel previous request
    cancel();

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    updateState({
      isLoading: true,
      isValidating: state.data !== null,
      error: retryAttempt === 0 ? null : state.error
    });

    log(`Fetching data (attempt ${retryAttempt + 1})`, { url, method, options });

    try {
      // Create the request promise
      const requestPromise = httpClient.request<T>({
        url,
        method,
        ...requestConfig,
        signal: abortControllerRef.current.signal
      });

      // Store pending request for deduplication
      pendingRequests.set(requestKey, requestPromise);

      const result = await requestPromise;

      // Remove from pending requests
      pendingRequests.delete(requestKey);

      if (!mountedRef.current) return;

      log('Fetch successful', result);

      // Cache the result if it's a GET request
      if (method === 'GET' && cacheKey) {
        dataCache.set(effectiveCacheKey, result, cacheTTL);
      }

      updateState({
        data: result,
        error: null,
        isLoading: false,
        isValidating: false,
        isInitialized: true,
        lastFetchTime: Date.now()
      });

      onSuccess?.(result);
    } catch (error) {
      // Remove from pending requests
      pendingRequests.delete(requestKey);

      if (!mountedRef.current) return;

      const fetchError = error as Error;
      log('Fetch error', fetchError);

      // Handle retry logic
      if (retryAttempt < retryCount && fetchError.name !== 'AbortError') {
        log(`Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${retryCount})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(retryAttempt + 1);
        }, retryDelay * Math.pow(2, retryAttempt)); // Exponential backoff
        
        return;
      }

      updateState({
        error: fetchError,
        isLoading: false,
        isValidating: false,
        isInitialized: true
      });

      onError?.(fetchError);
    } finally {
      onSettled?.();
    }
  }, [url, method, requestConfig, shouldFetch, retryCount, retryDelay, cacheKey, cacheTTL, onSuccess, onError, onSettled, debug, log, updateState, state.data, state.error]);

  const refetch = useCallback(async (): Promise<void> => {
    // Invalidate cache
    if (cacheKey) {
      dataCache.invalidate(cacheKey);
    }
    await fetchData();
  }, [fetchData, cacheKey]);

  const mutate = useCallback((newData: T) => {
    log('Mutating data', newData);
    updateState({ data: newData });
    
    // Update cache
    if (cacheKey) {
      dataCache.set(cacheKey, newData, cacheTTL);
    }
  }, [log, updateState, cacheKey, cacheTTL]);

  const reset = useCallback(() => {
    log('Resetting state');
    cancel();
    updateState({
      data: null,
      error: null,
      isLoading: false,
      isInitialized: false,
      isValidating: false,
      lastFetchTime: null
    });
  }, [log, updateState]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      log('Cancelling request');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, [log]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch && shouldFetch()) {
      fetchData();
    }
  }, [autoFetch, shouldFetch, fetchData, ...dependencies]);

  return {
    ...state,
    refetch,
    mutate,
    reset,
    cancel
  };
}

// Convenience hooks for specific HTTP methods
export function useGet<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'GET' });
}

export function usePost<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'POST', autoFetch: false });
}

export function usePut<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'PUT', autoFetch: false });
}

export function useDelete<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'DELETE', autoFetch: false });
}

// Auth-aware convenience hooks
export function useAuthGet<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method' | 'requireAuth'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'GET', requireAuth: true, waitForAuth: true });
}

export function useAuthPost<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method' | 'requireAuth'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'POST', requireAuth: true, autoFetch: false });
}

export function useAuthPut<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method' | 'requireAuth'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'PUT', requireAuth: true, autoFetch: false });
}

export function useAuthDelete<T = any>(url: string, options?: Omit<DataFetchingOptions, 'method' | 'requireAuth'>) {
  return useUnifiedDataFetching<T>(url, { ...options, method: 'DELETE', requireAuth: true, autoFetch: false });
}