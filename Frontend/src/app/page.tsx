import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import HeroBanner from "@/components/ui/HeroBanner";
import BlogList from "@/components/blog/BlogList";
import config from '@/lib/config';
import { themeClasses } from '@/lib/theme/utils';
import { getBrandConfig } from '@config/index';

// Dynamic metadata per brand
export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  return {
    title: `Featured Blogs | ${brand.siteName}`,
    description: brand.metaDescription,
    openGraph: {
      title: `Featured Blogs | ${brand.siteName}`,
      description: brand.metaDescription,
      images: [brand.ogImage || '/image/travel1.jpg'],
    },
  };
}

// Fetch data at build time or with revalidation
async function fetchFeaturedBlogs() {
  const FETCH_TIMEOUT = 30000; // 30s: safety net for cold-start DB connections
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(`${config.api.baseUrl}/api/blogs?isFeaturedForHome=true&sort=-createdAt&limit=9`, {
      signal: controller.signal,
      next: { revalidate: 3600 } // Revalidate every hour
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const result = await response.json();
    return result.data?.blogs || result.blogs || [];
  } catch (error) {
    console.error("Error fetching featured blogs:", error);
    return [];
  }
}

export default async function Blogs() {
  // Fetch data server-side
  const featuredBlogs = await fetchFeaturedBlogs();

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Banner: with proper spacing matching header */}
      <section className="relative pt-2 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HeroBanner className="w-full" />
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto py-20 px-4 md:px-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className={`text-5xl font-extrabold tracking-tight ${themeClasses.text.primary}`}>
            Explore Our Universe
          </h2>
          <div className="h-1.5 w-24 bg-gradient-brand-to-accent mx-auto rounded-full" />
          <p className={`${themeClasses.text.secondary} text-xl max-w-2xl mx-auto italic`}>
            Dive into experts insights across various categories
          </p>
        </div>

        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 pb-8 md:pb-0 px-4 md:px-0 -mx-4 md:mx-0">
          {/* Travel Category */}
          <Link href="/blog/category/travel" className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto snap-center block">
            <div className="group relative h-[450px] overflow-hidden rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-blue-500/20 bg-blue-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/travel1.jpg"
                  alt="Travel Destinations"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-8 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-lg shadow-blue-500/40 ring-2 ring-white/20">
                  Adventure
                </div>
                <h3 className="text-3xl font-black text-white mb-3 drop-shadow-2xl">
                  ✈️ Travel
                </h3>
                <p className="text-blue-50/90 text-sm leading-relaxed font-medium">
                  Discover hidden gems and breathtaking destinations around the globe.
                </p>
              </div>
            </div>
          </Link>

          {/* Health & Wellness Category */}
          <Link href="/blog/category/health-and-beauty" className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto snap-center block">
            <div className="group relative h-[450px] overflow-hidden rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-emerald-500/20 bg-emerald-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/health1.jpg"
                  alt="Health & Wellness"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-emerald-600/10 group-hover:bg-emerald-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-8 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-lg shadow-emerald-500/40 ring-2 ring-white/20">
                  Vitality
                </div>
                <h3 className="text-3xl font-black text-white mb-3 drop-shadow-2xl">
                  🌿 Health
                </h3>
                <p className="text-emerald-50/90 text-sm leading-relaxed font-medium">
                  Expert-backed wellness tips and holistic health guides for you.
                </p>
              </div>
            </div>
          </Link>

          {/* Lifestyle Category */}
          <Link href="/blog/category/lifestyle" className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto snap-center block">
            <div className="group relative h-[450px] overflow-hidden rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-purple-500/20 bg-purple-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/fashion1.jpg"
                  alt="Lifestyle & Fashion"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-purple-600/10 group-hover:bg-purple-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-8 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-lg shadow-purple-500/40 ring-2 ring-white/20">
                  Style
                </div>
                <h3 className="text-3xl font-black text-white mb-3 drop-shadow-2xl">
                  ✨ Lifestyle
                </h3>
                <p className="text-purple-50/90 text-sm leading-relaxed font-medium">
                  Inspiration for better living, fashion, and mindful productivity.
                </p>
              </div>
            </div>
          </Link>

          {/* Technology Category */}
          <Link href="/blog/category/home-and-tech" className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-auto snap-center block">
            <div className="group relative h-[450px] overflow-hidden rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-orange-500/20 bg-orange-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/app.png"
                  alt="Home & Tech"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/90 via-orange-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-orange-600/10 group-hover:bg-orange-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-8 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold uppercase tracking-widest mb-4 shadow-lg shadow-orange-500/40 ring-2 ring-white/20">
                  Modern
                </div>
                <h3 className="text-3xl font-black text-white mb-3 drop-shadow-2xl">
                  🚀 Technology
                </h3>
                <p className="text-orange-50/90 text-sm leading-relaxed font-medium">
                  Latest gadgets, app reviews, and futuristic home tech insights.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Blogs Section */}
      <section className={`py-24 relative overflow-hidden bg-white`}>
        {/* Subtle decorative multi-color blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] -ml-64 -mb-64" />

        <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <h2 className={`text-4xl md:text-5xl font-black tracking-tight ${themeClasses.text.primary}`}>
                Handpicked Stories
              </h2>
              <div className="h-1.5 w-20 bg-gradient-brand-to-accent rounded-full" />
              <p className={`${themeClasses.text.secondary} text-lg font-medium`}>
                Don't miss out on our most popular and insightful content
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary hover:text-white transition-all duration-300 group"
            >
              View All Posts
              <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <div className="min-h-[400px]">
            <BlogList
              apiEndpoint="/api/blogs?isFeaturedForHome=true"
              isEmbedded={true}
              initialPosts={featuredBlogs}
              emptyStateMessage="No featured blogs found."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
