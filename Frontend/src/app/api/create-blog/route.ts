import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import config from '@/lib/config';

const API_URL = `${config.api.baseUrl}/api/blogs`;

const createBlog = async (blogData: any) => {
  try {
    const { cookies } = await import('next/headers');
    const token = cookies().get('authToken')?.value;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(blogData),
      // Add timeout for better error handling
      signal: AbortSignal.timeout(30000)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Success Response:', data);
    return data;
  } catch (error) {
    console.error('Error creating blog:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const blogData = await request.json();

    // Validate required fields
    if (!blogData.title || !blogData.shortDescription || !blogData.longDescription) {
      return NextResponse.json(
        {
          error: 'Title, short description, and long description are required fields.'
        },
        { status: 400 }
      );
    }

    // Validate author object
    if (!blogData.author || typeof blogData.author !== 'object') {
      return NextResponse.json(
        {
          error: 'Author must be an object with required fields.'
        },
        { status: 400 }
      );
    }

    if (!blogData.author.name || typeof blogData.author.name !== 'string') {
      return NextResponse.json(
        {
          error: 'Author name is required and must be a string.'
        },
        { status: 400 }
      );
    }

    // Validate category object
    if (!blogData.category || typeof blogData.category !== 'object') {
      return NextResponse.json(
        {
          error: 'Category must be an object with required fields.'
        },
        { status: 400 }
      );
    }

    if (!blogData.category.id || !blogData.category.name) {
      return NextResponse.json(
        {
          error: 'Category must have both id and name fields.'
        },
        { status: 400 }
      );
    }

    // Validate store object - optional
    if (blogData.store) {
      if (!blogData.store.id || !blogData.store.name) {
        return NextResponse.json(
          {
            error: 'Store must have both id and name fields.'
          },
          { status: 400 }
        );
      }

      // Validate that store has URL if provided
      if (blogData.store.url && typeof blogData.store.url !== 'string') {
        return NextResponse.json(
          {
            error: 'Store URL must be a valid string.'
          },
          { status: 400 }
        );
      }
    }

    // Clean and validate store URL if present
    if (blogData.store && blogData.store.url) {
      let cleanStoreUrl = blogData.store.url;

      // Remove HTML entities
      cleanStoreUrl = cleanStoreUrl.replace(/&#x2F;/g, '/');

      // Remove any existing protocol to avoid duplication
      cleanStoreUrl = cleanStoreUrl.replace(/^https?:\/\//, '');

      // Remove trailing slashes and clean up
      cleanStoreUrl = cleanStoreUrl.replace(/\/+$/, '');

      // Add https:// protocol
      cleanStoreUrl = 'https://' + cleanStoreUrl;

      // Validate that the URL is a valid URI with protocol
      try {
        const url = new URL(cleanStoreUrl);
        if (!url.protocol || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
          return NextResponse.json(
            {
              error: 'Store URL must be a valid URI with http:// or https:// protocol.'
            },
            { status: 400 }
          );
        }

        // Additional validation: reject Google search URLs
        if (url.hostname.includes('google.com') ||
          url.hostname.includes('bing.com') ||
          url.hostname.includes('yahoo.com') ||
          (url.pathname.includes('search') && url.searchParams.has('q'))) {
          return NextResponse.json(
            {
              error: 'Store URL should be a direct website URL, not a search result.'
            },
            { status: 400 }
          );
        }

        // Validate hostname format
        if (!url.hostname || url.hostname.length < 3) {
          return NextResponse.json(
            {
              error: 'Store URL must have a valid hostname.'
            },
            { status: 400 }
          );
        }

        // Update the store URL with cleaned version
        blogData.store.url = cleanStoreUrl;
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Store URL must be a valid URI format.'
          },
          { status: 400 }
        );
      }
    }

    // Validate field lengths
    if (blogData.title.length < 3) {
      return NextResponse.json(
        {
          error: 'Title must be at least 3 characters long.'
        },
        { status: 400 }
      );
    }

    if (blogData.shortDescription.length < 10) {
      return NextResponse.json(
        {
          error: 'Short description must be at least 10 characters long.'
        },
        { status: 400 }
      );
    }

    if (blogData.longDescription.length < 50) {
      return NextResponse.json(
        {
          error: 'Long description must be at least 50 characters long.'
        },
        { status: 400 }
      );
    }

    // Process meta keywords from string to array
    const processKeywords = (keywords: string | string[] | undefined): string[] | undefined => {
      if (!keywords) return undefined;

      if (Array.isArray(keywords)) {
        // If already an array, clean and filter
        return keywords
          .map(keyword => keyword.trim())
          .filter(keyword => keyword.length > 0);
      }

      // If string, split by comma and clean
      if (typeof keywords === 'string') {
        return keywords
          .split(',')
          .map(keyword => keyword.trim())
          .filter(keyword => keyword.length > 0);
      }

      return undefined;
    };

    // Clean up the blog data to ensure proper structure
    const cleanedBlogData = {
      title: blogData.title,
      shortDescription: blogData.shortDescription,
      longDescription: blogData.longDescription,
      author: {
        name: blogData.author.name,
        email: blogData.author.email || undefined,
        avatar: blogData.author.avatar || undefined,
      },
      category: {
        id: blogData.category.id,
        name: blogData.category.name,
        slug: blogData.category.slug || blogData.category.name.toLowerCase().replace(/\s+/g, '-'),
      },
      store: blogData.store ? {
        id: blogData.store.id,
        name: blogData.store.name,
        url: blogData.store.url || undefined,
      } : undefined,
      status: blogData.status || 'draft',
      isFeaturedForHome: blogData.isFeaturedForHome || blogData.isFeatured || false, // Match backend expectation
      image: blogData.image || undefined,
      tags: blogData.tags || undefined,
      // SEO Metadata with proper keywords array
      meta: blogData.meta ? {
        title: blogData.meta.title || undefined,
        description: blogData.meta.description || undefined,
        keywords: processKeywords(blogData.meta.keywords), // Convert to array
        canonicalUrl: blogData.meta.canonicalUrl || undefined,
        robots: blogData.meta.robots || 'index,follow',
      } : undefined,
      // FAQs
      faqs: blogData.faqs || undefined,
    };

    console.log('Sending blog data to backend:', JSON.stringify(cleanedBlogData, null, 2));
    console.log('Store URL being sent:', cleanedBlogData.store?.url);
    console.log('Meta keywords being sent:', cleanedBlogData.meta?.keywords);

    const result = await createBlog(cleanedBlogData);

    // Revalidate blog-related pages and tags after creation
    // Use dynamic route pattern to cover all blog detail pages
    revalidatePath('/blog/[id]', 'page');
    revalidatePath('/blog');
    revalidatePath('/'); // Revalidate home page for Featured Blogs
    revalidateTag('blogs');
    revalidateTag('featured-blogs');
    if (result?.data?.id || result?.id) {
      const blogId = result?.data?.id || result?.id;
      revalidateTag(`blog-${blogId}`);
    }
    // Also revalidate by slug if available
    const newSlug = result?.data?.slug || result?.slug;
    if (newSlug) {
      revalidatePath(`/blog/${newSlug}`);
    }


    return NextResponse.json({
      success: true,
      message: 'Blog created successfully!',
      blog: result
    });
  } catch (error) {
    console.error('Failed to create blog:', error);

    // Determine error type and provide appropriate response
    let errorMessage = 'Failed to create blog. Please try again.';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        errorMessage = 'Unable to connect to the backend service. Please check your network connection.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes('timeout') || error.name === 'AbortError') {
        errorMessage = 'Request timeout. The server is taking too long to respond.';
        statusCode = 408; // Request Timeout
      } else if (error.message.includes('HTTP error! status:')) {
        const statusMatch = error.message.match(/status: (\d+)/);
        if (statusMatch) {
          statusCode = parseInt(statusMatch[1]);
          if (statusCode === 400) {
            errorMessage = 'Invalid blog data. Please check all required fields.';
          } else if (statusCode === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (statusCode === 403) {
            errorMessage = 'Permission denied. You do not have access to create blogs.';
          } else if (statusCode >= 500) {
            errorMessage = 'Backend server error. Please try again later.';
          }
        }
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        apiUrl: API_URL
      },
      { status: statusCode }
    );
  }
}