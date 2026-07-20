import { NextResponse } from 'next/server';
import { getBrandConfig } from '@config/server-config';

export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT = 15000; // 15 seconds timeout
export async function GET() {
  const brand = await getBrandConfig();
  const apiBaseUrl = brand.apiBaseUrl;
  const baseUrl = brand.siteUrl;
  const currentDate = new Date().toISOString();

  // Static pages
  const staticPages = [
    '',
    '/blog',
    '/categories',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];

  // Fetch dynamic blog posts
  let blogPosts: any[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(`${apiBaseUrl}/api/blogs?page=1&limit=1000&fields=slug,updatedAt,createdAt`, {
      next: { revalidate: 3600 },
      headers: { 'x-brand-id': brand.brandId },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // Backend returns { data: blogs[], ... }
      blogPosts = Array.isArray(data.data) ? data.data : (Array.isArray(data.blogs) ? data.blogs : []);
    }
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  // Fetch dynamic stores
  let stores: any[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(`${apiBaseUrl}/api/stores?limit=1000`, {
      next: { revalidate: 3600 },
      headers: { 'x-brand-id': brand.brandId },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // Backend returns { stores: [], ... } or { data: [] }
      stores = Array.isArray(data.stores) ? data.stores : (Array.isArray(data.data) ? data.data : []);
    }
  } catch (error) {
    console.error('Error fetching stores for sitemap:', error);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
      .map(
        (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`
      )
      .join('')}
  ${blogPosts
      .map(
        (post) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug || post._id}</loc>
    <lastmod>${post.updatedAt || post.createdAt || currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
      )
      .join('')}
  ${stores
      .map(
        (store) => `
  <url>
    <loc>${baseUrl}/store/${store.slug || store._id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
      )
      .join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}