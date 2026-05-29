'use client';

import React, { useState } from 'react';
import Image from 'next/image';

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
 * SafeImage component that handles URL encoding and provides fallback for broken images
 * Specifically designed to handle AWS S3 URLs with special characters
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
  const [hasError, setHasError] = React.useState(false);

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
    if (!hasError) {
      setHasError(true);
      onError?.();
    }
  };

  const handleLoad = () => {
    // We don't Reset hasError here to avoid loops if fallback also fails
    onLoad?.();
  };

  const cleanSrc = getCleanSrc(src);

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