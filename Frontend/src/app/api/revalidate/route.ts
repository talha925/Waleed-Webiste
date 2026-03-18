import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { invalidateStoreCache } from '@/lib/store-service';

export const dynamic = 'force-dynamic';

/**
 * API route for on-demand revalidation of cached pages and data
 * Supports revalidation by path, tag, or specific content types
 * Enhanced for WebSocket-triggered real-time updates
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const {
      type,
      path,
      tag,
      blogId,
      identifier, // Used by backend services
      storeSlug: bodyStoreSlug,
      couponId,
      categorySlug,
      secret,
      source = 'api',
      oldCategorySlug
    } = json;

    const storeSlug = bodyStoreSlug || (type === 'store' || type === 'stores' ? identifier : null);

    // Verify secret token for security
    // Support secret in body (legacy) OR Authorization header (preferred)
    const authHeader = request.headers.get('Authorization');
    const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const providedSecret = secret || bearerSecret;

    if (!providedSecret || providedSecret !== process.env.REVALIDATION_SECRET) {
      console.warn(`[Revalidation] Unauthorized attempt. Type: ${type}, ID: ${path || tag || blogId}`);
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    console.log(`[Revalidation] Triggering ${type} revalidation for:`, { path, tag, identifier, categorySlug, oldCategorySlug });

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
        // Comprehensive blog revalidation
        revalidatePath('/', 'layout'); // Nuclear option: clear everything to be sure
        revalidatePath('/blog');
        revalidatePath('/blog/[id]', 'page');
        
        revalidateTag('blogs');
        revalidateTag('home-blogs');
        revalidateTag('banner-blogs');
        revalidateTag('recent-blogs');
        revalidateTag('featured-blogs');
        revalidateTag('category-'); // Main blog listing
        
        const bId = blogId || identifier;
        if (bId) {
          revalidatePath(`/blog/${bId}`);
          revalidateTag(`blog-${bId}`);
        }

        const currentCategorySlug = categorySlug;

        if (currentCategorySlug) {
          revalidateTag(`category-${currentCategorySlug}`);
          revalidatePath(`/blog/category/${currentCategorySlug}`, 'page');
        }
        
        if (oldCategorySlug && oldCategorySlug !== currentCategorySlug) {
          revalidateTag(`category-${oldCategorySlug}`);
          revalidatePath(`/blog/category/${oldCategorySlug}`, 'page');
        }

        return NextResponse.json({
          message: 'Revalidated all blog-related pages',
          source,
          timestamp: new Date().toISOString()
        });


      case 'store':
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
      case 'blogCategory':
        // Revalidate categories-related pages and tags
        revalidatePath('/categories');
        revalidateTag('categories');
        revalidateTag('blog-categories');
        if (categorySlug || identifier) {
          const slug = categorySlug || identifier;
          revalidateTag(`category-${slug}`);
          revalidatePath(`/blog/category/${slug}`);
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
        revalidatePath('/categories');
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