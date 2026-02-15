'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { themeClasses } from '@/lib/theme/utils';

interface CarouselProps {
  images: string[];
}

export default function Carousel({ images }: CarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative h-full">
      <button
        onClick={prevSlide}
        className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${themeClasses.backgrounds.card}/80 hover:${themeClasses.backgrounds.cardHover}/90 ${themeClasses.text.primary} w-12 h-12 rounded-full cursor-pointer z-10 flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${themeClasses.borders.light}/50 hover:border-purple-500/50`}
      >
        ❮
      </button>
      <div className="h-full">
        <div className="relative h-full transition-opacity duration-500">
          <Image
            src={images[currentSlide]}
            alt="Current Image"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
            priority
            loading="eager"
          />

        </div>
      </div>
      <button
        onClick={nextSlide}
        className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${themeClasses.backgrounds.card}/80 hover:${themeClasses.backgrounds.cardHover}/90 ${themeClasses.text.primary} w-12 h-12 rounded-full cursor-pointer z-10 flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${themeClasses.borders.light}/50 hover:border-purple-500/50`}
      >
        ❯
      </button>
    </div>
  );
}