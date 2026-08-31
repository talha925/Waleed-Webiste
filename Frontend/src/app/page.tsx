import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Sparkles, ArrowRight } from "lucide-react";
import HeroBanner from "@/components/ui/HeroBanner";
import BlogList from "@/components/blog/BlogList";
import { themeClasses } from '@/lib/theme/utils';
import { getBrandConfig } from '@config/server-config';
import { fetchHomeDataServer } from "@/lib/serverData";

// Force dynamic rendering since brand detection depends on the hostname header
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: brand.metaTitle || `Featured Blogs | ${brand.siteName}`,
    description: brand.metaDescription,
    alternates: {
      canonical: brand.siteUrl,
    },
    openGraph: {
      title: brand.metaTitle || `Featured Blogs | ${brand.siteName}`,
      description: brand.metaDescription,
      url: brand.siteUrl,
      siteName: brand.siteName,
      images: [brand.ogImage || '/image/travel_cat.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function Blogs() {
  const brand = await getBrandConfig();
  const isSpecReveal = brand.brandId === 'specreveal';
  
  // Fetch home data
  const { featuredBlogs, bannerBlogs } = await fetchHomeDataServer();

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Banner Section */}
      <section className="relative pt-2 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HeroBanner className="w-full" initialBlogs={bannerBlogs} />
        </div>
      </section>

      {/* Category Grid Section */}
      {isSpecReveal ? (
        /* SPEC REVEAL: Dark Dim-Shaded Tech Vault Grid */
        <section className="max-w-7xl mx-auto pt-8 md:pt-12 pb-0 px-4 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div className="space-y-4 text-center md:text-left">
              <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${themeClasses.text.primary}`}>
                Explore Our Universe
              </h2>
              <div className="h-1.5 w-24 bg-brand-primary rounded-full mx-auto md:mx-0" />
              <p className={`${themeClasses.text.secondary} text-lg md:text-xl max-w-2xl italic`}>
                Dive into expert insights across various categories
              </p>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl border-2 border-brand-primary/40 text-brand-primary font-bold hover:bg-brand-primary hover:text-white transition-all duration-300 group whitespace-nowrap shadow-md"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Hardware Vault */}
            <Link href="/blog/category/home-and-tech" className="block w-full">
              <div className="group relative h-[380px] md:h-[440px] overflow-hidden rounded-[2.5rem] isolate shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/10 hover:border-brand-primary/50 bg-slate-950">
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/image/tech_cat.png"
                    alt="Home & Tech"
                    fill
                    className="object-cover opacity-45 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-55"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40 z-10" />
                <div className="absolute top-6 inset-x-6 flex items-center justify-between z-30">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-brand-primary border border-brand-primary/40 text-[10px] font-black uppercase tracking-widest shadow-md">
                    Hardware
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-widest">
                    VAULT 01
                  </span>
                </div>
                <div className="absolute bottom-0 w-full p-6 md:p-7 z-30 flex flex-col justify-end">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-md">
                    🚀 Tech & Innovation
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-normal line-clamp-2 mb-4">
                    Gadget teardowns, smart home benchmarks, and verified tech insights.
                  </p>
                  <div className="inline-flex items-center text-xs font-black uppercase tracking-wider text-brand-primary group-hover:text-brand-primary/80 transition-colors">
                    <span>Browse Tech Reviews</span>
                    <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Expedition Vault */}
            <Link href="/blog/category/travel" className="block w-full">
              <div className="group relative h-[380px] md:h-[440px] overflow-hidden rounded-[2.5rem] isolate shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/10 hover:border-blue-500/50 bg-slate-950">
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/image/travel_cat.png"
                    alt="Travel Destinations"
                    fill
                    className="object-cover opacity-45 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-55"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40 z-10" />
                <div className="absolute top-6 inset-x-6 flex items-center justify-between z-30">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                    Expedition
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-widest">
                    VAULT 02
                  </span>
                </div>
                <div className="absolute bottom-0 w-full p-6 md:p-7 z-30 flex flex-col justify-end">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-md">
                    ✈️ Travel & Luggage
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-normal line-clamp-2 mb-4">
                    Tested carry-ons, flight accessories, and travel store coupon codes.
                  </p>
                  <div className="inline-flex items-center text-xs font-black uppercase tracking-wider text-blue-400 group-hover:text-blue-300 transition-colors">
                    <span>Explore Travel Gear</span>
                    <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Vitality Vault */}
            <Link href="/blog/category/health-and-beauty" className="block w-full">
              <div className="group relative h-[380px] md:h-[440px] overflow-hidden rounded-[2.5rem] isolate shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/10 hover:border-emerald-500/50 bg-slate-950">
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/image/health_cat.png"
                    alt="Health & Wellness"
                    fill
                    className="object-cover opacity-45 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-55"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40 z-10" />
                <div className="absolute top-6 inset-x-6 flex items-center justify-between z-30">
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                    Vitality
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-widest">
                    VAULT 03
                  </span>
                </div>
                <div className="absolute bottom-0 w-full p-6 md:p-7 z-30 flex flex-col justify-end">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-md">
                    🌿 Health & Fitness
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-normal line-clamp-2 mb-4">
                    Wearables testing, supplement safety reviews, and wellness.
                  </p>
                  <div className="inline-flex items-center text-xs font-black uppercase tracking-wider text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    <span>View Health Reviews</span>
                    <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Everyday Carry Vault */}
            <Link href="/blog/category/lifestyle" className="block w-full">
              <div className="group relative h-[380px] md:h-[440px] overflow-hidden rounded-[2.5rem] isolate shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/10 hover:border-purple-500/50 bg-slate-950">
                <div className="absolute inset-0 z-0">
                  <Image
                    src="/image/lifestyle_cat.png"
                    alt="Lifestyle & Fashion"
                    fill
                    className="object-cover opacity-45 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-55"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40 z-10" />
                <div className="absolute top-6 inset-x-6 flex items-center justify-between z-30">
                  <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                    Everyday Carry
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-gray-400 uppercase tracking-widest">
                    VAULT 04
                  </span>
                </div>
                <div className="absolute bottom-0 w-full p-6 md:p-7 z-30 flex flex-col justify-end">
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-md">
                    ✨ Lifestyle & Wear
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed font-normal line-clamp-2 mb-4">
                    Minimalist gear, apparel fit testing, and brand promo code drops.
                  </p>
                  <div className="inline-flex items-center text-xs font-black uppercase tracking-wider text-purple-400 group-hover:text-purple-300 transition-colors">
                    <span>Explore Lifestyle</span>
                    <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      ) : (
        /* BLOGZENIX: Exact 100% Original Category Layout */
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
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/0 transition-colors z-20" />

                <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-blue-600/40 ring-2 ring-white/20">
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
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-emerald-600/10 group-hover:bg-emerald-600/0 transition-colors z-20" />

                <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-emerald-600/40 ring-2 ring-white/20">
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
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-purple-600/10 group-hover:bg-purple-600/0 transition-colors z-20" />

                <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                  <div className="inline-block px-3 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-purple-600/40 ring-2 ring-white/20">
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
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 25vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/90 via-orange-900/40 to-transparent z-10 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-orange-600/10 group-hover:bg-orange-600/0 transition-colors z-20" />

                <div className="absolute bottom-0 w-full p-6 z-30 transform transition-transform duration-500 group-hover:translate-y-[-5px]">
                  <div className="inline-block px-3 py-1 rounded-full bg-orange-600 text-white text-[10px] font-bold uppercase tracking-widest mb-3 shadow-lg shadow-orange-600/40 ring-2 ring-white/20">
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
      )}

      {/* Featured Blogs Section */}
      {isSpecReveal ? (
        /* SPEC REVEAL: Bento Magazine Featured Section */
        <section className="py-16 md:py-24 relative overflow-hidden bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-12 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Curated Content</span>
                </div>
                <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${themeClasses.text.primary}`}>
                  Handpicked <span className="text-brand-primary">Stories</span>
                </h2>
                <p className={`${themeClasses.text.secondary} text-base md:text-lg font-medium max-w-xl`}>
                  Don't miss out on our most popular, insightful, and trending articles
                </p>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl border-2 border-brand-primary/40 text-brand-primary font-bold hover:bg-brand-primary hover:text-white transition-all duration-300 group whitespace-nowrap shadow-md"
              >
                <span>View All Posts</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="min-h-[400px]">
              <BlogList
                apiEndpoint="/api/blogs?isFeaturedForHome=true"
                isEmbedded={true}
                layout="bento"
                initialPosts={featuredBlogs}
                emptyStateMessage="No featured blogs found."
              />
            </div>
          </div>
        </section>
      ) : (
        /* BLOGZENIX: Exact 100% Original Featured Section */
        <section className="pt-10 md:pt-16 pb-24 relative overflow-hidden bg-white">
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
      )}
    </div>
  );
}
