'use client';

import React, { useState, useEffect } from 'react';
import { StoreGrid } from '@/components/store';
import { Store } from '@/lib/types/store';

interface StoresClientProps {
  initialStores: Store[];
  serverError: string | null;
}

export function StoresClient({ initialStores, serverError }: StoresClientProps) {
  // Use server-provided data directly
  const [stores] = useState<Store[]>(initialStores || []);
  const [error] = useState<string | null>(serverError);
  const [isLoading, setIsLoading] = useState(false);

  // Set loading to false after mount (hydration complete)
  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <StoreGrid
      stores={stores}
      loading={isLoading}
      error={error}
    />
  );
}