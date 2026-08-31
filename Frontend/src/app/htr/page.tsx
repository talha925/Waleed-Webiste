import React from 'react';
import { StoreGrid } from '@/components/store';
import { fetchStoresServer } from '@/lib/serverData';
import { StoresClient } from './StoresClient';
import type { Metadata } from 'next';

import { getBrandConfig } from '@config/server-config';

// Private page - blocked from search engines
export const metadata: Metadata = {
  title: 'Admin - Store Directory View',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
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
