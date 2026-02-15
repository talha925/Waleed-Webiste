'use client';

import React from 'react';
import { Store } from '@/lib/types';
import { cleanAndFormatUrl } from '@/lib/utils/validation';

interface StoreSelectorProps {
  stores: Store[];
  selectedStoreId: string;
  onStoreChange: (storeId: string, storeUrl: string) => void;
  loading?: boolean;
  error?: string;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({
  stores,
  selectedStoreId,
  onStoreChange,
  loading = false,
  error
}) => {
  const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStoreId = e.target.value;
    const selectedStore = stores.find((store) => store._id === selectedStoreId);
    
    if (selectedStore) {
      const cleanUrl = cleanAndFormatUrl(selectedStore.trackingUrl || '');
      onStoreChange(selectedStoreId, cleanUrl);
    } else {
      onStoreChange(selectedStoreId, '');
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-2">
        Store <span className="text-red-500">*</span> (Must have URL)
      </label>
      <select
        id="store"
        value={selectedStoreId}
        onChange={handleStoreChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        disabled={loading}
      >
        <option value="" className="text-gray-900">
          {loading ? 'Loading stores...' : 'Select Store (with URL)'}
        </option>
        {stores.map((store) => (
          <option key={store._id} value={store._id} disabled={!store.trackingUrl} className="text-gray-900">
            {store.name} {store.trackingUrl ? '(Has URL)' : '(No URL)'}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default StoreSelector;