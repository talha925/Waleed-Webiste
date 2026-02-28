'use client';

import React from 'react';
import CategoryCard from './CategoryCard';
import { Category } from '@/lib/types';
import { themeClasses } from '@/lib/theme/utils';

interface CategoryGridProps {
  categories: Category[];
  loading?: boolean;
  error?: string | null;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, loading = false, error = null }) => {
  if (loading) {
    return (
      <div className={`text-center py-20 ${themeClasses.text.secondary} font-medium text-lg`}>
        Loading categories...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-20 text-destructive font-semibold text-xl`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h2 className={`text-4xl font-extrabold text-center ${themeClasses.text.primary} mb-10`}>
        Categories
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {categories.map((category) => (
          <CategoryCard key={category._id} category={category} />
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid; 