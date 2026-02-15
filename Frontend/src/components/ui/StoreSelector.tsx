'use client';

import React, { useEffect, useState } from 'react';

interface Store {
  _id: string;
  name: string;
  trackingUrl?: string;
}

interface StoreSelectorProps {
  value: string;
  onChange: (storeId: string, storeUrl: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  className?: string;
}

// Utility function to clean and format URLs
const cleanAndFormatUrl = (url: string): string => {
  if (!url) return '';
  
  // Remove any HTML entity encoding
  let cleanUrl = url.replace(/&#x2F;/g, '/');
  
  // Remove any existing protocol to avoid duplication
  cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
  
  // Add https:// protocol if URL is not empty
  if (cleanUrl) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  return cleanUrl;
};

const StoreSelector = ({
  value,
  onChange,
  error,
  required = false,
  label = 'Store',
  className = '',
}: StoreSelectorProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreUrl, setSelectedStoreUrl] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/proxy-stores');
        if (response.ok) {
          const data = await response.json();
          const storesData = data.data || data || [];
          setStores(storesData);
        } else {
          console.error('Failed to fetch stores');
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStoreId = e.target.value;
    
    // Find the selected store and set its URL
    const selectedStore = stores.find((store) => store._id === selectedStoreId);
    
    if (selectedStore) {
      // Clean and format the URL using utility function
      const cleanUrl = cleanAndFormatUrl(selectedStore.trackingUrl || '');
      setSelectedStoreUrl(cleanUrl);
      onChange(selectedStoreId, cleanUrl);
    } else {
      setSelectedStoreUrl('');
      onChange(selectedStoreId, '');
    }
  };

  const baseClasses = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${className}`;

  return (
    <div className="mb-4">
      <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id="store"
        value={value}
        onChange={handleChange}
        className={baseClasses}
        disabled={loading}
      >
        <option value="" className="text-gray-900">{loading ? 'Loading stores...' : 'Select Store (with URL)'}</option>
        {stores.map((store) => (
          <option key={store._id} value={store._id} disabled={!store.trackingUrl} className="text-gray-900">
            {store.name} {store.trackingUrl ? '(Has URL)' : '(No URL)'}
          </option>
        ))}
      </select>
      {selectedStoreUrl && (
        <p className="text-xs text-green-600 mt-1">
          Selected store URL: {selectedStoreUrl}
        </p>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default StoreSelector;