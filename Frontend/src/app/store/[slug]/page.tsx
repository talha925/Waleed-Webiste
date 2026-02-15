// StorePage.tsx (Server Component) - DATA-CORRECT / CACHE-SAFE VERSION

import React, { cache } from 'react';
import { getStoreBySlug } from '@/lib/store-service';
import StoreClient from './StoreClient';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Enable Dynamic Rendering (Disable caching) to prevent stale/deleted stores from showing
export const dynamic = 'force-dynamic';

interface StorePageProps {
  params: { slug: string };
}

// Helper function to get store data directly from store-service
// Wrapped in React cache() to deduplicate requests between generateMetadata and StorePage
const getStorePromise = cache((slug: string) => {
  // ALWAYS force fresh data to ensure deleted stores are removed immediately
  return getStoreBySlug(slug, true);
});

import { getBrandConfig } from '@config/index';

// ... imports

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const brand = getBrandConfig();
  try {
    // Use shared promise to prevent duplicate fetch
    const store = await getStorePromise(params.slug);

    if (!store) {
      return {
        title: 'Store Not Found',
        description: 'This store does not exist.',
        robots: {
          index: false,
          follow: false,
        }
      };
    }

    // ✅ Production-safe debug logging
    // Helper function to clean text
    const cleanText = (text: string | null | undefined): string => {
      if (!text || typeof text !== 'string') return '';
      return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    };

    // Helper function to check if a string is truly empty or just whitespace
    const isEmptyOrWhitespace = (text: string | null | undefined): boolean => {
      return !text || typeof text !== 'string' || text.trim() === '';
    };

    // Get title with proper prioritization
    let finalTitle: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_title)) {
      finalTitle = cleanText(store?.seo?.meta_title);
    } else {
      finalTitle = cleanText(store?.name) || 'Store Not Found';
    }

    // Get description with proper prioritization
    let description: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_description)) {
      description = cleanText(store?.seo?.meta_description);
    } else {
      description = cleanText(store?.short_description) || 'Fallback description';
    }

    // Get keywords with proper prioritization
    let keywords: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_keywords)) {
      keywords = cleanText(store?.seo?.meta_keywords);
    } else {
      keywords = `${store?.name} discount codes, ${store?.name} coupons, ${store?.name} deals, savings, exclusive offers`;
    }

    return {
      title: finalTitle,
      description,
      keywords,
      openGraph: {
        title: finalTitle,
        description,
        images: store?.image?.url ? [{ url: store.image.url, alt: store.image.alt || `${store.name} Store Image` }] : [],
        url: `${brand.siteUrl}/store/${params.slug}`,
        type: 'website',
        siteName: brand.siteName,
      },
      twitter: {
        card: 'summary_large_image',
        title: finalTitle,
        description,
        images: store?.image?.url ? [store.image.url] : [],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      alternates: {
        canonical: `${brand.siteUrl}/store/${params.slug}`,
      },
    };
  } catch (error) {
    console.error('Error fetching store for metadata:', error);
    return {
      title: 'Store Not Found',
      description: 'This store does not exist.',
    };
  }
}

// Server Component - fetches initial data with shared promise
export default async function StorePage({ params }: StorePageProps) {
  // Use shared promise to prevent duplicate fetch
  const store = await getStorePromise(params.slug);

  if (!store) {
    // Return proper 404 status code for SEO
    notFound();
  }

  return (
    <StoreClient
      initialStore={store}
      serverError={undefined}
    />
  );
}