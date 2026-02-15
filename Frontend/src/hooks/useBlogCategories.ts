'use client';

import { useState, useEffect } from 'react';
import HttpClient from '@/services/HttpClient';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface UseBlogCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBlogCategories = (): UseBlogCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const httpClient = new HttpClient();
      const response = await httpClient.get<{success: boolean; message: string; data: Category[]}>('/api/blog-categories');
      // Extract the data array from the response
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching blog categories:', err);
      setError('Failed to fetch blog categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const refetch = () => {
    fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    refetch
  };
};