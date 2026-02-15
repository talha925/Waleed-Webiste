'use client';

import React from 'react';
import StoreCard from './StoreCard';
import { Store } from '@/lib/types';

interface StoreGridProps {
  stores: Store[];
  loading?: boolean;
  error?: string | null;
}

const StoreGrid: React.FC<StoreGridProps> = ({ stores, loading = false, error = null }) => {
  if (loading) {
    return (
      <div className="text-center mt-20 text-xl font-semibold text-gray-600 animate-pulse">
        Loading stores...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-20 text-xl font-semibold text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
        {stores.map((store) => (
          <StoreCard key={store._id} store={store} />
        ))}
      </div>
    </div>
  );
};

export default StoreGrid; 