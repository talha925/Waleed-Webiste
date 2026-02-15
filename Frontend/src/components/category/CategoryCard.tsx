'use client';

import React from 'react';
import { Category } from '@/lib/types';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <div className="border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-white p-5 flex flex-col items-center gap-4">
      <h3 className="text-xl font-semibold text-gray-800 text-center">{category.name}</h3>
      
      {category.description && (
        <p className="text-sm text-gray-600 text-center">{category.description}</p>
      )}
      
      <button className="text-sm px-2 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-700 transition">
        View
      </button>
    </div>
  );
};

export default CategoryCard; 