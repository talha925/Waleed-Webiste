'use client';

import React from 'react';
import { Category } from '@/lib/types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  loading?: boolean;
  error?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  loading = false,
  error
}) => {
  return (
    <div className="mb-4">
      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
        Category <span className="text-red-500">*</span>
      </label>
      <select
        id="category"
        value={selectedCategoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={loading}
      >
        <option value="" className="text-gray-900">
          {loading ? 'Loading categories...' : 'Select Category'}
        </option>
        {categories.map((category) => (
          <option key={category._id} value={category._id} className="text-gray-900">
            {category.name}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CategorySelector;