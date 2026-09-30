'use client';

import React from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { ArrowRight, Sparkles, Hash } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  count?: string;
}

export function CategoriesClient({ initialCategories = [] }: { initialCategories?: Category[] }) {
  const brand = useBrand();
  const isDark = brand.isDarkMode;

  // Mapping icons to dynamic categories
  const iconMap: Record<string, string> = {
    'health-and-beauty': '✨',
    'home-and-tech': '💻',
    'lifestyle': '🌿',
    'sports-and-fitness': '🏃',
    'travel': '✈️',
    'fashion': '👗',
    'food': '🍕',
    'gaming': '🎮',
    'education': '📚',
    'products-reviews': '⭐',
  };

  const defaultCategories: Category[] = brand.categories && brand.categories.length > 0
    ? brand.categories.map((c, idx) => ({
        _id: String(idx + 1),
        name: c.name,
        slug: c.slug,
        icon: c.icon || iconMap[c.slug] || '📁',
        count: 'Explore Posts',
      }))
    : (brand.brandId === 'specreveal'
      ? [
          { _id: '1', name: 'Health and Beauty', slug: 'health-and-beauty', icon: '✨', count: 'Explore Posts' },
          { _id: '2', name: 'Home and Tech', slug: 'home-and-tech', icon: '💻', count: 'Explore Posts' },
          { _id: '3', name: 'Lifestyle', slug: 'lifestyle', icon: '🌿', count: 'Explore Posts' },
          { _id: '4', name: 'Sports and Fitness', slug: 'sports-and-fitness', icon: '🏃', count: 'Explore Posts' },
          { _id: '5', name: 'Travel', slug: 'travel', icon: '✈️', count: 'Explore Posts' },
        ]
      : [
          { _id: '1', name: 'Health and Beauty', slug: 'health-and-beauty', icon: '✨', count: '12 Posts' },
          { _id: '2', name: 'Home and Tech', slug: 'home-and-tech', icon: '💻', count: '8 Posts' },
          { _id: '3', name: 'Lifestyle', slug: 'lifestyle', icon: '🌿', count: '15 Posts' },
          { _id: '4', name: 'Sports and Fitness', slug: 'sports-and-fitness', icon: '🏃', count: '10 Posts' },
          { _id: '5', name: 'Travel', slug: 'travel', icon: '✈️', count: '7 Posts' },
        ]);

  const categories = initialCategories.length > 0 
    ? initialCategories.map(cat => ({
        ...cat,
        icon: cat.icon || iconMap[cat.slug] || '📁',
        count: cat.count || 'View Posts'
      }))
    : defaultCategories;

  return (
    <div className="min-h-screen bg-background py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" />
            Explore Topics
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight">
            Browse by <span className="text-brand-primary">Category</span>
          </h1>
          <p className="text-foreground-secondary text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Discover articles, tips, and insights across our most popular categories.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/blog/category/${category.slug}`}
              className="group block"
            >
              <div className={`relative h-full p-8 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 overflow-hidden border ${
                isDark
                  ? 'bg-background-elevated/80 border-white/10 shadow-2xl hover:border-brand-primary/50 hover:shadow-[0_10px_30px_rgba(255,30,39,0.1)]'
                  : 'bg-card border-border/60 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-brand-primary/10 hover:border-brand-primary/30'
              }`}>
                {/* Background Decoration */}
                <div className={`absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full transition-transform duration-500 group-hover:scale-150 ${
                  isDark ? 'bg-white/[0.02]' : 'bg-slate-50'
                }`} />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl group-hover:bg-brand-primary group-hover:text-white group-hover:scale-110 transition-all duration-500 ${
                      isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-background-secondary'
                    }`}>
                      {category.icon}
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors duration-500 ${
                      isDark ? 'bg-white/[0.05] text-foreground-secondary group-hover:bg-brand-primary/20 group-hover:text-white' : 'bg-background-secondary text-foreground-secondary group-hover:bg-card'
                    }`}>
                      <Hash className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{category.count}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-2xl font-black text-foreground mb-3 group-hover:text-brand-primary transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground-secondary group-hover:text-brand-primary transition-all duration-300">
                      Explore Articles
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 sm:mt-24 text-center">
          <div className="inline-block p-1 rounded-2xl bg-card border border-border/60">
            <Link
              href="/blog"
              className="px-8 py-4 bg-background-elevated rounded-xl text-sm font-black text-foreground shadow-sm hover:shadow-md hover:text-brand-primary transition-all flex items-center gap-3"
            >
              View All Recent Blogs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}