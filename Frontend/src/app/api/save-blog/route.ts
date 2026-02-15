import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Blog data interface
interface BlogData {
  title: string;
  shortDescription: string;
  longDescription: string;
  author: string;
  category: string;
  status: 'draft' | 'published';
  isFeatured: boolean;
  image: {
    url: string;
    alt: string;
  };
}

// Mock blog storage (in production, this would be your CMS or database)
let blogPosts: (BlogData & { id: string; createdAt: string; updatedAt: string })[] = [];

// This function will simulate saving blog data to your CMS (replace with your CMS API)
const saveBlogData = async (blogData: BlogData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create new blog post with metadata
  const newBlog = {
    id: Math.random().toString(36).substr(2, 9),
    ...blogData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to storage
  blogPosts.push(newBlog);

  // Log for debugging
  console.log('Blog saved successfully:', newBlog);

  return { 
    success: true, 
    blog: newBlog,
    message: 'Blog post saved successfully!' 
  };
};

export async function POST(request: NextRequest) {
  try {
    const blogData: BlogData = await request.json();

    // Validate required fields
    if (!blogData.title || !blogData.shortDescription || !blogData.longDescription) {
      return NextResponse.json(
        { 
          error: 'Title, short description, and long description are required fields.' 
        },
        { status: 400 }
      );
    }

    // Validate title length
    if (blogData.title.length < 3) {
      return NextResponse.json(
        { 
          error: 'Title must be at least 3 characters long.' 
        },
        { status: 400 }
      );
    }

    // Validate description lengths
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

    // Save the blog data
    const result = await saveBlogData(blogData);
    
    // Revalidate blog-related pages and tags after saving
    revalidatePath('/blog');
    revalidateTag('blogs');
    if (result?.blog?.id) {
      revalidatePath(`/blog/${result.blog.id}`);
      revalidateTag(`blog-${result.blog.id}`);
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error saving blog:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save blog. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve all blog posts (for debugging/testing)
export async function GET() {
  try {
    return NextResponse.json({ 
      blogs: blogPosts,
      count: blogPosts.length,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch blogs.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}