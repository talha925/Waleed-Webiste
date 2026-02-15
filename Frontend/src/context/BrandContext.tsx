'use client';

/**
 * Brand Context
 *
 * Provides brand configuration to client components.
 * The brand config is resolved on the server (in layout.tsx)
 * and passed down via this context — zero client-side detection needed.
 *
 * Usage in Client Components:
 *   const brand = useBrand();
 *   <img src={brand.logoPath} alt={brand.siteName} />
 */

import React, { createContext, useContext } from 'react';
import type { BrandConfig } from '@config/types';

const BrandContext = createContext<BrandConfig | null>(null);

/**
 * Hook to access the current brand config.
 * Must be used inside <BrandProvider>.
 */
export function useBrand(): BrandConfig {
    const ctx = useContext(BrandContext);
    if (!ctx) {
        throw new Error('useBrand() must be used inside <BrandProvider>');
    }
    return ctx;
}

/**
 * Provider component — wraps the app and supplies brand config.
 */
export function BrandProvider({
    brand,
    children,
}: {
    brand: BrandConfig;
    children: React.ReactNode;
}) {
    return (
        <BrandContext.Provider value={brand}>
            {children}
        </BrandContext.Provider>
    );
}

export default BrandContext;
