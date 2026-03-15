'use client';

import React from 'react';
import Link from 'next/link';
import { themeClasses } from '@/lib/theme/utils';
import { ArrowRight, Sparkles, Hash } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  count?: string;
}

export function CategoriesClient({ initialCategories = [] }: { initialCategories?: Category[] }) {
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
    'education': '📚'
  };

  const categories = initialCategories.length > 0 
    ? initialCategories.map(cat => ({
        ...cat,
        icon: cat.icon || iconMap[cat.slug] || '📁',
        count: cat.count || 'View Posts'
      }))
    : [
        { _id: '1', name: 'Health and Beauty', slug: 'health-and-beauty', icon: '✨', count: '12 Posts' },
        { _id: '2', name: 'Home and Tech', slug: 'home-and-tech', icon: '💻', count: '8 Posts' },
        { _id: '3', name: 'Lifestyle', slug: 'lifestyle', icon: '🌿', count: '15 Posts' },
        { _id: '4', name: 'Sports and Fitness', slug: 'sports-and-fitness', icon: '🏃', count: '10 Posts' },
        { _id: '5', name: 'Travel', slug: 'travel', icon: '✈️', count: '7 Posts' },
      ];

  return (
    <div className={`min-h-screen ${themeClasses.backgrounds.primary} py-20 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" />
            Explore Topics
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight">
            Browse by <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Category</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Discover articles, tips, and insights across our most popular subjects.
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
              <div className="relative h-full p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/40 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2 group-hover:border-orange-500/20 overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-slate-50 rounded-full transition-transform duration-500 group-hover:scale-150" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-3xl group-hover:bg-orange-500 group-hover:scale-110 transition-all duration-500">
                      {category.icon}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-white transition-colors duration-500">
                      <Hash className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{category.count}</span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-orange-500 transition-all duration-300">
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
        <div className="mt-24 text-center">
          <div className="inline-block p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <Link
              href="/blog"
              className="px-8 py-4 bg-white rounded-xl text-sm font-black text-slate-900 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
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