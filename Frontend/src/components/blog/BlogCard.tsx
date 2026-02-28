import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { themeClasses } from '@/lib/theme/utils';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string; // Required for consistent routing
    shortDescription?: string;
    image?: {
      url: string;
      alt?: string;
    };
  };
  variant?: string;
}

export default function BlogCard({ blog, variant }: BlogCardProps) {
  return (
    <Link href={`/blog/${blog.slug || blog._id}`} className="block">
      <div className="group relative bg-card backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.03] shadow-xl hover:shadow-2xl hover:border-primary/60 cursor-pointer">
        {blog.image?.url && (
          <div className="relative h-48 overflow-hidden">
            <div className="absolute top-3 left-3 z-10">
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-vibrant shadow-lg rounded-full">
                Featured
              </span>
            </div>
            <SafeImage
              src={blog.image.url}
              alt={blog.image.alt || blog.title}
              width={800}
              height={450}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy" // Use lazy loading for non-critical images
            />

          </div>
        )}
        <div className="p-6">
          <div className="mb-4">
            <h2 className={`text-base md:text-lg font-bold ${themeClasses.text.primary} break-words leading-snug hover:text-primary transition-colors duration-300 line-clamp-2`}>
              {blog.title}
            </h2>
          </div>
          {blog.shortDescription && (
            <p className={`text-sm ${themeClasses.text.secondary} mb-4 line-clamp-2 break-words leading-snug`}>
              {blog.shortDescription}
            </p>
          )}
          <div className="inline-flex items-center text-primary group-hover:text-accent transition-all duration-300 font-bold hover:translate-x-1 uppercase tracking-wider text-xs">
            Read more
            <svg className="w-4 h-4 ml-2 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}