import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { ArrowRight, Sparkles, User, Tag } from 'lucide-react';
import { themeClasses } from '@/lib/theme/utils';
import { useBrand } from '@/context/BrandContext';
import { sanitizeBrandText, cleanTypography } from '@/lib/utils/formatting';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string; // Required for consistent routing
    shortDescription?: string;
    longDescription?: string;
    isFeaturedForHome?: boolean;
    isFeatured?: boolean;
    status?: string;
    image?: {
      url: string;
      alt?: string;
    };
    category?: {
      _id: string;
      name: string;
      slug: string;
    };
    author?: {
      _id?: string;
      name?: string;
      avatar?: string;
    };
    publishDate?: string;
    createdAt?: string;
  };
  variant?: 'grid' | 'hero' | 'featured' | 'horizontal' | string;
  priority?: boolean;
}

export default function BlogCard({ blog, variant, priority = false }: BlogCardProps) {
  const brand = useBrand();
  const isSpecReveal = brand?.brandId === 'specreveal';

  /* ================================================================
   * SPEC REVEAL: Custom Dark Magazine Cards (ALL VARIANTS)
   * ================================================================ */
  if (isSpecReveal) {
    const isFeatured = blog.isFeaturedForHome || blog.isFeatured;

    if (variant === 'hero' || variant === 'featured') {
      return (
        <Link href={`/blog/${blog.slug || blog._id}`} className="group block w-full h-full">
          <div className="relative h-[420px] md:h-[480px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 hover:border-brand-primary/60 transition-all duration-500 bg-slate-950 flex flex-col justify-end">
            {blog.image?.url && (
              <div className="absolute inset-0 z-0">
                <SafeImage
                  src={blog.image.url}
                  alt={blog.image.alt || blog.title}
                  fill
                  priority={priority}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="w-full h-full object-cover opacity-80 transition-transform duration-1000 ease-out group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent z-10" />
              </div>
            )}

            <div className="absolute top-5 inset-x-5 flex items-center justify-between z-20 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white bg-brand-primary shadow-md border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Spotlight Story
              </span>

              {blog.category?.name && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-black/60 backdrop-blur-md border border-white/20 shadow-lg">
                  <Tag className="w-3.5 h-3.5 text-white/80" />
                  {blog.category.name}
                </span>
              )}
            </div>

            <div className="relative z-20 p-6 md:p-8 flex flex-col justify-end space-y-3.5">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white group-hover:text-brand-primary transition-colors duration-300 leading-tight tracking-tight drop-shadow-lg">
                {sanitizeBrandText(blog.title, brand?.siteName || '')}
              </h2>

              {blog.shortDescription && (
                <p className="text-sm md:text-base text-gray-200/90 line-clamp-2 md:line-clamp-3 leading-relaxed font-normal max-w-2xl">
                  {sanitizeBrandText(blog.shortDescription, brand?.siteName || '')}
                </p>
              )}

              <div className="pt-3 flex items-center justify-between">
                {blog.author?.name ? (
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 group-hover:border-brand-primary/40 transition-colors">
                    {blog.author.avatar ? (
                      <img
                        src={blog.author.avatar}
                        alt={blog.author.name}
                        className="w-5 h-5 rounded-full object-cover border border-white/30"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-brand-primary/30 flex items-center justify-center text-brand-primary text-[10px] font-bold">
                        <User className="w-3 h-3" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white group-hover:text-brand-primary transition-colors">
                      {blog.author.name}
                    </span>
                  </div>
                ) : <div />}

                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-brand-primary/40 text-brand-primary font-bold hover:bg-brand-primary hover:text-white text-xs uppercase tracking-wider shadow-md transition-all duration-300 group-hover:scale-105">
                  <span>Read Feature</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    if (variant === 'horizontal') {
      return (
        <Link href={`/blog/${blog.slug || blog._id}`} className="group block h-full">
          <div className="relative h-full flex flex-col sm:flex-row bg-slate-950/80 backdrop-blur-xl border border-white/10 hover:border-brand-primary/60 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
            <div className="absolute inset-y-0 left-0 w-1 bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />

            {blog.image?.url && (
              <div className="relative sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden bg-black/40 min-h-[160px]">
                <SafeImage
                  src={blog.image.url}
                  alt={blog.image.alt || blog.title}
                  width={500}
                  height={350}
                  sizes="(max-width: 640px) 100vw, 30vw"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  priority={priority}
                />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/70 via-transparent to-transparent opacity-80 pointer-events-none" />

                {isFeatured && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-brand-primary shadow-md border border-white/20">
                    <Sparkles className="w-3 h-3 text-white" />
                    Top Pick
                  </span>
                )}
              </div>
            )}

            <div className="p-5 sm:p-6 sm:w-3/5 flex flex-col justify-between flex-grow space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
                  {blog.category?.name ? (
                    <span className="text-brand-primary font-bold uppercase tracking-wider text-[10px]">
                      {blog.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Story</span>
                  )}
                </div>

                <h3 className="text-base md:text-lg font-black text-white group-hover:text-brand-primary transition-colors duration-300 line-clamp-2 leading-snug mb-2">
                  {blog.title}
                </h3>

                {blog.shortDescription && (
                  <p className="text-xs md:text-sm text-gray-300 line-clamp-2 leading-relaxed font-normal">
                    {blog.shortDescription}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end text-xs">
                <span className="font-extrabold text-brand-primary uppercase tracking-wider text-[11px] inline-flex items-center gap-1 group-hover:text-white transition-colors">
                  <span>Read Story</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    /* SPEC REVEAL: Standard Grid Variant (Dark Theme) */
    return (
      <Link href={`/blog/${blog.slug || blog._id}`} className="group block h-full">
        <div className="relative h-full flex flex-col bg-slate-950/90 backdrop-blur-xl border border-white/10 hover:border-brand-primary/60 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
          {blog.image?.url && (
            <div className="relative w-full h-48 sm:h-52 md:h-56 overflow-hidden bg-slate-900 flex-shrink-0">
              <SafeImage
                src={blog.image.url}
                alt={blog.image.alt || blog.title}
                width={800}
                height={450}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="w-full h-full object-cover opacity-95 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                priority={priority}
                loading={priority ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 pointer-events-none" />

              {isFeatured && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-brand-primary shadow-md border border-white/20">
                  <Sparkles className="w-3 h-3 text-white" />
                  Featured
                </span>
              )}
            </div>
          )}

          <div className="p-6 flex flex-col justify-between flex-grow">
            <div>
              {blog.category?.name && (
                <span className="text-brand-primary font-bold uppercase tracking-wider text-[10px] block mb-2">
                  {blog.category.name}
                </span>
              )}

              <h3 className="text-lg md:text-xl font-black text-white group-hover:text-brand-primary transition-colors duration-300 line-clamp-2 leading-snug tracking-tight mb-2.5">
                {sanitizeBrandText(blog.title, brand?.siteName || '')}
              </h3>

              {blog.shortDescription && (
                <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed font-normal mb-6">
                  {sanitizeBrandText(blog.shortDescription, brand?.siteName || '')}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
              <span className="text-xs font-semibold text-gray-400">Review</span>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-primary group-hover:text-white transition-colors duration-300">
                <span>Read Story</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ================================================================
   * BLOGZENIX: 100% EXACT ORIGINAL FROM GIT (commit 9e91e4d)
   * No modifications — this is the original card design.
   * ================================================================ */
  return (
    <Link href={`/blog/${blog.slug || blog._id}`} className="block">
      <div className="group relative bg-card backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.03] shadow-xl hover:shadow-2xl hover:border-primary/60 cursor-pointer">
        {blog.image?.url && (
          <div className="relative h-48 overflow-hidden">
            {(blog.isFeaturedForHome || (blog as any).isFeatured) && (
              <div className="absolute top-3 left-3 z-10">
                <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-vibrant shadow-lg rounded-full">
                  Featured
                </span>
              </div>
            )}
            <SafeImage
              src={blog.image.url}
              alt={blog.image.alt || blog.title}
              width={800}
              height={450}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />

          </div>
        )}
        <div className="p-6">
          <div className="mb-4">
            <h2 className={`text-base md:text-lg font-bold ${themeClasses.text.primary} break-words leading-snug hover:text-primary transition-colors duration-300 line-clamp-2`}>
              {sanitizeBrandText(blog.title, brand?.siteName || '')}
            </h2>
          </div>
          {blog.shortDescription && (
            <p className={`text-sm ${themeClasses.text.secondary} mb-4 line-clamp-2 break-words leading-snug`}>
              {sanitizeBrandText(blog.shortDescription, brand?.siteName || '')}
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