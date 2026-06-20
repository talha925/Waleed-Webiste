'use client';

import React from 'react';
import Link from 'next/link';
import { Store } from '@/lib/types';
import { decodeHTML, cleanTrackingUrl } from '@/lib/utils/formatting';
import SafeImage from '@/components/ui/SafeImage';
import { useBrand } from '@/context/BrandContext';

interface StoreCardProps {
  store: Store;
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const brand = useBrand();

  const handleGetDeal = () => {
    // Get the first available coupon
    const firstCoupon = store.coupons?.[0];
    
    // Copy coupon code to clipboard if available
    if (firstCoupon?.code) {
      navigator.clipboard.writeText(firstCoupon.code);
      alert(`Coupon code "${firstCoupon.code}" copied to clipboard!`);
    }

    // Redirect to store tracking URL
    if (store?.trackingUrl) {
      // 🚀 Trigger Google Ads Conversion Event
      if (typeof window !== 'undefined' && window.gtag && brand.gtagConversion) {
        window.gtag('event', 'conversion', {
          'send_to': brand.gtagConversion.sendTo,
          'value': brand.gtagConversion.value,
          'currency': brand.gtagConversion.currency
        });
      }

      // 🚀 Track click in Backend Database
      if (brand.apiBaseUrl && firstCoupon?._id) {
        fetch(`${brand.apiBaseUrl}/api/coupons/${firstCoupon._id}/track`, { method: 'POST' }).catch(err => console.error('Tracking error:', err));
      }

      const decodedUrl = cleanTrackingUrl(decodeHTML(store.trackingUrl));
      window.open(decodedUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Tracking URL not available for this store.');
    }
  };

  const hasCoupons = store.coupons && store.coupons.length > 0;
  const hasTrackingUrl = store.trackingUrl;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between items-center shadow-sm hover:shadow-md transition-all">
      <div className="h-28 flex items-center justify-center mb-4">
        <SafeImage
          src={store.image?.url || '/placeholder-store.png'}
          alt={store.image?.alt || store.name}
          width={160}
          height={80}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={false}
          className="object-contain max-h-24"
          fallbackSrc="/placeholder-store.png"
        />
      </div>

      <h3 className="text-lg font-medium text-gray-800 text-center mb-4">
        {store.name}
      </h3>

      <div className="flex flex-col gap-2 w-full">
        {/* GET DEAL Button */}
        {hasCoupons && hasTrackingUrl && (
          <button
            onClick={handleGetDeal}
            className="bg-gradient-to-r from-black to-blue-800 hover:from-blue-800 hover:to-black text-white text-sm font-semibold py-2 px-6 rounded-full shadow-md transition-all duration-200 transform hover:scale-105"
          >
            GET DEAL
          </button>
        )}
        
        {/* View Button */}
        <Link
          href={`/store/${store.slug}`}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2 px-6 rounded-full shadow-md transition text-center"
        >
          View All Coupons
        </Link>
      </div>
    </div>
  );
};

export default StoreCard;