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
  const FETCH_TIMEOUT = 5000;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(`${config.api.baseUrl}/api/blogs?isFeaturedForHome=true&page=1&pageSize=9&limit=9`, {
      next: { revalidate: 60, tags: ['featured-blogs'] }, // Revalidate every minute or when tagged
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Failed to fetch blogs');

    const data = await res.json();
    return data.blogs?.blogs || data.data?.blogs || [];
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}


export default async function Blogs() {
  // Fetch data server-side
  const featuredBlogs = await fetchFeaturedBlogs();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Banner: with proper spacing matching header */}
      <section className="relative pt-2 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HeroBanner className="w-full" />
        </div>
      </section>

      {/* Boxed content: max-w-7xl, centered, with padding */}
      <section className={`max-w-7xl mx-auto py-8 px-4 md:px-12`}>
        <h2 className={`text-4xl font-bold text-center mb-16 ${themeClasses.text.primary} bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600`}>
          Browse Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Travel Category */}
          <Link href="/blog/category/travel" className="block">
            <div className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.03] cursor-pointer hover:bg-white/80">
              <div className="relative h-80 overflow-hidden">
                <Image
                  src="/image/travel1.jpg"
                  alt="Travel Destinations"
                  width={800}
                  height={400}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors duration-300 drop-shadow-lg">
                  ✈️ Travel & Adventure
                </h3>
                <p className="text-white/95 text-base leading-relaxed group-hover:text-white transition-colors duration-300 drop-shadow-md">
                  Discover amazing destinations and travel tips
                </p>
              </div>
            </div>
          </Link>

          {/* Health & Wellness Category */}
          <Link href="/blog/category/health-and-beauty" className="block">
            <div className="group relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.03] cursor-pointer hover:bg-white/80">
              <div className="relative h-80 overflow-hidden">
                <Image
                  src="/image/health1.jpg"
                  alt="Health & Wellness"
                  width={800}
                  height={400}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors duration-300">
                  🌿 Health & Wellness
                </h3>
                <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                  Expert health advice and wellness tips
                </p>
              </div>
            </div>
          </Link>

          {/* Lifestyle Category */}
          <Link href="/blog/category/lifestyle" className="block">
            <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="relative h-80 overflow-hidden">
                <Image
                  src="/image/fashion1.jpg"
                  alt="Lifestyle & Fashion"
                  width={800}
                  height={400}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-rose-300 transition-colors duration-300">
                  ✨ Lifestyle & Fashion
                </h3>
                <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                  Latest fashion trends and lifestyle inspiration
                </p>
              </div>
            </div>
          </Link>

          {/* Technology Category */}
          <Link href="/blog/category/home-and-tech" className="block">
            <div className="group relative overflow-hidden bg-card/80 backdrop-blur-md border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="relative h-80 overflow-hidden">
                <Image
                  src="/image/app.png"
                  alt="Home & Tech "
                  width={800}
                  height={400}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors duration-300">
                  🚀 Technology & Apps
                </h3>
                <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">
                  Latest tech reviews and app recommendations
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className={`max-w-7xl mx-auto px-4 md:px-12 py-16 ${themeClasses.backgrounds.primary}`}>
        <h2 className={`${themeClasses.text.primary} bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-3xl mb-12 text-center`}>Featured Blogs</h2>
        <div className="min-h-[400px]">
          <BlogList
            apiEndpoint="/api/blogs?isFeaturedForHome=true"
            isEmbedded={true}
            initialPosts={featuredBlogs}
            emptyStateMessage="No featured blogs found."
          />
        </div>
      </section>
    </div>

  );
}
