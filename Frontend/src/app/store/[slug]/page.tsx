// StorePage.tsx (Server Component) - DATA-CORRECT / CACHE-SAFE VERSION

import React, { cache } from 'react';
import { getStoreBySlug } from '@/lib/store-service';
import StoreClient from './StoreClient';
import { Metadata } from 'next';
import { notFound, redirect, RedirectType } from 'next/navigation';

// Enable dynamic rendering since brand identification depends on host headers
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface StorePageProps {
  params: { slug: string };
}

// Helper function to get store data directly from store-service
// Wrapped in React cache() to deduplicate requests between generateMetadata and StorePage
const getStorePromise = cache((slug: string) => {
  // Use cached data for performance; revalidation is handled via API
  return getStoreBySlug(slug, false);
});

import { getBrandConfig } from '@config/server-config';

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
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
    const currentYear = new Date().getFullYear();

    let finalTitle: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_title)) {
      finalTitle = cleanText(store?.seo?.meta_title);
    } else {
      const storeName = cleanText(store?.name) || 'Store';
      finalTitle = `${storeName} Coupon Codes, Promo Codes & Discounts - ${currentMonth} ${currentYear}`;
    }

    // Get description with proper prioritization
    let description: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_description)) {
      description = cleanText(store?.seo?.meta_description);
    } else {
      const storeName = cleanText(store?.name) || 'this store';
      const shortDesc = cleanText(store?.short_description);
      description = `Find the latest ${storeName} discount codes, promo codes, and coupons for ${currentMonth} ${currentYear}. ${shortDesc ? shortDesc + ' ' : ''}Save big on your next purchase with our verified offers!`;
    }

    // Get keywords with proper prioritization
    let keywords: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_keywords)) {
      keywords = cleanText(store?.seo?.meta_keywords);
    } else {
      const storeName = cleanText(store?.name) || 'Store';
      keywords = `${storeName} discount code, ${storeName} promo code, ${storeName} coupon code, ${storeName} coupons, ${storeName} vouchers, ${storeName} deals, ${storeName} offers ${currentYear}`;
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

  if (store?.redirectUrl) {
    redirect(`/store/${store.redirectUrl}`);
  }

  if (!store) {
    // Return proper 404 status code for SEO
    notFound();
  }
  
  // 🔥 REDIRECT LOGIC: If the found store's slug doesn't match the requested slug,
  // it means we found it via 'oldSlugs'. Redirect to the canonical URL.
  if (store.slug && store.slug !== params.slug) {
    console.log(`🔀 Redirecting old slug "${params.slug}" to new slug "${store.slug}"`);
    redirect(`/store/${store.slug}`, RedirectType.replace);
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How do I use a ${store.name} promo code?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `To use a ${store.name} promo code, simply find an active offer on this page and click "Show Code". Copy the code and paste it into the "Promo Code" box at checkout on the ${store.name} website.`
        }
      },
      {
        "@type": "Question",
        "name": `Does ${store.name} offer verified discount codes?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, all ${store.name} discount codes on this page are manually verified by our editorial team to ensure they work as described.`
        }
      },
      {
        "@type": "Question",
        "name": `Why is my ${store.name} coupon not working?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `If your coupon isn't working, check if it's expired or has specific terms and conditions like a minimum spend or exclusion of certain items.`
        }
      },
      {
        "@type": "Question",
        "name": `Can I combine multiple ${store.name} coupons?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Generally, ${store.name} only allows one promo code per order. Choose the one that gives you the biggest discount!`
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <StoreClient
        initialStore={store}
        serverError={undefined}
      />
    </>
  );
}