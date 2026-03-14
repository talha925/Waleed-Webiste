'use client';

import React, { useEffect } from 'react';
import { AppProvider } from './AppContext';
import { BrandProvider } from './BrandContext';
import type { BrandConfig } from '@config/types';

interface ProvidersProps {
  children: React.ReactNode;
  initialToken?: string | null;
  brand: BrandConfig;
}

export const Providers: React.FC<ProvidersProps> = ({ children, initialToken, brand }) => {
  useEffect(() => {
    // 1. Initialize Auth Service with initial token if provided
    if (initialToken) {
      const { authService } = require('@/services/AuthService');
      authService.initializeWithToken(initialToken);
    }

    // 2. Remove any data attributes potentially injected on SSR that could cause hydration mismatches
    const htmlEl = document.documentElement;
    if (htmlEl.hasAttribute('data-server-rendered')) {
      htmlEl.removeAttribute('data-server-rendered');
    }
  }, [initialToken]);

  return (
    <BrandProvider brand={brand}>
      <AppProvider>
        {children}
      </AppProvider>
    </BrandProvider>
  );
};

export default Providers;