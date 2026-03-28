import { NextResponse } from 'next/server';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

const getBlogCategories = async (host: string = '') => {
  try {
    const { getBrandConfigByHost } = await import('@config/index');
    const brand = getBrandConfigByHost(host);

    const apiBaseUrl = brand.apiBaseUrl?.replace('localhost', '127.0.0.1');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${apiBaseUrl}/api/blogCategories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-brand-id': brand.brandId,
      },
      signal: controller.signal,
      next: {
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['blog-categories'] // Enable tag-based revalidation
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    throw error;
  }
};

export async function GET(request: Request) {
  try {
    const host = request.headers.get('host') || '';
    const categories = await getBlogCategories(host);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}