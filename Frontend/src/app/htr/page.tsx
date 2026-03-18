import React from 'react';
import { StoreGrid } from '@/components/store';
import { fetchStoresServer } from '@/lib/serverData';
import { StoresClient } from './StoresClient';
import type { Metadata } from 'next';

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
  // Fetch data server-side
  let initialStores: any[] = [];
  let serverError: string | null = null;

  try {
    // CRITICAL FIX: Removed { noCache: true } to allow Next.js to cache this page.
    // This makes the "Back" button instant returning from a store detail page.
    const res = await fetchStoresServer();
    initialStores = res.data;
  } catch (error) {
    serverError = error instanceof Error ? error.message : 'Unknown error';
  }
  
  return (
    <StoresClient 
      initialStores={initialStores} 
      serverError={serverError} 
    />
  );
}
