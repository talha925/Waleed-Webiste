'use client';

import NewsletterSubscription from '@/components/ui/NewsletterSubscription';
import { themeClasses } from '@/lib/theme/utils';
import { useBrand } from '@/context/BrandContext';

export default function Footer() {
  const brand = useBrand();

  return (
    <footer className="bg-background-secondary border-t border-border/30 py-16 w-full relative overflow-hidden">
      {/* Decorative background elements - static subtle glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Newsletter Signup */}
          <div className="lg:col-span-2">
            <NewsletterSubscription />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-black mb-6 text-foreground tracking-tight">Quick Links</h4>
            <ul className="space-y-4">
              <li><a href="/about" className="text-foreground-secondary font-bold hover:text-brand-primary transition-all duration-300 hover:translate-x-1 inline-block">About Us</a></li>
              <li><a href="/privacy" className="text-foreground-secondary font-bold hover:text-brand-primary transition-all duration-300 hover:translate-x-1 inline-block">Privacy Policy</a></li>
              <li><a href="/terms" className="text-foreground-secondary font-bold hover:text-brand-primary transition-all duration-300 hover:translate-x-1 inline-block">Terms & Conditions</a></li>
              <li><a href="/contact" className="text-foreground-secondary font-bold hover:text-brand-primary transition-all duration-300 hover:translate-x-1 inline-block">Contact Us</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-black mb-6 text-foreground tracking-tight">
              {brand.brandId === 'specreveal' || brand.brandId === 'trendfiltered' ? 'Categories' : 'Universe'}
            </h4>
            <ul className="space-y-4">
              {(brand.categories || (brand.brandId === 'specreveal' ? [
                { name: 'Health and Beauty', href: '/blog/category/health-and-beauty', slug: 'health-and-beauty' },
                { name: 'Home and Tech', href: '/blog/category/home-and-tech', slug: 'home-and-tech' },
                { name: 'Lifestyle', href: '/blog/category/lifestyle', slug: 'lifestyle' },
                { name: 'Sports and Fitness', href: '/blog/category/sports-and-fitness', slug: 'sports-and-fitness' },
                { name: 'Travel', href: '/blog/category/travel', slug: 'travel' },
              ] : [
                { name: 'Travel', href: '/blog/category/travel', slug: 'travel' },
                { name: 'Health', href: '/blog/category/health-and-beauty', slug: 'health-and-beauty' },
                { name: 'Lifestyle', href: '/blog/category/lifestyle', slug: 'lifestyle' },
                { name: 'Technology', href: '/blog/category/home-and-tech', slug: 'home-and-tech' },
              ])).map((cat) => (
                <li key={cat.name}>
                  <a
                    href={cat.href || `/blog/category/${cat.slug}`}
                    className="text-foreground-secondary font-bold hover:text-brand-accent transition-all duration-300 hover:translate-x-1 inline-block"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-border/10 text-center">
          <p className="text-foreground-secondary text-xs font-black tracking-[0.2em] uppercase opacity-40">
            {brand.copyrightText || `© 2026 ${brand.siteName} — ${brand.siteTagline}`}
          </p>
        </div>
      </div>
    </footer>
  );
}