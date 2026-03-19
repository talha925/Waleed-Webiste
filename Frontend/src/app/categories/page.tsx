import React from 'react';
import { CategoriesClient } from './CategoriesClient';
import { fetchBlogCategoriesServer } from '@/lib/serverData';

// ISR: revalidate the page every 60s
export const revalidate = 60;

export default async function CategoriesPage() {
  const { data: categories = [] } = await fetchBlogCategoriesServer();
  
  return <CategoriesClient initialCategories={categories} />;
}



