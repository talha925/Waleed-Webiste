'use client';

import React from 'react';
import { Category } from '@/lib/types';
import { themeClasses } from '@/lib/theme/utils';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <div className={`border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${themeClasses.backgrounds.card} p-5 flex flex-col items-center gap-4`}>
      <h3 className={`text-xl font-semibold ${themeClasses.text.primary} text-center`}>{category.name}</h3>

      {category.description && (
        <p className={`text-sm ${themeClasses.text.secondary} text-center`}>{category.description}</p>
      )}

      <button className={themeClasses.buttons.orange}>
        View
      </button>
    </div>
  );
};

export default CategoryCard;