import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { invalidateStoreCache } from '@/lib/store-service';

/**
 * API route for on-demand revalidation of cached pages and data
 * Supports revalidation by path, tag, or specific content types
 * Enhanced for WebSocket-triggered real-time updates
 */
export async function POST(request: NextRequest) {
  try {
    const {
      type,
      path,
      tag,
      blogId,
      storeSlug,
      couponId,
      categorySlug,
      secret,
      source = 'api' // Track if revalidation is from WebSocket or direct API call
    } = await request.json();

    // Verify secret token for security
    // Support secret in body (legacy) OR Authorization header (preferred)
    const authHeader = request.headers.get('Authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const providedSecret = secret || bearerSecret;

    if (!providedSecret || providedSecret !== process.env.REVALIDATION_SECRET) {
      console.warn(`[Revalidation] Unauthorized attempt. Type: ${type}, ID: ${path || tag || blogId}`);
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    console.log(`[Revalidation] Triggering ${type} revalidation for:`, { path, tag, blogId, storeSlug });

    switch (type) {
      case 'path':
        if (!path) {
          return NextResponse.json({ error: 'Path is required for path revalidation' }, { status: 400 });
        }
        revalidatePath(path);
        return NextResponse.json({
          message: `Revalidated path: ${path}`,
          source,
          timestamp: new Date().toISOString()
        });

      case 'tag':
        if (!tag) {
          return NextResponse.json({ error: 'Tag is required for tag revalidation' }, { status: 400 });
        }
        revalidateTag(tag);
        return NextResponse.json({
          message: `Revalidated tag: ${tag}`,
          source,
          timestamp: new Date().toISOString()
        });

      case 'blog':
        // Revalidate blog-related pages and tags
        // CRITICAL: Use dynamic route pattern to invalidate ALL blog detail pages
        revalidatePath('/blog/[id]', 'page');
        revalidatePath('/blog');
        revalidatePath('/');
        revalidateTag('blogs');
        revalidateTag('featured-blogs');
        if (blogId) {
          revalidatePath(`/blog/${blogId}`);
          revalidateTag(`blog-${blogId}`);
        }
        return NextResponse.json({
          message: 'Revalidated blog pages',
          source,
          timestamp: new Date().toISOString()
        });


      case 'stores':
        // Revalidate stores-related pages and tags
        revalidatePath('/stores');
        revalidateTag('stores');
        if (storeSlug) {
          revalidatePath(`/store/${storeSlug}`);
          revalidateTag(`store-${storeSlug}`);
          // Also revalidate store coupons
          revalidateTag(`store-${storeSlug}-coupons`);
        }
        // Ensure service-layer caches are cleared so fresh data is fetched
        invalidateStoreCache();
        return NextResponse.json({
          message: 'Revalidated stores pages',
          source,
          timestamp: new Date().toISOString()
        });

      case 'coupons':
        // Revalidate coupon-related pages and tags
        revalidateTag('coupons');
        if (couponId) {
          revalidateTag(`coupon-${couponId}`);
        }
        if (storeSlug) {
          // Revalidate store-specific coupons
          revalidateTag(`store-${storeSlug}-coupons`);
          revalidatePath(`/store/${storeSlug}`);
        }
        return NextResponse.json({
          message: 'Revalidated coupon pages',
          source,
          timestamp: new Date().toISOString()
        });

      case 'categories':
        // Revalidate categories-related pages and tags
        revalidatePath('/Categories');
        revalidateTag('categories');
        if (categorySlug) {
          revalidateTag(`category-${categorySlug}`);
        }
        return NextResponse.json({
          message: 'Revalidated categories pages',
          source,
          timestamp: new Date().toISOString()
        });

      case 'all':
        // Revalidate all pages
        revalidatePath('/blog');
        revalidateTag('blogs');
        revalidatePath('/stores');
        revalidateTag('stores');
        revalidatePath('/Categories');
        revalidateTag('categories');
        revalidateTag('coupons');
        // Also clear service-layer caches globally
        invalidateStoreCache();
        return NextResponse.json({
          message: 'Revalidated all pages',
          source,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({ error: 'Invalid revalidation type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({ message: 'Revalidation API is running' });
}