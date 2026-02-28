import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import config from '@/lib/config';

const API_URL = `${config.api.baseUrl}/api/blogs`;

// GET /api/blogs/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id === 'undefined') {
    return NextResponse.json({ message: 'Blog ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log(`[GET /api/blogs/${id}] Backend response status:`, response.status);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
      }
      const errBody = await response.text();
      console.error(`[GET /api/blogs/${id}] Backend error:`, errBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[GET /api/blogs/${id}] Data received:`, JSON.stringify(data).substring(0, 200) + "...");

    // Unwrap common response shapes to return the actual blog object
    const blog = (data?.data?.blog) ?? (data?.blog) ?? (data?.data) ?? data ?? null;
    return NextResponse.json({ blog });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch blog', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PUT /api/blogs/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const formData = await request.json();
    console.log(`[PUT /api/blogs/${id}] Data received from frontend:`, JSON.stringify(formData).substring(0, 300) + "...");

    const { cookies } = await import('next/headers');
    const token = cookies().get('authToken')?.value;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[PUT /api/blogs/${id}] Forwarding to backend: ${API_URL}/${id}`);
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(formData),
      cache: 'no-store',
      signal: AbortSignal.timeout(120000) // Support long-running updates/revalidation
    });

    console.log(`[PUT /api/blogs/${id}] Backend response status:`, response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const updatedBlog = (data?.data?.blog) ?? (data?.blog) ?? (data?.data) ?? data ?? null;

    // ===== CACHE INVALIDATION (CRITICAL FIX) =====
    // 1. Invalidate ALL dynamic blog detail pages at once.
    //    Previously we used revalidatePath('/blog/${id}') where id was the MongoDB ObjectID,
    //    but the page URL uses the SLUG (e.g. /blog/best-kitchen-knives-2026-expert-guide).
    //    This mismatch meant the Full Route Cache was NEVER cleared on update!
    revalidatePath('/blog/[id]', 'page');

    // 2. Also revalidate the exact slug path if we have it
    const slug = updatedBlog?.slug || formData?.slug;
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }

    // 3. Revalidate related pages
    revalidatePath('/blog');
    revalidatePath('/'); // Home page for Featured Blogs

    // 4. Invalidate data cache tags
    revalidateTag('blogs');
    revalidateTag('featured-blogs');
    revalidateTag(`blog-${id}`);

    console.log(`[Blog Update] Cache invalidated for blog ${id}${slug ? ` (slug: ${slug})` : ''}`);

    return NextResponse.json({ updatedBlog });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update blog', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


// DELETE /api/blogs/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { cookies } = await import('next/headers');
    const token = cookies().get('authToken')?.value;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(120000) // Support long-running deletion/revalidation
    });
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Revalidate blog-related pages and tags after deletion
    // CRITICAL: Use dynamic route pattern to invalidate ALL blog detail pages
    revalidatePath('/blog/[id]', 'page');
    revalidatePath('/blog');
    revalidatePath('/'); // Home page for Featured Blogs
    revalidateTag('blogs');
    revalidateTag('featured-blogs');
    revalidateTag(`blog-${id}`);

    console.log(`[Blog Delete] Cache invalidated for blog ${id}`);

    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete blog', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


