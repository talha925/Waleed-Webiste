import './globals.css'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import ConditionalFooter from '@/components/ConditionalFooter'
import { Providers } from '@/context/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import dynamic from 'next/dynamic'
import config from '@/lib/config'
import { getBrandConfig } from '../../config/server-config'
import { fetchBlogCategoriesServer } from '@/lib/serverData'
import React from 'react'
import Script from 'next/script'

// Dynamically import WebSocket components for real-time functionality
const RealTimeUpdates = dynamic(
  () => import('@/components/common/RealTimeUpdates').then(mod => ({ default: mod.RealTimeUpdates })),
  {
    ssr: false,
    loading: () => null
  }
)

// Load Inter font with display: swap for better performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

// Dynamic metadata per brand
export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();

  return {
    title: {
      default: brand.metaTitle,
      template: brand.metaTitleTemplate,
    },
    description: brand.metaDescription,
    keywords: brand.metaKeywords,
    authors: [{ name: `${brand.siteName} Team` }],
    creator: brand.siteName,
    publisher: brand.siteName,
    formatDetection: {
      email: false,
      telephone: false,
      address: false,
    },
    icons: {
      icon: [
        { url: brand.faviconPath, type: 'image/svg+xml' },
      ],
      shortcut: [brand.faviconPath],
      apple: [
        { url: brand.faviconPath, type: 'image/svg+xml' },
      ],
    },
    metadataBase: new URL(brand.siteUrl),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: brand.metaTitle,
      description: brand.metaDescription,
      url: brand.siteUrl,
      siteName: brand.siteName,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: brand.ogImage,
          width: 1200,
          height: 630,
          alt: `${brand.siteName} - ${brand.siteTagline}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: brand.metaTitle,
      description: brand.metaDescription,
      images: [brand.twitterImage],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Removed SSR cookie reading to enable full static optimization (ISR) and fix slow TTFB.
  // The app will gracefully authenticate on the client-side via AuthService using localStorage.
  const initialToken = null;

  // Resolve brand config for this request
  const brand = getBrandConfig();
  
  // Build gtag inline script dynamically per brand
  const gtagInnerHtml = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${brand.gaId}');
    ${brand.gtagConversion ? `gtag('event', 'conversion', {
      'send_to': '${brand.gtagConversion.sendTo}',
      'value': ${brand.gtagConversion.value},
      'currency': '${brand.gtagConversion.currency}'
    });` : ''}
  `;

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Inject brand theme colors as CSS custom properties */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --brand-primary: ${brand.primaryHSL};
                --brand-secondary: ${brand.secondaryHSL || brand.primaryHSL};
                --brand-accent: ${brand.accentHSL};
                --brand-accent-2: ${brand.accent2HSL || brand.accentHSL};
                --brand-theme-color: ${brand.themeColor};
              }
            `,
          }}
        />
        <meta name="theme-color" content={brand.themeColor} />
        {/* Preconnect to API domain */}
        <link
          rel="preconnect"
          href={brand.apiBaseUrl || config.api.baseUrl}
          crossOrigin="anonymous"
        />
        {/* 🚀 IMAGE ROOT OPTIMIZATION: Resolve DNS and Handshake for S3 bucket early */}
        <link rel="preconnect" href={`https://${brand.imageDomain}`} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={`https://${brand.imageDomain}`} />
        
        {/* Dynamic favicon */}
        <link rel="icon" href={brand.faviconPath} type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <Providers initialToken={initialToken} brand={brand}>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <React.Suspense fallback={null}>
                <ConditionalFooter />
              </React.Suspense>
              {/* Real-time updates notifications */}
              <RealTimeUpdates />
              <SpeedInsights />
              <Analytics />
              
              {/* Load Scripts after interactive */}
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${brand.gaId}`}
                strategy="afterInteractive"
              />
              <Script id="google-analytics" strategy="afterInteractive">
                {gtagInnerHtml}
              </Script>
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}


