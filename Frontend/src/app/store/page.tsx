import React from 'react';
import { fetchStoresServer } from '@/lib/serverData';
import { StoresClient } from '../htr/StoresClient';
import { Metadata } from 'next';
import { getBrandConfig } from '@config/server-config';

// ISR: revalidate the store list every 60s
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `All Stores & Promo Codes | ${brand.siteName}`,
    description: `Browse all available stores, coupons, and discounts on ${brand.siteName}. Find verified promo codes for your favorite online shops.`,
    alternates: {
      canonical: `${brand.siteUrl}/store`,
    },
    openGraph: {
      title: `All Stores & Promo Codes | ${brand.siteName}`,
      description: `Browse all available stores and discount codes on ${brand.siteName}.`,
      url: `${brand.siteUrl}/store`,
      siteName: brand.siteName,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Server Component - fetches initial stores data
export default async function StoreDirectoryPage() {
  let initialStores: any[] = [];
  let serverError: string | null = null;

  try {
    const res = await fetchStoresServer();
    initialStores = res.data || [];
  } catch (error) {
    serverError = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <StoresClient 
          initialStores={initialStores} 
          serverError={serverError} 
        />
      </div>
    </div>
  );
}
