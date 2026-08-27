// app/blog/[id]/page.tsx

import { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';
import parse, { attributesToProps, DOMNode, Element, domToReact } from 'html-react-parser';
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
import { sanitizeBrandText, cleanTypography } from '@/lib/utils/formatting';

// Helper to extract text from AST nodes
function getTextFromNode(node: any): string {
  if (!node) return '';
  if (node.type === 'text') {
    return node.data || '';
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(getTextFromNode).join('');
  }
  return '';
}

// --- Semantic Blog Content Formatter & Parser ---
function formatAndParseBlogContent(rawContent: string, brandName: string, store?: { name?: string; url?: string }) {
  if (!rawContent) return null;

  // 1. Clean recursive encoding and typography artifacts
  const content = sanitizeBrandText(decodeRecursively(rawContent), brandName);

  // 2. Check if content already contains block HTML tags
  const hasHtmlTags = /<\/?(p|div|h[1-6]|ul|ol|li|table|blockquote|section|article|style)\b/i.test(content);

  let formattedHtml = content;

  if (!hasHtmlTags) {
    // Only for plain text / legacy markdown blogs without HTML tags:
    const rawLines = content
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(l => l.trim());

    const processedBlocks: string[] = [];
    let currentList: string[] = [];
    let isNumberedList = false;

    const flushList = () => {
      if (currentList.length > 0) {
        if (isNumberedList) {
          processedBlocks.push(
            `<ol class="list-decimal pl-6 space-y-2.5 my-6 text-foreground/90 font-medium text-base md:text-lg">${currentList.map(item => `<li>${item}</li>`).join('')}</ol>`
          );
        } else {
          processedBlocks.push(
            `<ul class="list-disc pl-6 space-y-2 my-6 text-foreground/90 text-base md:text-lg">${currentList.map(item => `<li>${item}</li>`).join('')}</ul>`
          );
        }
        currentList = [];
        isNumberedList = false;
      }
    };

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line) {
        flushList();
        continue;
      }

      if (line.startsWith('```')) {
        flushList();
        continue;
      }

      const isCtaLine = /^(SHOP\s|BUY\s|GET\s|EXPLORE\s|VISIT\s|.*RECOMMENDS\s)/i.test(line) && line.length < 90;
      if (isCtaLine) {
        flushList();
        const targetUrl = store?.url || '#';
        const cleanedTitle = cleanTypography(line);
        let buttonText = /^SHOP\s/i.test(line) ? `Shop ${store?.name || 'Now'}` : 'Shop Now';
        processedBlocks.push(`
          <div class="my-8 p-6 sm:p-7 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-background-secondary/70 to-card shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 not-prose">
            <div class="space-y-2 text-center md:text-left flex-1 min-w-0">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand-accent/15 text-brand-accent border border-brand-accent/30 whitespace-nowrap shadow-sm">
                <span>★</span>
                <span>Verified Recommendation</span>
              </div>
              <h4 class="text-xl sm:text-2xl font-black text-foreground pt-1 leading-snug tracking-tight">${cleanedTitle}</h4>
              <p class="text-xs sm:text-sm text-foreground-secondary font-medium">Exclusive deals & verified discounts available for our readers</p>
            </div>
            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer nofollow" class="blog-cta-btn px-8 py-3.5 rounded-full !no-underline uppercase tracking-wider text-xs sm:text-sm font-black shrink-0 cursor-pointer gap-2">
              <span>${buttonText}</span>
              <span class="text-base font-black">→</span>
            </a>
          </div>
        `);
        continue;
      }

      // Check for Numbered List items
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        if (!isNumberedList && currentList.length > 0) flushList();
        isNumberedList = true;
        currentList.push(`<strong>${numberedMatch[2]}</strong>`);
        continue;
      }

      // Check for Bullet points
      const bulletMatch = line.match(/^[-*•]\s+(.*)/);
      if (bulletMatch) {
        if (isNumberedList && currentList.length > 0) flushList();
        isNumberedList = false;
        currentList.push(bulletMatch[1]);
        continue;
      }

      // Check for Short feature list item
      const nextLine = rawLines[i + 1];
      const isShortItem = line.length < 50 && !line.endsWith('.') && !line.endsWith(':') && !line.endsWith('?') &&
        ((nextLine && nextLine.length < 50 && !nextLine.endsWith('.') && !nextLine.endsWith('?')) || currentList.length > 0);

      if (isShortItem && !line.startsWith('##') && !line.startsWith('###')) {
        if (isNumberedList && currentList.length > 0) flushList();
        isNumberedList = false;
        currentList.push(line);
        continue;
      }

      flushList();

      if (line.startsWith('## ') || line.startsWith('### ')) {
        const headingText = line.replace(/^#{2,3}\s+/, '');
        const headingId = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        processedBlocks.push(`<h2 id="${headingId}" class="text-2xl md:text-3xl font-black text-foreground mt-10 mb-4 tracking-tight scroll-mt-24">${headingText}</h2>`);
        continue;
      }

      const isHeadingPattern = (
        line.endsWith('?') ||
        /^(Best|Why|What|How|Frequently Asked Questions|Conclusion|Summary|Real Owner Experiences|Future Trends|Top Rated|Final Thoughts|Key Takeaways|The Verdict)\b/i.test(line)
      ) && line.length < 80 && !line.endsWith('.');

      if (isHeadingPattern) {
        const headingId = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        processedBlocks.push(`<h2 id="${headingId}" class="text-2xl md:text-3xl font-black text-foreground mt-10 mb-4 tracking-tight scroll-mt-24">${line}</h2>`);
        continue;
      }

      processedBlocks.push(`<p class="mb-6 text-base md:text-lg leading-relaxed text-foreground/90 font-normal">${line}</p>`);
    }

    flushList();
    formattedHtml = processedBlocks.join('\n');
  }

  return parse(formattedHtml, {
    replace: (domNode) => {
      const node = domNode as Element;
      if (!node || !node.name) return;

      // Ensure <style> tags render their CSS rules directly in React
      if (node.name === 'style') {
        const cssContent = getTextFromNode(node);
        return <style dangerouslySetInnerHTML={{ __html: cssContent }} />;
      }

      // Auto-assign IDs to headings for Table of Contents if not present, while preserving all existing styles/attributes
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.name)) {
        const text = getTextFromNode(node);
        const id = node.attribs?.id || text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const props = attributesToProps(node.attribs || {});
        const Tag = node.name as any;
        return (
          <Tag {...props} id={id}>
            {domToReact(node.children as DOMNode[])}
          </Tag>
        );
      }
    },
  });
}

type Params = Promise<{ id: string }>;

// Generate metadata - no changes needed here
export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const [{ data: blog }, brand] = await Promise.all([
    fetchBlogDetailServer(params.id),
    getBrandConfig()
  ]);
  if (!blog) return { title: 'Blog Not Found' };
  return {
    title: sanitizeBrandText(blog.meta?.title || blog.title, brand.siteName),
    description: sanitizeBrandText(blog.meta?.description || blog.excerpt || 'Blog post description', brand.siteName),
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
              <p className="text-foreground-secondary mb-8 leading-relaxed">
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
          <ol className="flex items-center space-x-2 text-foreground-secondary">
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
              <span className="text-foreground font-medium line-clamp-1">{cleanTypography(blog.title)}</span>
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


                {/* Title (Only render if content doesn't already have an h1 tag) */}
                {!/<h1\b/i.test(blog.longDescription || '') && (
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-foreground leading-tight">
                    {sanitizeBrandText(blog.title, brand.siteName)}
                  </h1>
                )}





                {/* Blog Content */}
                {blog.longDescription ? (
                  <article className="blog-content prose prose-lg md:prose-xl lg:prose-xl prose-slate dark:prose-invert w-full max-w-none">
                    {formatAndParseBlogContent(blog.longDescription, brand.siteName, blog.store)}
                  </article>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-400 text-2xl">📝</span>
                    </div>
                    <p className="text-foreground-secondary italic">No content available for this post.</p>
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
