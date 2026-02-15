import React from 'react';
import { CategoryGrid } from '@/components/category';
import { fetchCategoriesServer } from '@/lib/serverData';
import { CategoriesClient } from './CategoriesClient';

// Server Component - fetches initial data
export default async function CategoriesPage() {
  // Fetch data server-side
  const { data: initialCategories, error: serverError } = await fetchCategoriesServer();
  
  return (
    <CategoriesClient 
      initialCategories={initialCategories} 
      serverError={serverError} 
    />
  );
}



