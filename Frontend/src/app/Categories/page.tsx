import React from 'react';
import { CategoriesClient } from './CategoriesClient';
import { fetchBlogCategoriesServer } from '@/lib/serverData';

export default async function CategoriesPage() {
  const { data: categories = [] } = await fetchBlogCategoriesServer();
  
  return <CategoriesClient initialCategories={categories} />;
}



