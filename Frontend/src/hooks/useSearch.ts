import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Store } from '@/lib/types/store';
import { Blog } from '@/lib/types/blog';

interface SearchResult {
  stores?: Store[];
  blogs?: Blog[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
}

const DEFAULT_OPTIONS: UseSearchOptions = {
  debounceMs: 300,
  minQueryLength: 2,
  limit: 10
};

export function useSearch(options: UseSearchOptions = {}) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    total: 0,
    page: 1,
    limit: DEFAULT_OPTIONS.limit!,
    hasMore: false,
    isLoading: false,
    error: null
  });
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Use refs to prevent unnecessary re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageRef = useRef<number>(1);
  const currentQueryRef = useRef<string>('');

  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options.debounceMs, options.minQueryLength, options.limit]);

  // Lightweight search analytics (Google Analytics)
  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'search', {
          search_term: searchTerm,
          search_results: resultsCount,
        });
      }
    } catch {
      // Silently ignore analytics errors
    }
  }, []);

  // Determine search type based on current route
  const searchType = useMemo(() => {
    // If on store pages or handpicked stories, search stores
    if (pathname?.startsWith('/store') || pathname === '/htr' || pathname?.startsWith('/stores')) {
      return 'stores';
    }
    // Default to blog search for other routes
    return 'blogs';
  }, [pathname]);

  // Optimized debounce with cleanup
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, config.debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, config.debounceMs]);

  // Perform search when debounced query changes
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (debouncedQuery.length < config.minQueryLength!) {
      setResults({
        total: 0,
        page: 1,
        limit: config.limit!,
        hasMore: false,
        isLoading: false,
        error: null
      });
      return;
    }

    // Reset page and perform fresh search
    currentPageRef.current = 1;
    currentQueryRef.current = debouncedQuery;
    performSearch(debouncedQuery, 1);
  }, [debouncedQuery, searchType, config.minQueryLength, config.limit]);

  const performSearch = useCallback(async (searchQuery: string, pageOverride?: number) => {
    if (!searchQuery.trim()) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setResults(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const endpoint = searchType === 'stores'
        ? '/api/stores/search'
        : '/api/blogs/search';

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set('q', searchQuery.trim());
      url.searchParams.set('limit', config.limit!.toString());
      const pageToUse = pageOverride ?? 1;
      url.searchParams.set('page', pageToUse.toString());

      const abortTimeout = setTimeout(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
      }, 15000); // 15s search timeout

      const response = await fetch(url.toString(), {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(abortTimeout);

      // Check if request was aborted
      if (signal.aborted) return;

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();

      // Check again if request was aborted after response
      if (signal.aborted) return;

      const totalCount: number = typeof data.total === 'number' ? data.total : 0;
      const pageFromApi: number = typeof data.page === 'number' ? data.page : pageToUse;
      const pageSize: number = config.limit!;

      if (searchType === 'stores') {
        const newItems: Store[] = Array.isArray(data.stores) ? data.stores : [];
        const hasMore = newItems.length > 0 && (newItems.length + 0) < totalCount ? true : (totalCount > newItems.length);
        setResults({
          stores: newItems,
          blogs: undefined,
          total: totalCount,
          page: pageFromApi,
          limit: pageSize,
          hasMore: totalCount > (newItems.length),
          isLoading: false,
          error: null
        });
      } else {
        const newItems: Blog[] = Array.isArray(data.blogs) ? data.blogs : [];
        setResults({
          blogs: newItems,
          stores: undefined,
          total: totalCount,
          page: pageFromApi,
          limit: pageSize,
          hasMore: totalCount > (newItems.length),
          isLoading: false,
          error: null
        });
      }

      // Fire search analytics
      trackSearch(searchQuery, totalCount);
    } catch (error) {
      // Don't update state if request was aborted
      if (signal.aborted) return;

      console.error('Search error:', error);
      setResults({
        total: 0,
        page: 1,
        limit: config.limit!,
        hasMore: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      });
    }
  }, [searchType, config.limit]);

  const clearSearch = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setQuery('');
    setDebouncedQuery('');
    setResults({
      total: 0,
      page: 1,
      limit: config.limit!,
      hasMore: false,
      isLoading: false,
      error: null
    });
  }, []);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const loadMore = useCallback(async () => {
    // Only load more if we have more results and not currently loading
    const hasMore = results.hasMore;
    if (!hasMore || results.isLoading) return;

    const nextPage = (results.page || 1) + 1;
    currentPageRef.current = nextPage;
    const searchQuery = currentQueryRef.current || query;
    if (!searchQuery || searchQuery.length < (options.minQueryLength ?? DEFAULT_OPTIONS.minQueryLength!)) {
      return;
    }

    // Create a new abort controller for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setResults(prev => ({ ...prev, isLoading: true }));

    try {
      const endpoint = searchType === 'stores'
        ? '/api/stores/search'
        : '/api/blogs/search';

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set('q', searchQuery.trim());
      url.searchParams.set('limit', results.limit.toString());
      url.searchParams.set('page', nextPage.toString());

      const response = await fetch(url.toString(), {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (signal.aborted) return;

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      if (signal.aborted) return;

      const totalCount: number = typeof data.total === 'number' ? data.total : results.total;
      if (searchType === 'stores') {
        const newItems: Store[] = Array.isArray(data.stores) ? data.stores : [];
        const combined = [...(results.stores || []), ...newItems];
        setResults({
          stores: combined,
          blogs: undefined,
          total: totalCount,
          page: nextPage,
          limit: results.limit,
          hasMore: combined.length < totalCount,
          isLoading: false,
          error: null
        });
      } else {
        const newItems: Blog[] = Array.isArray(data.blogs) ? data.blogs : [];
        const combined = [...(results.blogs || []), ...newItems];
        setResults({
          blogs: combined,
          stores: undefined,
          total: totalCount,
          page: nextPage,
          limit: results.limit,
          hasMore: combined.length < totalCount,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      if (signal.aborted) return;
      console.error('Load more error:', error);
      setResults(prev => ({ ...prev, isLoading: false }));
    }
  }, [results, searchType, query, options.minQueryLength]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    searchType,
    isSearching: results.isLoading,
    hasResults: results.total > 0,
    updateQuery,
    clearSearch,
    performSearch: () => performSearch(query, 1),
    loadMore
  };
}