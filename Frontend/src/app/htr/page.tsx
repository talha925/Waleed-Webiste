import React from 'react';
import { StoreGrid } from '@/components/store';
import { fetchStoresServer } from '@/lib/serverData';
import { StoresClient } from './StoresClient';
import type { Metadata } from 'next';

// Disable ISR caching to ensure fresh data
export const revalidate = 0;

// Generate metadata for SEO
export const metadata: Metadata = {
  title: 'All Stores - Find Your Favorite Brands',
  description: 'Browse all available stores and discover amazing deals from your favorite brands. Find coupons, discounts, and exclusive offers.',
  openGraph: {
    title: 'All Stores - Find Your Favorite Brands',
    description: 'Browse all available stores and discover amazing deals from your favorite brands.',
  },
};

// Server Component - fetches initial data
export default async function StorePage() {
  // Fetch data server-side with no caching for fresh data
  const { data: initialStores, error: serverError } = await fetchStoresServer({ noCache: true });
  
  return (
    <StoresClient 
      initialStores={initialStores} 
      serverError={serverError} 
    />
  );
}
