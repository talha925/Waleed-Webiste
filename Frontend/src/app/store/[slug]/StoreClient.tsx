// app/store/[slug]/StoreClient.tsx

'use client';

import SafeImage from '@/components/ui/SafeImage';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { decodeHTML } from '@/lib/utils/formatting';
import toast, { Toaster } from 'react-hot-toast';
import { Store, Coupon } from '@/lib/types/store';
import DragReveal from '@/components/ui/DragReveal';
import { useBrand } from '@/context/BrandContext';

interface StoreClientProps {
  initialStore: Store | null;
  serverError?: string;
}

// --- Confetti Animation Helper ---
const triggerConfetti = (x: number, y: number) => {
  const count = 20;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('confetti');
    document.body.appendChild(particle);

    const destinationX = (Math.random() - 0.5) * 200;
    const destinationY = (Math.random() - 0.5) * 200;
    const rotation = Math.random() * 520;
    const delay = Math.random() * 200;

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    particle.style.transform = `rotate(${rotation}deg)`;

    particle.animate([
      { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${destinationX}px, ${destinationY}px) rotate(${rotation}deg)`, opacity: 0 }
    ], {
      duration: 1000 + Math.random() * 1000,
      easing: 'cubic-bezier(0, .9, .57, 1)',
      delay: delay
    }).onfinish = () => particle.remove();
  }
};

// --- CouponModal Component ---
interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;

  onContinue: () => void;
  trackingUrl?: string;
}

const CouponModal = ({ isOpen, onClose, code, onContinue, trackingUrl }: CouponModalProps) => {
  const handleCopy = useCallback((e: React.MouseEvent) => {
    navigator.clipboard.writeText(code);
    triggerConfetti(e.clientX, e.clientY);
    toast.success(`Code "${code}" copied!`);
  }, [code]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-up overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-50 pointer-events-none" aria-hidden="true"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-50 pointer-events-none" aria-hidden="true"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center space-y-6 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto shadow-inner" aria-hidden="true">
            <span className="text-4xl" role="img" aria-label="gift">🎁</span>
          </div>

          <div className="space-y-2">
            <h2 id="modal-title" className="text-2xl font-bold text-gray-900">Here's Your Code</h2>
            <p className="text-gray-500 text-sm">Copy this code and paste it at checkout to save!</p>
          </div>

          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 relative group hover:border-blue-400 transition-colors">
            <div className="text-3xl font-mono font-bold text-gray-800 tracking-wider select-all" aria-label={`Coupon code: ${code}`}>{code}</div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-xl cursor-pointer" onClick={handleCopy}>
              <span className="font-semibold text-blue-600">Click to Copy</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCopy}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              aria-label="Copy coupon code to clipboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </button>
            {trackingUrl ? (
              <a
                href={decodeHTML(trackingUrl)}
                target="_blank"
                rel="sponsored noopener noreferrer"
                onClick={onClose}
                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Continue to store website"
              >
                <span>Continue to Store</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            ) : (
              <button
                onClick={() => { onContinue(); onClose(); }}
                className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Continue to store website"
              >
                <span>Continue to Store</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Empty State Component ---
const EmptyState = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Store Not Found</h2>
      <p className="text-slate-600 mb-6">{message}</p>
      <a
        href="/"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </a>
    </div >
  </div >
);



// --- Loading State Component ---
const LoadingState = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600 font-medium">Loading store...</p>
    </div>
  </div>
);

// --- Smart Description Formatter ---
const SmartDescription = ({ text }: { text: string | undefined }) => {
  const brand = useBrand();
  if (!text) return null;

  // Calculate read time (stripping HTML tags for accuracy if needed)
  const cleanText = text.replace(/<[^>]*>/g, '');
  const words = cleanText.split(/\s+/).length;
  const readTime = Math.ceil(words / 200);

  const isHtml = /<[a-z][\s\S]*>/i.test(text);

  return (
    <div>
      {/* Blog Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8 text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-wider border-b border-slate-100 pb-4">
        <span>Description</span>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <span>{readTime} min read</span>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <span className="text-blue-500">Updated Today</span>
      </div>

      {/* Content */}
      <div className="text-slate-600 leading-relaxed font-normal">
        {isHtml ? (
          <div
            className="prose prose-slate sm:prose-lg max-w-none 
              prose-headings:font-bold prose-headings:text-slate-900 
              prose-p:text-slate-600 prose-p:leading-8
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-700 hover:prose-a:underline
              prose-li:marker:text-blue-500 prose-li:text-slate-700
              prose-strong:text-slate-900 prose-strong:font-bold"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          /* Fallback Plain Text Formatter */
          <div className="space-y-6">
            {text.split('\n').map(l => l.trim()).filter(Boolean).map((line, index) => {
              // Heuristic for Heading
              const isHeading =
                (line.length < 80 && !line.endsWith('.')) ||
                line.endsWith(':') ||
                line.endsWith('?') ||
                ["how to", "what to", "exclusive", "stay updated"].some(k => line.toLowerCase().includes(k));

              if (isHeading) {
                return (
                  <h3 key={index} className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 sm:mt-10 mb-3 sm:mb-4 flex gap-3 items-start group">
                    <span className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mt-1 sm:mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span className="-ml-4 group-hover:ml-0 transition-all duration-300">{line}</span>
                  </h3>
                );
              }

              // Heuristic for Lists
              if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line)) {
                const cleanLine = line.replace(/^[-•\d+\.]\s*/, '');
                return (
                  <div key={index} className="flex gap-3 sm:gap-4 mb-3 ml-1 sm:ml-2 p-2 sm:p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="mt-1 flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-700 font-medium">{cleanLine}</span>
                  </div>
                );
              }

              // Regular Paragraph
              return <p key={index} className="text-base sm:text-lg text-slate-600 leading-7 sm:leading-8 mb-4">{line}</p>;
            })}
          </div>
        )}
      </div>

      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
            {brand.siteName.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-sm">
            <div className="font-bold text-slate-900">{brand.siteName} Editors</div>
            <div className="text-slate-500 text-xs sm:text-sm">Curated & Verified</div>
          </div>
        </div>
        <button
          className="w-full sm:w-auto py-2 sm:py-0 text-sm text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50 sm:hover:bg-transparent rounded-lg transition-colors flex items-center justify-center sm:justify-end"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Back to Top ↑
        </button>
      </div>
    </div>
  );
};

// --- Main Client Component ---
export default function StoreClient({ initialStore, serverError }: StoreClientProps) {
  const brand = useBrand();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [areCouponsUnlocked, setAreCouponsUnlocked] = useState(false);

  // Memoize computed values
  const activeCoupons = useMemo(() =>
    initialStore?.coupons?.filter(c => c.isValid) || [],
    [initialStore?.coupons]
  );

  const totalCoupons = useMemo(() =>
    initialStore?.coupons?.length || 0,
    [initialStore?.coupons]
  );

  // Inject styles client-side only to avoid hydration mismatch
  useEffect(() => {
    if (!document.getElementById('store-premium-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'store-premium-styles';
      styleEl.textContent = `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
          z-index: 9999;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  const handleGetDeal = useCallback((coupon: Coupon, e: React.MouseEvent) => {
    if (!initialStore) return;

    if (coupon.code) {
      // Unlock ALL coupons interactions
      setAreCouponsUnlocked(true);

      // Auto-copy the code to clipboard
      navigator.clipboard.writeText(coupon.code)
        .then(() => toast.success('Code copied to clipboard!'))
        .catch((err) => console.error('Failed to copy code:', err));

      setSelectedCode(coupon.code);
      setShowModal(true);
      if (initialStore.trackingUrl) {
        window.open(decodeHTML(initialStore.trackingUrl), '_blank', 'noopener,noreferrer');
      }
    } else {
      if (initialStore.trackingUrl) {
        window.open(decodeHTML(initialStore.trackingUrl), '_blank', 'noopener,noreferrer');
      }
      toast.success('Deal activated! Redirecting...');
    }
  }, [initialStore]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedCode(null);
  }, []);

  // Error handling
  if (serverError) {
    return <EmptyState message={serverError} />;
  }

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Empty state
  if (!initialStore) {
    return <EmptyState message="This store is currently unavailable. Please try again later." />;
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#333', color: '#fff', borderRadius: '12px' },
          duration: 3000,
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
        }}
      />

      <CouponModal
        isOpen={showModal}
        onClose={handleCloseModal}
        code={selectedCode || ''}
        onContinue={() => {
          if (initialStore?.trackingUrl) {
            window.open(decodeHTML(initialStore.trackingUrl), '_blank', 'noopener,noreferrer');
          }
        }}
        trackingUrl={initialStore?.trackingUrl}
      />

      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

        {/* HERO SECTION */}
        <header className="relative bg-slate-900 text-white overflow-hidden pb-16 md:pb-24">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[120%] rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 blur-3xl animate-float" style={{ animationDuration: '15s' }}></div>
            <div className="absolute top-[20%] -right-[20%] w-[60%] h-[100%] rounded-full bg-gradient-to-bl from-indigo-500/20 to-pink-500/20 blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '20s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-4 sm:pt-6 md:pt-8">
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12">
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500" aria-hidden="true"></div>
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-white rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-center transform group-hover:scale-105 transition duration-300">
                  {initialStore.image?.url ? (
                    <SafeImage
                      src={initialStore.image.url}
                      alt={`${initialStore.name} logo`}
                      width={120}
                      height={120}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                      <span className="text-3xl sm:text-4xl md:text-5xl" role="img" aria-label={`${initialStore.name} store`}>
                        🏪
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 bg-blue-500 text-white p-1 sm:p-1.5 rounded-full border-2 sm:border-4 border-slate-900 shadow-lg" title="Verified Store" aria-label="Verified store badge">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 sm:mb-4">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200">
                    {initialStore.name}
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-blue-100/90 max-w-2xl leading-relaxed mb-4 sm:mb-6">
                  {initialStore.short_description || initialStore.long_description}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 md:gap-8">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/10">
                    <span className="text-xl sm:text-2xl" role="img" aria-label="coupon">🏷️</span>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-bold text-white">{totalCoupons} Active</div>
                      <div className="text-xs text-blue-200">Coupons Available</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/10">
                    <span className="text-xl sm:text-2xl" role="img" aria-label="fire">🔥</span>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-bold text-white">1.2k Used</div>
                      <div className="text-xs text-blue-200">Today</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/10">
                    <span className="text-xl sm:text-2xl" role="img" aria-label="star">⭐</span>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-bold text-white">Verified</div>
                      <div className="text-xs text-blue-200">Official Store</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-20 pb-12 sm:pb-20">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">

            <div className="flex-1">
              <div className="flex flex-row items-center justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-blue-800">Top Deals & Coupons</h2>
                <div className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">Last updated: Today</div>
              </div>

              {activeCoupons.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Coupons</h3>
                  <p className="text-slate-600">Check back soon for new deals and offers!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {activeCoupons.map((coupon) => (
                    <article
                      key={coupon._id}
                      className={`group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden ${coupon.isBestValue ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    >
                      {coupon.isBestValue && (
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-600 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10" aria-label="Best value offer">
                          BEST VALUE
                        </div>
                      )}
                      {coupon.isExclusive && (
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-purple-600 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10" aria-label="Exclusive offer">
                          EXCLUSIVE
                        </div>
                      )}

                      <div className="flex flex-col h-full">
                        <div className="flex items-start gap-3 sm:gap-4 mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl sm:text-2xl shadow-inner flex-shrink-0" aria-hidden="true">
                            {coupon.active ? '⚡' : '✂️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors break-words">
                              {decodeHTML(coupon.offerDetails)}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                              {coupon.usedCount ? `${coupon.usedCount} used today` : 'Popular offer'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 border-dashed">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                            {coupon.code && !coupon.active ? (
                              <div className="flex-1">
                                {areCouponsUnlocked ? (
                                  <DragReveal code={coupon.code} />
                                ) : (
                                  <div className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center font-mono text-slate-500 select-none">
                                    *****{coupon.code.slice(-3)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-1 text-sm font-medium text-green-600 flex items-center justify-center sm:justify-start gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                No Code Needed
                              </div>
                            )}

                            <button
                              onClick={(e) => handleGetDeal(coupon, e)}
                              className={`px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap ${coupon.active
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white focus:ring-green-500'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-pulse-glow focus:ring-blue-500'
                                }`}
                              aria-label={coupon.active ? 'Get deal' : 'Show coupon code'}
                            >
                              {coupon.active ? 'GET DEAL' : 'SHOW CODE'}
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {initialStore.long_description && (
                <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">More About {initialStore.name}</h2>
                  <SmartDescription text={decodeHTML(initialStore.long_description)} />
                </div>
              )}
            </div>

            <aside className="w-full lg:w-80 space-y-6 sm:space-y-8">
              <div className="hidden lg:block bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl p-4 sm:p-6 shadow-lg">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-500 rounded-full" aria-hidden="true"></span>
                  About Store
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {decodeHTML(initialStore.short_description || 'No description available.')}
                </p>
                <button
                  onClick={() => initialStore.trackingUrl && window.open(decodeHTML(initialStore.trackingUrl), '_blank', 'noopener,noreferrer')}
                  className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!initialStore.trackingUrl}
                  aria-label="Visit store website"
                >
                  Visit Website
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">How to use coupons</h3>
                <ol className="space-y-4" aria-label="Steps to use coupons">
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">1</div>
                    <p className="text-sm text-slate-600">Click "Show Code" to reveal the coupon.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">2</div>
                    <p className="text-sm text-slate-600">Copy the code from the popup.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">3</div>
                    <p className="text-sm text-slate-600">Paste it at checkout on the store's website.</p>
                  </li>
                </ol>
              </div>
            </aside>

          </div>
        </main>

      </div>
    </>
  );
}