import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Function to verify JWT token
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_replace_in_production');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (_error) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value;
  const { pathname } = req.nextUrl;

  // Redirect /stores/[id] to /store/[slug] for SEO and consistency
  if (pathname.startsWith('/stores/') && pathname !== '/stores') {
    const segments = pathname.split('/');
    if (segments.length === 3) { // /stores/[id]
      const storeIdOrSlug = segments[2];
      
      // Check if it's already a slug (contains letters) or an ID (only numbers/ObjectId format)
      const isLikelyId = /^[0-9a-fA-F]{24}$/.test(storeIdOrSlug) || /^\d+$/.test(storeIdOrSlug);
      
      if (isLikelyId) {
        // For actual IDs, we need to fetch the slug from the API
        try {
          const storesRes = await fetch(`${req.nextUrl.origin}/api/proxy-stores`, {
            headers: { 'User-Agent': 'middleware-redirect' }
          });
          
          if (storesRes.ok) {
            const storesData = await storesRes.json();
            const store = storesData.data?.find((s: any) => s._id === storeIdOrSlug);
            
            if (store?.slug) {
              const newUrl = new URL(`/store/${store.slug}`, req.url);
              return NextResponse.redirect(newUrl, 301);
            }
          }
        } catch (error) {
          console.error('Middleware redirect error:', error);
        }
      }
      
      // Fallback: redirect as-is (assuming it might be a slug already)
      const newUrl = new URL(`/store/${storeIdOrSlug}`, req.url);
      return NextResponse.redirect(newUrl, 301);
    }
  }

  // Define protected routes (require authentication)
  const protectedRoutes = [
    '/admin',
    '/blog/edit',
  ];

  // Define admin-only routes
  const adminRoutes = [
    '/admin',
  ];

  // Define public API routes (no auth required)
  const publicApiRoutes = [
    '/api/proxy-stores',
    '/api/proxy-categories',
    '/api/blogs',
    '/api/blog-categories',
    '/api/store',
    '/api/auth/login',
    '/api/blog/',
    '/api/blog/:id',
    '/api/auth/refresh',
    '/api/auth/validate'
  ];

  // Skip middleware for public API routes
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
  if (isPublicApiRoute) {
    return NextResponse.next();
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Verify the token only for protected routes
    const payload = await verifyToken(token);
    if (!payload) {
      // Clear invalid token and redirect to login
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('authToken');
      return response;
    }

    // Check admin permissions for admin routes
    if (isAdminRoute && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/stores/:path*', // Include stores path for redirect handling
  ],
};