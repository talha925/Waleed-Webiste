import { NextResponse } from 'next/server';
import { getBrandConfig } from '@config/index';

// Generate sitemap.xml dynamically
export async function GET() {
  const brand = getBrandConfig();
  const baseUrl = brand.siteUrl;
  const currentDate = new Date().toISOString();

  // Static pages
  const staticPages = [
    '',
    '/blog',
    '/stores',
    '/Categories',
  ];

  // Fetch dynamic blog posts
  let blogPosts: any[] = [];
  try {
    const response = await fetch(`${brand.apiBaseUrl}/api/blogs?page=1&pageSize=1000`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    if (response.ok) {
      const data = await response.json();
      blogPosts = data.blogs?.blogs || data.data?.blogs || [];
    }
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
  }

  // Fetch dynamic stores
  let stores: any[] = [];
  try {
    const response = await fetch(`${brand.apiBaseUrl}/api/proxy-stores`, {
      next: { revalidate: 3600 }
    });
    if (response.ok) {
      const data = await response.json();
      stores = data.stores || [];
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