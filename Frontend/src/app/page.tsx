import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import HeroBanner from "@/components/ui/HeroBanner";
import BlogList from "@/components/blog/BlogList";
import config from '@/lib/config';
import { themeClasses } from '@/lib/theme/utils';
import { getBrandConfig } from '@config/server-config';
import { fetchHomeDataServer } from "@/lib/serverData";

// ISR: revalidate the page every 60s. Build-time fetches fail gracefully (return []).
export const revalidate = 60;

// Dynamic metadata per brand
export async function generateMetadata(): Promise<Metadata> {
  const brand = getBrandConfig();
  return {
    title: `Featured Blogs | ${brand.siteName}`,
    description: brand.metaDescription,
    openGraph: {
      title: `Featured Blogs | ${brand.siteName}`,
      description: brand.metaDescription,
      images: [brand.ogImage || '/image/travel_cat.png'],
    },
  };
}



export default async function Blogs() {
  const brand = getBrandConfig();
  
  // Use our optimized server-side helper
  const { featuredBlogs, bannerBlogs } = await fetchHomeDataServer();

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Banner: with proper spacing matching header */}
      <section className="relative pt-2 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HeroBanner className="w-full" initialBlogs={bannerBlogs} />
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="max-w-7xl mx-auto pt-8 md:pt-12 pb-0 px-4 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
          <div className="space-y-4 text-center md:text-left">
            <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${themeClasses.text.primary}`}>
              Explore Our Universe
            </h2>
            <div className="h-1.5 w-24 bg-gradient-brand-to-accent rounded-full mx-auto md:mx-0" />
            <p className={`${themeClasses.text.secondary} text-lg md:text-xl max-w-2xl italic`}>
              Dive into experts insights across various categories
            </p>
          </div>
          <Link
            href="/categories"
            className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-brand-primary/20 text-brand-primary font-bold hover:bg-brand-primary hover:text-white transition-all duration-300 group whitespace-nowrap"
          >
            View All Categories
            <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 pb-8 md:pb-0 px-4 md:px-0 -mx-4 md:mx-0">
          {/* Travel Category */}
          <Link href="/blog/category/travel" className="flex-shrink-0 w-[240px] sm:w-[300px] md:w-auto snap-center block">
            <div className="group relative h-[340px] md:h-[420px] overflow-hidden rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-blue-500/20 bg-blue-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/travel_cat.png"
                  alt="Travel Destinations"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-blue-500/40 ring-2 ring-white/20">
                  Adventure
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-2xl">
                  ✈️ Travel
                </h3>
                <p className="text-blue-50/90 text-xs md:text-sm leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                  Discover hidden gems and breathtaking destinations around the globe.
                </p>
              </div>
            </div>
          </Link>

          {/* Health & Wellness Category */}
          <Link href="/blog/category/health-and-beauty" className="flex-shrink-0 w-[240px] sm:w-[300px] md:w-auto snap-center block">
            <div className="group relative h-[340px] md:h-[420px] overflow-hidden rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-emerald-500/20 bg-emerald-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/health_cat.png"
                  alt="Health & Wellness"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-emerald-600/10 group-hover:bg-emerald-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-emerald-500/40 ring-2 ring-white/20">
                  Vitality
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-2xl">
                  🌿 Health
                </h3>
                <p className="text-emerald-50/90 text-xs md:text-sm leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                  Expert-backed wellness tips and holistic health guides for you.
                </p>
              </div>
            </div>
          </Link>

          {/* Lifestyle Category */}
          <Link href="/blog/category/lifestyle" className="flex-shrink-0 w-[240px] sm:w-[300px] md:w-auto snap-center block">
            <div className="group relative h-[340px] md:h-[420px] overflow-hidden rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-purple-500/20 bg-purple-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/lifestyle_cat.png"
                  alt="Lifestyle & Fashion"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-purple-600/10 group-hover:bg-purple-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-3 py-1 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-purple-500/40 ring-2 ring-white/20">
                  Style
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-2xl">
                  ✨ Lifestyle
                </h3>
                <p className="text-purple-50/90 text-xs md:text-sm leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                  Inspiration for better living, fashion, and mindful productivity.
                </p>
              </div>
            </div>
          </Link>

          {/* Technology Category */}
          <Link href="/blog/category/home-and-tech" className="flex-shrink-0 w-[240px] sm:w-[300px] md:w-auto snap-center block">
            <div className="group relative h-[340px] md:h-[420px] overflow-hidden rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] cursor-pointer border border-orange-500/20 bg-orange-50">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/image/tech_cat.png"
                  alt="Home & Tech"
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/90 via-orange-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-orange-600/10 group-hover:bg-orange-600/0 transition-colors z-20" />

              <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                <div className="inline-block px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-orange-500/40 ring-2 ring-white/20">
                  Modern
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2 drop-shadow-2xl">
                  🚀 Technology
                </h3>
                <p className="text-orange-50/90 text-xs md:text-sm leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                  Latest gadgets, app reviews, and futuristic home tech insights.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Blogs Section */}
      <section className={`pt-10 md:pt-16 pb-24 relative overflow-hidden bg-white`}>
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
