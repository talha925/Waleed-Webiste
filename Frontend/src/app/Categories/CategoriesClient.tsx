'use client';

import React from 'react';
import { CategoryGrid } from '@/components/category';
import { useUnifiedDataFetching } from '@/hooks/useUnifiedDataFetching';
import { Category } from '@/lib/types/category';

interface CategoriesClientProps {
  initialCategories: Category[];
  serverError: string | null;
}

export function CategoriesClient({ initialCategories, serverError }: CategoriesClientProps) {
  // Use unified data fetching with server-side initial data
  const { 
    data, 
    isLoading: loading, 
    error, 
    isInitialized 
  } = useUnifiedDataFetching('/api/proxy-categories?fields=name,description', {
    method: 'GET',
    requireAuth: true,
    autoFetch: true,
    cacheKey: 'categories-list',
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    debug: false, // Disable debug in production
    onSuccess: (data) => {
      // Handle successful data fetch
    }
  });

  // Use server data initially, then client data once initialized
  const categories = data?.data?.categories || initialCategories;
  const finalError = error?.message || serverError;
  const isLoading = loading; // Show loading state

  return (
    <CategoryGrid 
      categories={categories} 
      loading={isLoading} 
      error={finalError} 
    />
  );
}