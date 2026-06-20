'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useBrand } from '@/context/BrandContext';
import { getCdnUrl } from '@/lib/cdn';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  unoptimized?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * SafeImage component that handles URL encoding, serves images via CDN,
 * and provides a graceful fallback chain: CDN -> S3 -> placeholder/fallbackSrc.
 */
const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '',
  unoptimized,
  ...props
}) => {
  const brand = useBrand();
  const cdnUrl = getCdnUrl(src, brand);
  const isCdnDifferent = cdnUrl !== src;

  const [currentSrc, setCurrentSrc] = useState(isCdnDifferent ? cdnUrl : src);
  const [hasError, setHasError] = useState(false);

  // Sync state if src or brand changes
  useEffect(() => {
    const updatedCdnUrl = getCdnUrl(src, brand);
    setCurrentSrc(updatedCdnUrl !== src ? updatedCdnUrl : src);
    setHasError(false);
  }, [src, brand]);

  // Derive the clean source for the current render cycle
  // This prevents hydration flickering compared to using useEffect
  const getCleanSrc = (url: string): string => {
    if (!url) return fallbackSrc;
    if (hasError) return fallbackSrc;

    try {
      // Decode the URL. If it was already encoded (like %20 for space), this makes it a raw space.
      // Next.js Image component will then encode it exactly once consistently on server/client.
      return decodeURIComponent(url);
    } catch (e) {
      return url;
    }
  };

  const handleError = () => {
    // Fallback path: CDN -> S3 Origin -> fallbackSrc
    if (currentSrc === cdnUrl && isCdnDifferent) {
      console.warn(`[SafeImage] CDN image failed to load, falling back to S3 origin:`, cdnUrl);
      setCurrentSrc(src);
    } else if (!hasError) {
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    onLoad?.();
  };

  const cleanSrc = getCleanSrc(currentSrc);

  if (!cleanSrc && !fill) return null;

  return (
    <Image
      src={cleanSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      fill={fill}
      sizes={sizes}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      loading={priority ? undefined : loading}
      onLoad={handleLoad}
      onError={handleError}
      unoptimized={unoptimized}
      {...props}
    />
  );
};

export default SafeImage;