'use client';

import { Suspense, lazy, ComponentType } from 'react';

interface LazyComponentProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

/**
 * LazyComponent - A wrapper for React.lazy to easily implement code splitting
 * This reduces initial JavaScript bundle size by loading components only when needed
 */
export default function LazyComponent({ component, fallback, props }: LazyComponentProps) {
  // Use React.lazy to dynamically import the component
  const LazyLoadedComponent = lazy(component);
  
  return (
    <Suspense fallback={fallback || <div className="p-4 animate-pulse bg-gray-800 rounded-lg h-32"></div>}>
      <LazyLoadedComponent {...props} />
    </Suspense>
  );
}