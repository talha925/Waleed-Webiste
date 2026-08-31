import React from 'react';
import { Metadata } from 'next';
import { CategoriesClient } from './CategoriesClient';
import { fetchBlogCategoriesServer } from '@/lib/serverData';
import { getBrandConfig } from '@config/server-config';

// ISR: revalidate the page every 60s
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `All Categories | ${brand.siteName}`,
    description: `Explore all blog categories and topics on ${brand.siteName}. Find guides, reviews, and insights organized by category.`,
    alternates: {
      canonical: `${brand.siteUrl}/categories`,
    },
    openGraph: {
      title: `All Categories | ${brand.siteName}`,
      description: `Explore all blog categories and topics on ${brand.siteName}.`,
      url: `${brand.siteUrl}/categories`,
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

export default async function CategoriesPage() {
  const { data: categories = [] } = await fetchBlogCategoriesServer();
  
  return <CategoriesClient initialCategories={categories} />;
}



