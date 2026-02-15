'use client';

import React, { useEffect, useState } from 'react';

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  className?: string;
}

const CategorySelector = ({
  value,
  onChange,
  error,
  required = false,
  label = 'Category',
  className = '',
}: CategorySelectorProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Use relative URL to ensure it goes through the Next.js API route
        const response = await fetch('/api/blog-categories');
        if (response.ok) {
          const data = await response.json();
          // Handle different response formats
          const categoryData = data.data || data || [];
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        } else {
          console.error('Failed to fetch categories');
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const baseClasses = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className}`;

  return (
    <div className="mb-4">
      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id="category"
        value={value}
        onChange={handleChange}
        className={baseClasses}
        disabled={loading}
      >
        <option value="" className="text-gray-900">{loading ? 'Loading categories...' : 'Select Category'}</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id} className="text-gray-900">{cat.name}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CategorySelector;