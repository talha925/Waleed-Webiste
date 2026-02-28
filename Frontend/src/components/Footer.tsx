'use client';

import NewsletterSubscription from '@/components/ui/NewsletterSubscription';
import { themeClasses } from '@/lib/theme/utils';
import { useBrand } from '@/context/BrandContext';

export default function Footer() {
  const brand = useBrand();

  return (
    <footer className="bg-background-secondary border-t border-border/30 py-16 w-full relative overflow-hidden">
      {/* Decorative background elements - multi-color subtle glows */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-brand-secondary/5 to-brand-accent/5 opacity-30"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-accent/10 rounded-full blur-[100px] animate-pulse"></div>

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
            <h4 className="text-lg font-black mb-6 text-foreground tracking-tight">Universe</h4>
            <ul className="space-y-4">
              <li><a href="/blog/category/travel" className="text-foreground-secondary font-bold hover:text-brand-accent transition-all duration-300 hover:translate-x-1 inline-block">Travel</a></li>
              <li><a href="/blog/category/health-and-beauty" className="text-foreground-secondary font-bold hover:text-brand-accent transition-all duration-300 hover:translate-x-1 inline-block">Health</a></li>
              <li><a href="/blog/category/lifestyle" className="text-foreground-secondary font-bold hover:text-brand-accent transition-all duration-300 hover:translate-x-1 inline-block">Lifestyle</a></li>
              <li><a href="/blog/category/home-and-tech" className="text-foreground-secondary font-bold hover:text-brand-accent transition-all duration-300 hover:translate-x-1 inline-block">Technology</a></li>
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