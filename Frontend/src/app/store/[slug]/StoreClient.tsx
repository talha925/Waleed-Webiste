// app/store/[slug]/StoreClient.tsx

'use client';

import confetti from 'canvas-confetti';
import SafeImage from '@/components/ui/SafeImage';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { decodeHTML } from '@/lib/utils/formatting';
import toast, { Toaster } from 'react-hot-toast';
import { Store, Coupon } from '@/lib/types/store';
import { useBrand } from '@/context/BrandContext';
import { themeClasses } from '@/lib/theme/utils';
import { Search, Copy, CheckCircle } from 'lucide-react';


// --- FAQ Item Component ---
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 sm:px-8 sm:py-6 text-left flex items-center justify-between gap-4 group"
      >
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
          {question}
        </h3>
        <span className={`flex-shrink-0 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
          {answer}
        </div>
      </div>
    </div>
  );
};

interface StoreClientProps {
  initialStore: Store | null;
  serverError?: string;
}

// --- Confetti Animation Helper ---
const triggerConfetti = (x: number, y: number) => {
  // Use canvas-confetti for high-performance explosions
  // We calculate origin based on normalized coordinates (0 to 1) 
  // since canvas-confetti expects that for its 'origin' property
  const originX = x / window.innerWidth;
  const originY = y / window.innerHeight;

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: originX, y: originY },
    colors: ['#2563eb', '#9333ea', '#f59e0b', '#ec4899', '#10b981'],
    ticks: 200,
    gravity: 1.2,
    scalar: 0.9,
    shapes: ['circle', 'square'],
    zIndex: 9999
  });
};

// --- CouponModal Component ---
interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onContinue: () => void;
  trackingUrl?: string;
}

const CouponModal = React.memo(({ isOpen, onClose, code, trackingUrl }: Pick<CouponModalProps, 'isOpen' | 'onClose' | 'code' | 'trackingUrl'>) => {
  const handleCopy = useCallback((e: React.MouseEvent) => {
    if (!code) return;

    // Robust clipboard handling with error fallback
    navigator.clipboard.writeText(code)
      .then(() => {
        triggerConfetti(e.clientX, e.clientY);
        toast.success(`Code "${code}" copied!`);
      })
      .catch((err) => {
        console.error('Failed to copy code:', err);
        toast.error('Failed to copy automatically. Please select and copy manually.');
      });
  }, [code]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ animation: 'fadeIn .2s ease' }} />
      <div className="relative bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl" style={{ animation: 'scaleUp .3s ease' }}>
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 mx-auto">
            <span className="text-3xl">🎁</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Your Code is Ready</h2>
            <p className="text-slate-500 text-sm">Copy it and paste at checkout to save!</p>
          </div>

          <div className="bg-slate-50 border-2 border-dashed border-brand-primary/30 rounded-2xl p-6 cursor-pointer hover:bg-brand-primary/5 transition-colors" onClick={handleCopy}>
            <div className="text-3xl font-black text-brand-primary tracking-[0.15em] font-mono select-all">{code}</div>
            <p className="text-xs text-brand-primary/60 font-semibold mt-2 uppercase tracking-wider">Tap to copy</p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCopy} className="flex-1 h-12 bg-brand-primary text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-95">
              Copy Code
            </button>
            <a href={trackingUrl ? sanitizeUrl(decodeHTML(trackingUrl)) : '#'} target="_blank" rel="sponsored noopener" className="flex-1 h-12 bg-brand-accent text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-1.5">
              Visit Store
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

const CouponCard = React.memo(({
  coupon,
  idx,
  isRevealed,
  onGetDeal
}: {
  coupon: Coupon;
  idx: number;
  isRevealed: boolean;
  onGetDeal: (coupon: Coupon, e: React.MouseEvent) => void
}) => {
  return (
    <div className="group h-full">
      <div className="relative h-full">
        {/* Ticket Notch - Center Only */}
        <div className="ticket-notch left-24 sm:left-32 top-1/2" />

        <div className="relative coupon-card rounded-[24px] overflow-hidden flex flex-row items-stretch h-full group/card">
          {/* Premium Accent Strip on Hover */}
          <div className="accent-strip" />

          {/* Top badges */}
          {(coupon.isBestValue || coupon.isExclusive) && (
            <div className="absolute top-0 right-0 flex gap-0 z-20">
              {coupon.isBestValue && <div className="bg-green-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg">🏆 Best</div>}
              {coupon.isExclusive && <div className="bg-brand-accent text-[#143154] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg">⭐ Exclusive</div>}
            </div>
          )}

          {/* Left Column (Icon) */}
          <div className="w-24 sm:w-32 flex flex-col items-center justify-center border-r border-dashed border-slate-300 flex-shrink-0 relative py-6 bg-slate-50/80 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500 ring-1 ring-slate-100/50">
              <div className="text-2xl leading-none font-black">
                {coupon.code ? '🏷️' : '🔥'}
              </div>
            </div>
            <div className="text-[9px] font-black text-[#143154]/40 uppercase tracking-[0.2em]">
              {coupon.code ? 'CODE' : 'DEAL'}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white z-10">
            <div className="min-w-0 flex-1">
              {coupon.usedCount && (
                <div className="mb-2">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg w-fit">
                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    {coupon.usedCount} People Used
                  </span>
                </div>
              )}
              <h3 className="text-lg sm:text-xl font-black text-[#111827] leading-tight group-hover:text-brand-primary transition-colors">
                {decodeHTML(coupon.offerDetails)}
              </h3>
            </div>

            <div className="flex-shrink-0 sm:pl-6 flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-green-600 uppercase tracking-[0.15em]">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Verified
              </span>
              {coupon.code ? (
                <button
                  onClick={(e) => onGetDeal(coupon, e)}
                  className={`h-11 px-6 border-2 text-[12px] font-black uppercase tracking-[0.05em] rounded-xl transition-all whitespace-nowrap ${isRevealed
                    ? 'bg-green-100 text-green-800 border-green-800 shadow-[4px_4px_0_0_#166534] hover:shadow-[1px_1px_0_0_#166534] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                    : 'bg-brand-accent text-[#111827] border-[#111827] shadow-[4px_4px_0_0_#111827] hover:shadow-[1px_1px_0_0_#111827] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                    }`}
                >
                  {isRevealed ? coupon.code : 'Show Code'}
                </button>
              ) : (
                <button
                  onClick={(e) => onGetDeal(coupon, e)}
                  className="h-11 px-6 bg-[#143154] hover:bg-[#0c2038] text-white text-[12px] font-black uppercase tracking-[0.1em] rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 whitespace-nowrap"
                >
                  Get Deal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// --- Empty State ---
const EmptyState = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Store Not Found</h2>
      <p className="text-slate-500 mb-6 text-sm">{message}</p>
      <a href="/" className="inline-flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-colors">
        ← Back to Home
      </a>
    </div>
  </div>
);

// --- Loading State ---
const LoadingState = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-12 h-12 border-3 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'hsl(var(--brand-primary) / 0.15)', borderTopColor: 'hsl(var(--brand-primary))' }} />
      <p className="text-slate-500 text-sm font-medium">Loading store...</p>
    </div>
  </div>
);

// --- Smart Description Formatter ---
const SmartDescription = React.memo(({ text }: { text: string | undefined }) => {
  const brand = useBrand();
  const descriptionContent = useMemo(() => {
    if (!text) return null;

    const cleanTextString = text.replace(/<[^>]*>/g, '');
    const words = cleanTextString.split(/\s+/).length;
    const readTime = Math.ceil(words / 200);
    const isHtml = /<[a-z][\s\S]*>/i.test(text);

    return { isHtml, readTime };
  }, [text]);

  if (!text || !descriptionContent) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {['JD', 'SK', 'MR'].map((initials, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-extrabold text-[#143154]/40 ring-1 ring-slate-200 shadow-sm first:z-30 [&:nth-child(2)]:z-20 [&:nth-child(3)]:z-10 bg-gradient-to-br from-slate-50 to-slate-100">
                {initials}
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-black text-slate-900">Expert Editorial</span>
              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Verified by {brand.siteName} Team</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors border border-slate-100 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-[12px] font-black text-slate-600">{descriptionContent.readTime} Min Read</div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="text-[12px] font-black text-green-600 italic">Latest: Today</div>
          </div>
        </div>
      </div>

      <div className="text-slate-600 leading-relaxed">
        {descriptionContent.isHtml ? (
          <div
            className="prose prose-slate sm:prose-lg max-w-none 
            prose-headings:font-black prose-headings:text-slate-900 
            prose-h1:text-4xl prose-h1:mb-10
            prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-8 prose-h2:border-l-4 prose-h2:border-brand-primary prose-h2:pl-6
            prose-p:text-slate-600 prose-p:leading-8 
            prose-a:text-brand-primary prose-a:font-black prose-a:underline prose-a:decoration-brand-primary/30 prose-a:underline-offset-4 hover:prose-a:decoration-brand-accent hover:prose-a:text-brand-accent transition-all duration-300 
            prose-li:marker:text-brand-primary prose-strong:text-slate-900"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <div className="space-y-6">
            {text.split('\n').map(l => l.trim()).filter(Boolean).map((line, index) => {
              const isHeading = (line.length < 90 && !line.endsWith('.')) || line.endsWith(':') || line.endsWith('?') || ["how to", "what to", "exclusive", "stay updated", "coupons", "promo code", "discount code", "vouchers"].some(k => line.toLowerCase().includes(k));

              if (isHeading) {
                const isMainTitle = index === 0;
                return (
                  <h3 key={index} className={`${isMainTitle ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-2xl border-l-4 border-brand-primary pl-5'} font-black text-slate-900 mt-12 mb-6 leading-tight`}>
                    {line}
                  </h3>
                );
              }

              if (line.startsWith('-') || line.startsWith('•') || /^\d+\./.test(line)) {
                const cleanLine = line.replace(/^[-•\d+\.]\s*/, '');
                return (
                  <div key={index} className="flex gap-4 ml-1 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: 'hsl(var(--brand-primary) / 0.1)', color: 'hsl(var(--brand-primary))' }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-slate-700 text-sm sm:text-base font-medium">{cleanLine}</span>
                  </div>
                );
              }
              return <p key={index} className="text-sm sm:text-base text-slate-600 leading-8 mb-4">{line}</p>;
            })}
          </div>
        )}
      </div>
    </div>
  );
});

// --- Main Client Component ---
export default function StoreClient({ initialStore, serverError }: StoreClientProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading] = useState(false);
  const [areCouponsUnlocked, setAreCouponsUnlocked] = useState(false);
  const [revealedCoupons, setRevealedCoupons] = useState<Record<string, boolean>>({});
  const hasRedirected = useRef(false);

  const activeCoupons = useMemo(() => initialStore?.coupons?.filter(c => c.isValid) || [], [initialStore?.coupons]);
  const totalCoupons = useMemo(() => initialStore?.coupons?.length || 0, [initialStore?.coupons]);



  const handleGetDeal = useCallback((coupon: Coupon, e: React.MouseEvent) => {
    if (!initialStore) return;

    setAreCouponsUnlocked(true);
    setRevealedCoupons(prev => ({ ...prev, [coupon._id]: true }));

    if (coupon.code) {
      navigator.clipboard.writeText(coupon.code)
        .then(() => {
          triggerConfetti(e.clientX, e.clientY);
          toast.success('Code copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy code:', err);
          toast.error('Failed to copy. Please copy the code manually.');
        });
      setSelectedCode(coupon.code);
      setShowModal(true);

      if (initialStore.trackingUrl && !hasRedirected.current) {
        const storeUrl = sanitizeUrl(decodeHTML(initialStore.trackingUrl));
        window.open(storeUrl, '_blank', 'noopener,noreferrer');
        setTimeout(() => {
          hasRedirected.current = true;
        }, 7000);
      }
    } else {
      if (initialStore.trackingUrl) window.open(sanitizeUrl(decodeHTML(initialStore.trackingUrl)), '_blank', 'noopener,noreferrer');
      toast.success('Deal activated! Redirecting...');
    }
  }, [initialStore]);

  const handleCloseModal = useCallback(() => { setShowModal(false); setSelectedCode(null); }, []);

  if (serverError) return <EmptyState message={serverError} />;
  if (isLoading) return <LoadingState />;
  if (!initialStore) return <EmptyState message="Store unavailable." />;

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '13px' }, duration: 3000 }} />
      <CouponModal isOpen={showModal} onClose={handleCloseModal} code={selectedCode || ''} trackingUrl={initialStore?.trackingUrl} />


      <div className={`min-h-screen ${themeClasses.backgrounds.primary} font-sans`}>

        {/* ═══════════ IMMERSIVE HERO ═══════════ */}
        <header className="relative mesh-gradient overflow-hidden border-b border-white/5">
          {/* Noise & Glow */}
          <div className="noise" />
          <div className="hero-glow absolute inset-0 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10 pb-32 sm:pt-16 sm:pb-48">
            <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative group">

              {/* Logo with glow ring */}
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-4 bg-brand-primary/20 rounded-full blur-3xl opacity-50" />
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-[2rem] p-4 shadow-2xl flex items-center justify-center ring-1 ring-white/10 overflow-hidden group/logo">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-500/5 to-transparent translate-x-[-100%] group-hover/logo:translate-x-[100%] transition-transform duration-1000" />
                  {initialStore.image?.url ? (
                    <SafeImage src={initialStore.image.url} alt={initialStore.name} width={130} height={130} className="object-contain relative z-10" priority />
                  ) : <span className="text-5xl">🏪</span>}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full ring-4 ring-[#143154] z-20 shadow-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>

              {/* Text & Stats Block */}
              <div className="flex-1 text-center sm:text-left space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                    <span className="text-brand-accent">{initialStore.name}</span> Coupon Codes, Promo Codes & Discounts
                  </h1>
                  <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed mx-auto sm:mx-0 font-medium">
                    {initialStore.short_description || `Verified discount codes and exclusive deals for ${initialStore.name}. Updated daily.`}
                  </p>
                </div>

                {/* Pill Stats */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-4 pb-4">
                  {[
                    { emoji: '🎟️', text: `${totalCoupons} Active Coupons`, color: 'from-blue-500/10' },
                    { emoji: '✅', text: 'Verified Today', color: 'from-green-500/10' },
                    { emoji: '⚡', text: 'Instant Savings', color: 'from-amber-500/10' },
                  ].map((pill, i) => (
                    <div key={i} className={`flex items-center gap-2 bg-white/10 border border-white/10 text-white text-[13px] font-bold px-5 py-2.5 rounded-2xl transition-all hover:scale-105 cursor-default shadow-lg shadow-black/10`}>
                      <span className="text-base">{pill.emoji}</span>
                      {pill.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ═══════════ MAIN CONTENT ═══════════ */}
        <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 -mt-32 sm:-mt-40 relative z-20 pb-8 sm:pb-12 text-left">
          <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">

            {/* Left Column — Coupons */}
            <div className="flex-1 min-w-0">
              {/* Section Header */}
              <div className="flex flex-col items-start mb-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm">Top Deals & Coupons</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-xs sm:text-sm text-white/70 font-medium tracking-wide">Last verified today • {totalCoupons} offers available</p>
                </div>
              </div>

              {/* Coupon Cards */}
              {activeCoupons.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Coupons</h3>
                  <p className="text-slate-400 text-sm">We're hunting down fresh deals. Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {activeCoupons.map((coupon, idx) => (
                    <CouponCard
                      key={coupon._id}
                      coupon={coupon}
                      idx={idx}
                      isRevealed={!!revealedCoupons[coupon._id]}
                      onGetDeal={handleGetDeal}
                    />
                  ))}
                </div>
              )}

              {/* Long Description */}
              {initialStore.long_description && (
                <div className="mt-16 bg-transparent performance-optimized">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8">About {initialStore.name}</h2>
                  <SmartDescription text={decodeHTML(initialStore.long_description)} />

                  {/* ═══════════ FAQ SECTION ═══════════ */}
                  <div className="mt-16 pt-16 border-t border-slate-200">
                    <div className="flex flex-col items-start mb-8">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
                      <p className="text-slate-500 text-sm mt-2">Everything you need to know about {initialStore.name} discounts.</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        {
                          q: `How do I use a ${initialStore.name} promo code?`,
                          a: `To use a ${initialStore.name} promo code, simply find an active offer on this page and click "Show Code". Copy the code and paste it into the "Promo Code" box at checkout on the ${initialStore.name} website.`
                        },
                        {
                          q: `Does ${initialStore.name} offer verified discount codes?`,
                          a: `Yes, all ${initialStore.name} discount codes on this page are manually verified by our editorial team to ensure they work as described.`
                        },
                        {
                          q: `Why is my ${initialStore.name} coupon not working?`,
                          a: `If your coupon isn't working, check if it's expired or has specific terms and conditions like a minimum spend or exclusion of certain items.`
                        },
                        {
                          q: `Can I combine multiple ${initialStore.name} coupons?`,
                          a: `Generally, ${initialStore.name} only allows one promo code per order. Choose the one that gives you the biggest discount!`
                        }
                      ].map((item, i) => (
                        <FAQItem key={i} question={item.q} answer={item.a} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column — Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-8">
              <div className="space-y-6">

                {/* How to Use / Guide to Savings */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 p-6 sm:p-7 relative overflow-hidden group">
                  {/* Visual Accent: Minimalist Side Accent */}
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-brand-primary opacity-10" />

                  <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-7 px-2">
                      Guide to Savings
                    </h3>

                    <div className="space-y-7">
                      {[
                        { icon: <Search className="w-4 h-4" />, title: 'Find a deal', desc: 'Browse available offers above' },
                        { icon: <Copy className="w-4 h-4" />, title: 'Copy code', desc: 'Click "Show Code" to copy it' },
                        { icon: <CheckCircle className="w-4 h-4" />, title: 'Save money', desc: 'Apply at checkout to save' },
                      ].map((step, i) => (
                        <div key={i} className="flex gap-4 group/step relative px-1">
                          {/* Connector Line - Thinner & More Subtle */}
                          {i !== 2 && (
                            <div className="absolute left-[20px] top-9 bottom-[-20px] w-[1px] bg-slate-100" />
                          )}

                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 z-20 relative group-hover/step:bg-white group-hover/step:text-brand-primary group-hover/step:border-brand-primary/20 group-hover/step:shadow-lg transition-all duration-300">
                              {step.icon}
                            </div>
                          </div>

                          <div className="flex-1 pt-0.5">
                            <div className="text-[13px] font-bold text-slate-800 mb-0.5 transition-colors group-hover/step:text-brand-primary">{step.title}</div>
                            <div className="text-[11px] text-slate-400 font-medium leading-tight">{step.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Newsletter CTA */}
                <div className="bg-gradient-to-br from-[#143154] via-[#0F172A] to-[#143154] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="noise" />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-brand-accent/10 via-transparent to-transparent pointer-events-none" />
                  <div className="text-3xl mb-4 relative z-10 rotate-12">💌</div>
                  <h3 className="font-black text-lg mb-2 relative z-10">Stay in the Loop</h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium relative z-10 mb-6">Get instantly notified when new {initialStore.name} deals are added. No spam, just savings.</p>
                  <div className="relative z-10">
                    <div className="flex gap-2">
                      <input type="email" placeholder="Your email" className="min-w-0 flex-1 h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all" />
                      <button className="h-11 px-4 bg-brand-accent text-[#0F172A] font-black text-xs rounded-xl hover:scale-105 transition-transform">Join</button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}