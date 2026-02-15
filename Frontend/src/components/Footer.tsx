'use client';

import NewsletterSubscription from '@/components/ui/NewsletterSubscription';
import { themeClasses } from '@/lib/theme/utils';
import { useBrand } from '@/context/BrandContext';

export default function Footer() {
  const brand = useBrand();

  return (
    <footer className="bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/40 backdrop-blur-xl border-t border-indigo-200/30 py-16 w-full shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Newsletter Signup */}
          <div className="lg:col-span-2">
            <NewsletterSubscription />
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="/about" className="text-slate-700 hover:text-indigo-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">About Us</a></li>
              <li><a href="/privacy" className="text-slate-700 hover:text-indigo-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">Privacy Policy</a></li>
              <li><a href="/terms" className="text-slate-700 hover:text-indigo-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">Terms & Conditions</a></li>
              <li><a href="/contact" className="text-slate-700 hover:text-indigo-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">Contact Us</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">Categories</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-700 hover:text-purple-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">Travel</a></li>
              <li><a href="#" className="text-slate-700 hover:text-purple-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">Health</a></li>
              <li><a href="#" className="text-slate-700 hover:text-purple-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">Lifestyle</a></li>
              <li><a href="#" className="text-slate-700 hover:text-purple-600 transition-all duration-300 hover:translate-x-1 hover:scale-105">Technology</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright text at bottom */}
        <div className="mt-12 text-center">
          <hr className="border-t border-gradient-to-r from-indigo-200/40 via-purple-200/40 to-pink-200/40 mb-6" />
          <p className="text-slate-600 text-lg font-medium bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
            © 2025 {brand.siteName} — {brand.siteTagline}.
          </p>
        </div>
      </div>
    </footer>
  );
}