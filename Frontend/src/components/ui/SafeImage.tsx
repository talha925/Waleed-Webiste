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
  fallbackSrc = '/placeholder-store.png',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  /**
   * Properly encode URL for AWS S3 images
   * Handles special characters like spaces, parentheses, etc.
   */
  const encodeImageUrl = (url: string): string => {
    if (!url) return fallbackSrc;

    try {
      // Check if it's an AWS S3 URL
      if (url.includes('amazonaws.com')) {
        // Split the URL to get the base and the file path
        const urlParts = url.split('/');
        if (urlParts.length > 3) {
          // Get the base URL (protocol + domain)
          const baseUrl = urlParts.slice(0, 3).join('/');
          // Get the file path and encode it properly
          const filePath = urlParts.slice(3).join('/');

          // Encode the file path while preserving forward slashes
          const encodedPath = filePath
            .split('/')
            .map(segment => encodeURIComponent(segment))
            .join('/');

          return `${baseUrl}/${encodedPath}`;
        }
      }

      // For other URLs, return as is
      return url;
    } catch (error) {
      console.warn('Error encoding image URL:', error);
      return fallbackSrc;
    }
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      onError?.();
    }
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  const encodedSrc = encodeImageUrl(imgSrc);

  return (
    <Image
      src={encodedSrc}
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
      {...props}
    />
  );
};

export default SafeImage;