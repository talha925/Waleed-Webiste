'use client';

import { useEffect } from 'react';

interface PreloadResourcesProps {
  resources: {
    href: string;
    as: 'image' | 'style' | 'script' | 'font';
    type?: string;
    crossOrigin?: string;
  }[];
}

/**
 * Component to preload critical resources
 * This helps improve performance by loading important resources earlier
 */
export default function PreloadResources({ resources }: PreloadResourcesProps) {
  useEffect(() => {
    // Create and append preload links to head
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      
      if (resource.type) {
        link.type = resource.type;
      }
      
      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }
      
      document.head.appendChild(link);
    });
    
    // Clean up function to remove preload links when component unmounts
    return () => {
      const links = document.querySelectorAll('link[rel="preload"]');
      links.forEach(link => {
        if (resources.some(r => r.href === link.getAttribute('href'))) {
          link.remove();
        }
      });
    };
  }, [resources]);
  
  // This component doesn't render anything visible
  return null;
}