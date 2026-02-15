'use client';

import { useEffect, useState } from 'react';

interface AsyncScriptProps {
  src: string;
  id?: string;
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
  onLoad?: () => void;
  onError?: () => void;
  attributes?: Record<string, string>;
}

/**
 * AsyncScript - A component to load third-party scripts asynchronously
 * This improves performance by not blocking the main thread during initial page load
 */
export default function AsyncScript({
  src,
  id,
  strategy = 'afterInteractive',
  onLoad,
  onError,
  attributes = {}
}: AsyncScriptProps) {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Skip if the script is already loaded
    if (id && document.getElementById(id)) {
      setLoaded(true);
      onLoad?.();
      return;
    }
    
    // For beforeInteractive, load immediately
    if (strategy === 'beforeInteractive') {
      loadScript();
      return;
    }
    
    // For afterInteractive, load after the page becomes interactive
    if (strategy === 'afterInteractive') {
      loadScript();
      return;
    }
    
    // For lazyOnload, use Intersection Observer to load when visible
    if (strategy === 'lazyOnload') {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadScript();
          observer.disconnect();
        }
      });
      
      // Observe the document body as a proxy for viewport visibility
      observer.observe(document.body);
      
      return () => {
        observer.disconnect();
      };
    }
    
    function loadScript() {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      
      if (id) {
        script.id = id;
      }
      
      // Add any additional attributes
      Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
      
      script.onload = () => {
        setLoaded(true);
        onLoad?.();
      };
      
      script.onerror = () => {
        onError?.();
      };
      
      document.body.appendChild(script);
    }
  }, [src, id, strategy, onLoad, onError, attributes]);
  
  // This component doesn't render anything visible
  return null;
}