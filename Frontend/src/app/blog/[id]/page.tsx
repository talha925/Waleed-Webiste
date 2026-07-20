// app/blog/[id]/page.tsx

import { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';
import config from '@/lib/config';
import { decode } from 'html-entities';
import TableOfContents from '@/components/blog/TableOfContents';
import RecentBlogs from '@/components/blog/RecentBlogs';
import ReadingProgress from '@/components/blog/ReadingProgress';
import { themeClasses } from '@/lib/theme/utils';

import BackToTop from '@/components/blog/BackToTop';

// ISR: revalidate blog pages every 60s for fresh content + edge caching
export const revalidate = 60;

// Blog Type Interface
interface Blog {
  _id: string;
  title: string;
  slug?: string;
  longDescription?: string;
  image?: { url: string; alt?: string; };
  meta?: { title?: string; description?: string; keywords?: string; };
  excerpt?: string;
  createdAt?: string;
  author?: {
    name: string;
    email?: string;
    avatar?: string;
  } | string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  redirectUrl?: string;
}

// NEW HELPER: This function will decode the string repeatedly until it's clean.
// This will fix your "&lt;p&gt;&amp;lt;p&amp;gt;..." issue.
function decodeRecursively(text: string): string {
  let newText = decode(text);
  while (newText !== text) {
    text = newText;
    newText = decode(text);
  }
  return newText;
}



import { getBrandConfig } from '@config/server-config';
import { fetchBlogDetailServer, fetchRecentBlogsServer } from '@/lib/serverData';

// --- Main Page Component ---
function customParser(html: string) {
  // First, fully clean the double (or triple) encoded HTML string
  const decodedHtml = decodeRecursively(html);

  return parse(decodedHtml, {
    replace: (domNode) => {
      const node = domNode as Element;
      // Fix for invalid nesting like <p><ul>...</ul></p>
      if (node.name === 'p') {
        const containsBlockElement = node.children.some(
          (child) =>
            child.type === 'tag' &&
            ['ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'div', 'blockquote'].includes((child as Element).name)
        );
        if (containsBlockElement) {
          return <>{domToReact(node.children as DOMNode[], { replace: () => null })}</>;
        }
      }
    },
  });
}

type Params = Promise<{ id: string }>;

// Generate metadata - no changes needed here
export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const { data: blog } = await fetchBlogDetailServer(params.id);
  if (!blog) return { title: 'Blog Not Found' };
  return {
    title: blog.meta?.title || blog.title,
    description: blog.meta?.description || blog.excerpt || 'Blog post description',
  };
}


import { redirect, notFound } from 'next/navigation';

// ... other imports

// --- Main Page Component ---
export default async function BlogDetailPage(props: { params: Params }) {
  const params = await props.params;
  const [{ data: blog }, { data: recentBlogs }] = await Promise.all([
    fetchBlogDetailServer(params.id),
    fetchRecentBlogsServer(5, params.id)
  ]);

  if (blog?.redirectUrl) {
    redirect(`/blog/${blog.redirectUrl}`);
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Blog not found */}
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              {/* Decorative elements */}
              <div className="relative mb-8">
                <div className={`w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6`}>
                  <div className={`w-20 h-20 bg-primary rounded-full flex items-center justify-center`}>
                    <span className="text-white text-3xl font-bold">!</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-accent/20 rounded-full opacity-40 animate-pulse delay-300"></div>
              </div>

              <h1 className={`text-4xl font-bold text-primary mb-4`}>
                Blog Not Found
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                The blog post you're looking for doesn't exist or has been moved. Let's get you back on track!
              </p>

              <a
                href="/blog"
                className={`inline-flex items-center px-8 py-4 ${themeClasses.buttons.orange} transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
              >
                <span className="mr-2">📚</span>
                Browse All Blogs
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const brand = await getBrandConfig();
  const fullUrl = `${brand.siteUrl}/blog/${blog.slug || params.id}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Indicator */}
      <ReadingProgress />

      <div className="relative z-10 container mx-auto px-4 py-8 pb-24">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 text-sm" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <a href="/" className="hover:text-primary transition-colors">Home</a>
            </li>
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <a href="/blog" className="hover:text-primary transition-colors">Blog</a>
            </li>
            {blog.category && (
              <li className="flex items-center">
                <span className="mx-2">/</span>
                <a
                  href={`/blog/category/${blog.category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {blog.category.name}
                </a>
              </li>
            )}
            <li className="flex items-center">
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium line-clamp-1">{blog.title}</span>
            </li>
          </ol>
        </nav>

        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_240px] gap-8 lg:gap-10 xl:gap-12 max-w-7xl xl:max-w-8xl mx-auto">
          {/* Left Sidebar - Table of Contents */}
          <aside className="hidden lg:block bg-transparent">
            <div className="sticky-sidebar">
              <TableOfContents />
            </div>
          </aside>

          {/* Main Content */}
          <main>
            <article className="">
              {/* Hero Image */}
              {blog.image?.url && (
                <div className="relative w-full rounded-2xl overflow-hidden mb-8">
                  <SafeImage
                    src={blog.image.url}
                    alt={blog.image.alt || blog.title}
                    width={1200}
                    height={630}
                    className="w-full h-auto object-contain"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
                  />
                </div>
              )}

              {/* Content */}
              <div className="">


                {/* Title */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-gray-900 leading-tight">
                  {blog.title}
                </h1>





                {/* Blog Content */}
                {blog.longDescription ? (
                  <article className="blog-content prose prose-lg md:prose-xl lg:prose-xl prose-slate w-full max-w-none">
                    {customParser(blog.longDescription)}
                  </article>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">📝</span>
                    </div>
                    <p className="text-gray-500 italic">No content available for this post.</p>
                  </div>
                )}


              </div>
            </article>
          </main>

          {/* Right Sidebar - Recent Blogs */}
          <aside className="hidden lg:block">
            <div className="sticky-sidebar">
              <RecentBlogs currentBlogId={blog._id} limit={5} initialBlogs={recentBlogs} />
            </div>
          </aside>
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
}
