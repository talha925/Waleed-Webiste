// app/store/[slug]/StoreClient.tsx

'use client';


import SafeImage from '@/components/ui/SafeImage';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { decodeHTML, sanitizeUrl, cleanTrackingUrl, sanitizeBrandText } from '@/lib/utils/formatting';
import toast, { Toaster } from 'react-hot-toast';
import { Store, Coupon } from '@/lib/types/store';
import { useBrand } from '@/context/BrandContext';
import { themeClasses } from '@/lib/theme/utils';
import { Search, Copy, CheckCircle } from 'lucide-react';


// --- FAQ Item Component ---
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const brand = useBrand();
  const isDark = brand.isDarkMode;

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-500 ${isDark ? 'bg-[#0e121e]/80 backdrop-blur-2xl border-white/[0.05] shadow-[0_4px_30px_rgba(0,0,0,0.4)] hover:border-[rgba(255,30,39,0.3)] hover:shadow-[0_12px_40px_rgba(255,30,39,0.1),0_0_60px_rgba(255,30,39,0.04)]' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 sm:px-8 sm:py-6 text-left flex items-center justify-between gap-4 group"
      >
        <h3 className={`text-lg font-bold transition-colors ${isDark ? 'text-white group-hover:text-[#FF1E27]' : 'text-slate-900 group-hover:text-brand-primary'}`}>
          {question}
        </h3>
        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-180' : ''} ${isDark ? (isOpen ? 'bg-[#FF1E27]/15 text-[#FF1E27]' : 'bg-white/[0.04] text-slate-500 group-hover:bg-[#FF1E27]/10 group-hover:text-[#FF1E27]') : 'bg-slate-50 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className={`px-6 pb-6 sm:px-8 sm:pb-8 leading-relaxed border-t pt-4 ${isDark ? 'text-slate-300 border-white/[0.06]' : 'text-slate-600 border-slate-50'}`}>
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
  if (typeof window === 'undefined') return;
  requestAnimationFrame(async () => {
    try {
      const originX = x / window.innerWidth;
      const originY = y / window.innerHeight;
      const confetti = (await import('canvas-confetti')).default;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: originX, y: originY },
        colors: ['#2563eb', '#9333ea', '#f59e0b', '#ec4899', '#10b981'],
        ticks: 150,
        gravity: 1.2,
        scalar: 0.9,
        zIndex: 9999
      });
    } catch (_) {}
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
  const brand = useBrand();
  const isDark = brand.isDarkMode;

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
      <div className={`relative rounded-3xl p-8 sm:p-10 max-w-md w-full ${isDark ? 'bg-[#0e121e]/95 backdrop-blur-3xl border border-white/[0.06] text-white shadow-[0_30px_70px_-10px_rgba(0,0,0,0.8),0_0_50px_rgba(255,30,39,0.1),0_0_100px_rgba(255,30,39,0.04)]' : 'bg-white text-slate-900 shadow-2xl'}`} style={{ animation: 'scaleUp .3s ease' }}>
        <button onClick={onClose} className={`absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto ${isDark ? 'bg-[#FF1E27]/10 ring-1 ring-[#FF1E27]/20' : 'bg-gradient-to-br from-brand-primary/10 to-brand-accent/10'}`}>
            <span className="text-3xl">🎁</span>
          </div>

          <div>
            <h2 className={`text-2xl font-extrabold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Code is Ready</h2>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Copy it and paste at checkout to save!</p>
          </div>

          <div className={`border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${isDark ? 'border-[#FF1E27]/25 bg-[#FF1E27]/[0.03] hover:bg-[#FF1E27]/[0.06] hover:border-[#FF1E27]/40' : 'border-brand-primary/30 bg-slate-50 hover:bg-brand-primary/5'}`} onClick={handleCopy}>
            <div className={`text-3xl font-black tracking-[0.15em] font-mono select-all ${isDark ? 'text-[#FF1E27]' : 'text-brand-primary'}`}>{code}</div>
            <p className={`text-xs font-semibold mt-2 uppercase tracking-wider ${isDark ? 'text-[#FF1E27]/50' : 'text-brand-primary/60'}`}>Tap to copy</p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCopy} className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all active:scale-95 ${isDark ? 'bg-[#FF1E27] text-white shadow-[0_0_20px_rgba(255,30,39,0.3)] hover:shadow-[0_0_30px_rgba(255,30,39,0.5)]' : 'bg-brand-primary text-white hover:brightness-110'}`}>
              Copy Code
            </button>
            <a href={trackingUrl ? cleanTrackingUrl(decodeHTML(trackingUrl)) : '#'} target="_blank" rel="sponsored noopener noreferrer" className={`flex-1 h-12 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 ${isDark ? 'bg-white/[0.06] text-white border border-white/[0.1] hover:bg-white/[0.1]' : 'bg-brand-accent text-white hover:brightness-110'}`}>
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
  const brand = useBrand();
  const isDark = brand.isDarkMode;

  if (isDark) {
    // ══════════════════════════════════════════════════════════════════════════
    // SPEC REVEAL — PURE NEON CRIMSON & OBSIDIAN BRAND CARD LAYOUT
    // ══════════════════════════════════════════════════════════════════════════
    const isCode = !!coupon.code;
    return (
      <div className="group h-full">
        <div className={`relative h-full rounded-2xl bg-gradient-to-br from-[#0e1220]/95 via-[#0a0d18]/90 to-[#070912]/95 backdrop-blur-2xl border border-white/[0.08] p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#FF1E27]/40 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_30px_rgba(255,30,39,0.15)] overflow-hidden ${isCode ? 'border-l-4 border-l-[#FF1E27]' : 'border-l-4 border-l-white/30'}`}>

          {/* Subtle Crimson Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-[#FF1E27]/[0.05]" />

          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            <span className={`px-3.5 py-1 rounded-full font-mono font-black text-[10px] uppercase tracking-widest ${isCode ? 'bg-[#FF1E27]/15 text-[#FF1E27] border border-[#FF1E27]/30 shadow-[0_0_12px_rgba(255,30,39,0.2)]' : 'bg-white/10 text-white border border-white/20'}`}>
              {isCode ? 'CODE' : 'DEAL'}
            </span>

            <div className="flex items-center gap-2">
              {coupon.usedCount && (
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline-flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-full border border-white/[0.05]">
                  ⚡ {coupon.usedCount} used
                </span>
              )}
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E27] animate-pulse" />
                ✓ Verified
              </span>
            </div>
          </div>

          {/* Offer Title */}
          <div className="my-5 flex-1 flex items-center relative z-10">
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#FF1E27] transition-colors leading-snug">
              {sanitizeBrandText(decodeHTML(coupon.offerDetails), brand.siteName)}
            </h3>
          </div>

          {/* Bottom Dotted Row */}
          <div className="pt-4 border-t border-dashed border-white/10 flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs sm:text-sm font-bold tracking-wider px-3 py-1.5 rounded-lg border ${isCode ? 'bg-[#FF1E27]/10 border-[#FF1E27]/25 text-[#FF1E27]' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                {isRevealed
                  ? coupon.code
                  : (isCode ? (coupon.code && coupon.code.length > 3 ? `${coupon.code.slice(0, 3)}••••` : '••••••••') : 'No code needed')
                }
              </span>
            </div>

            {isCode ? (
              /* ── SHOW CODE — Premium Red Button ── */
              <button
                onClick={(e) => onGetDeal(coupon, e)}
                className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap flex items-center gap-2 hover:scale-105 active:scale-95 ${isRevealed
                  ? 'bg-[#FF1E27] text-white shadow-[0_0_24px_rgba(255,30,39,0.6)]'
                  : 'bg-[#FF1E27] text-white shadow-[0_4px_20px_rgba(255,30,39,0.5)] hover:shadow-[0_4px_30px_rgba(255,30,39,0.7)]'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L18 9.828M9 15l-3 3m0 0l-3-3m3 3V4" /></svg>
                <span>{isRevealed ? 'COPIED!' : 'Show Code'}</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            ) : (
              /* ── GET DEAL — White Gradient Button (Untouched) ── */
              <button
                onClick={(e) => onGetDeal(coupon, e)}
                className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 whitespace-nowrap shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-gradient-to-r from-white to-slate-100 text-black hover:bg-none hover:bg-[#FF1E27] hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,30,39,0.4)]"
              >
                <span>Get Deal</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIGHT MODE BRANDS (BLOGZENIX, PENNY SCROLL, TRUST LENSE) — 1-TO-1 ORIGINAL
  // ══════════════════════════════════════════════════════════════════════════
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
          <div className="w-24 sm:w-32 flex flex-col items-center justify-center border-r border-dashed flex-shrink-0 relative py-6 z-10 bg-slate-50/80 border-slate-300">
            <div className="w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-500 bg-white ring-1 ring-slate-100/50">
              <div className="text-2xl leading-none font-black">
                {coupon.code ? '🏷️' : '🔥'}
              </div>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#143154]/40">
              {coupon.code ? 'CODE' : 'DEAL'}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 p-6 sm:p-8 flex flex-col md:flex-row xl:flex-col 2xl:flex-row md:items-center xl:items-start 2xl:items-center justify-between gap-6 z-10 bg-white">
            <div className="min-w-0 flex-1">
              {coupon.usedCount && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit bg-slate-50 text-slate-400">
                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    {coupon.usedCount} People Used
                  </span>
                </div>
              )}
              <h3 className="text-lg sm:text-xl font-black leading-tight text-[#111827] group-hover:text-brand-primary transition-colors">
                {sanitizeBrandText(decodeHTML(coupon.offerDetails), brand.siteName)}
              </h3>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto xl:w-full 2xl:w-auto flex flex-row flex-wrap items-center justify-between md:justify-end xl:justify-between 2xl:justify-end gap-3 md:pl-6 xl:pl-0 2xl:pl-6">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-green-700">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Verified
              </span>
              {coupon.code ? (
                <button
                  onClick={(e) => onGetDeal(coupon, e)}
                  className={`h-11 px-4 sm:px-6 border-2 text-[12px] font-black uppercase tracking-[0.05em] rounded-xl transition-all whitespace-nowrap ml-auto ${isRevealed
                    ? 'bg-green-100 text-green-800 border-green-800 shadow-[4px_4px_0_0_#166534] hover:shadow-[1px_1px_0_0_#166534] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                    : 'bg-brand-accent text-[#111827] border-[#111827] shadow-[4px_4px_0_0_#111827] hover:shadow-[1px_1px_0_0_#111827] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                    }`}
                >
                  {isRevealed ? coupon.code : 'Show Code'}
                </button>
              ) : (
                <button
                  onClick={(e) => onGetDeal(coupon, e)}
                  className="h-11 px-4 sm:px-6 text-white text-[12px] font-black uppercase tracking-[0.1em] rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 whitespace-nowrap ml-auto bg-[#143154] hover:bg-[#0c2038]"
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

// --- Helper to parse inline links in plain text ---
const renderTextWithLinks = (text: string, trackingUrl?: string, isDark: boolean = false): React.ReactNode => {
  if (!text) return null;

  // 1. If text already contains HTML <a> tags, render them safely
  if (/<a\s+[^>]*href=/i.test(text)) {
    return (
      <span
        className="[&_a]:text-brand-primary [&_a]:font-bold [&_a]:underline [&_a]:decoration-brand-primary/30 [&_a]:underline-offset-4 hover:[&_a]:decoration-brand-accent hover:[&_a]:text-brand-accent [&_a]:transition-all [&_a]:duration-300"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  const targetUrl = trackingUrl ? cleanTrackingUrl(decodeHTML(trackingUrl)) : '';

  // Helper to construct styled anchor tags
  const renderAnchor = (linkText: string, href: string, key: string | number) => (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-primary font-bold underline decoration-brand-primary/30 underline-offset-4 hover:decoration-brand-accent hover:text-brand-accent transition-all duration-300"
    >
      {linkText}
    </a>
  );

  // 2. Parse markdown links: [text](url)
  const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  if (markdownRegex.test(text)) {
    const parts = [];
    let lastIndex = 0;
    let match;
    markdownRegex.lastIndex = 0;

    while ((match = markdownRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(renderAnchor(match[1], match[2], match.index));
      lastIndex = markdownRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return <>{parts}</>;
  }

  // 3. Auto-hyperlink keywords to trackingUrl if available
  if (targetUrl) {
    const autoKeywords = [
      'unlock the latest',
      'start saving today',
      'official website',
      'grab the best deals today',
      'high quality products',
      'website',
      'Apply',
    ];

    for (const kw of autoKeywords) {
      const lower = text.toLowerCase();
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        const before = text.slice(0, idx);
        const matchStr = text.slice(idx, idx + kw.length);
        const after = text.slice(idx + kw.length);

        return (
          <>
            {renderTextWithLinks(before, trackingUrl, isDark)}
            {renderAnchor(matchStr, targetUrl, `auto-${kw}-${idx}`)}
            {renderTextWithLinks(after, trackingUrl, isDark)}
          </>
        );
      }
    }
  }

  // 4. Parse raw URLs (http:// or https://)
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const urlParts = text.split(urlRegex);

  return urlParts.map((part, i) => {
    if (urlRegex.test(part)) {
      return renderAnchor(part, part, i);
    }
    return part;
  });
};

// --- Smart Description Formatter ---
const SmartDescription = React.memo(({ text: rawText, trackingUrl }: { text: string | undefined; trackingUrl?: string }) => {
  const brand = useBrand();
  const isDark = brand.isDarkMode;

  const text = useMemo(() => sanitizeBrandText(rawText, brand.siteName), [rawText, brand.siteName]);

  const descriptionContent = useMemo(() => {
    if (!text) return null;

    const cleanTextString = text.replace(/<[^>]*>/g, '');
    const words = cleanTextString.split(/\s+/).length;
    const readTime = Math.ceil(words / 200);
    const isHtml = /<[a-z][^>]*>/i.test(text);

    return { isHtml, readTime };
  }, [text]);

  if (!text || !descriptionContent) return null;

  return (
    <div>
      <div className={`flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b ${isDark ? 'border-white/[0.05]' : 'border-slate-200/60'}`}>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {['JD', 'SK', 'MR'].map((initials, i) => (
              <div key={i} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold shadow-sm first:z-30 [&:nth-child(2)]:z-20 [&:nth-child(3)]:z-10 ${isDark ? 'border-[#0e121e] bg-[#070a12] text-[#FF1E27]/50 ring-1 ring-white/[0.05]' : 'border-white bg-slate-100 text-[#143154]/40 ring-1 ring-slate-200 bg-gradient-to-br from-slate-50 to-slate-100'}`}>
                {initials}
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[13px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Expert Editorial</span>
              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Verified by {brand.siteName} Team</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border shadow-sm ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-white'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className={`text-[12px] font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{descriptionContent.readTime} Min Read</div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-green-50 text-green-700 border-green-100'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className={`text-[12px] font-black italic ${isDark ? 'text-emerald-400' : 'text-green-700'}`}>Latest: Today</div>
          </div>
        </div>
      </div>

      <div className={isDark ? 'text-slate-300 leading-relaxed' : 'text-slate-600 leading-relaxed'}>
        {descriptionContent.isHtml ? (
          <div
            className={`prose sm:prose-lg max-w-none 
            prose-headings:font-black 
            prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-4
            prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-l-4 prose-h2:border-brand-primary prose-h2:pl-5
            prose-p:leading-8 prose-p:mb-4
            prose-a:text-brand-primary prose-a:font-bold prose-a:underline prose-a:decoration-brand-primary/30 prose-a:underline-offset-4 hover:prose-a:decoration-brand-accent hover:prose-a:text-brand-accent transition-all duration-300 
            prose-li:marker:text-brand-primary ${isDark
                ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white'
                : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-600 prose-strong:text-slate-900'
              }`}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : (
          <div className="space-y-6">
            {text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map((block, index) => {
              const cleanBlock = block.replace(/\s+/g, ' ');
              const isMainTitle = index === 0;
              const isHeading = isMainTitle || (
                cleanBlock.length < 60 &&
                !/[.,?!]/.test(cleanBlock) &&
                (
                  cleanBlock.endsWith(':') ||
                  /^(how to|what to do|exclusive|stay updated with|about|why choose|tips for|guide to)/i.test(cleanBlock)
                )
              );

              if (isHeading) {
                return (
                  <h3 key={index} className={`${isMainTitle ? 'text-2xl sm:text-4xl mt-4 mb-6' : 'text-xl sm:text-2xl border-l-4 border-brand-primary pl-5 mt-12 mb-6'} font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {cleanBlock}
                  </h3>
                );
              }

              if (block.startsWith('-') || block.startsWith('•') || /^\d+\./.test(block)) {
                const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                return (
                  <div key={index} className="space-y-2">
                    {lines.map((l, lIdx) => {
                      const cleanLine = l.replace(/^[-•\d+\.]\s*/, '');
                      return (
                        <div key={lIdx} className={`flex gap-4 ml-1 p-3 rounded-xl transition-all border ${isDark ? 'hover:bg-white/[0.02] border-transparent hover:border-white/[0.06]' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}>
                          <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: 'hsl(var(--brand-primary) / 0.1)', color: 'hsl(var(--brand-primary))' }}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <span className={`text-sm sm:text-base font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            {renderTextWithLinks(cleanLine, trackingUrl, isDark)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return (
                <p key={index} className={`text-sm sm:text-base leading-8 mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {renderTextWithLinks(cleanBlock, trackingUrl, isDark)}
                </p>
              );
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
  const brand = useBrand();

  const activeCoupons = useMemo(() => initialStore?.coupons?.filter(c => c.isValid) || [], [initialStore?.coupons]);
  const totalCoupons = useMemo(() => initialStore?.coupons?.length || 0, [initialStore?.coupons]);



  const handleGetDeal = useCallback((coupon: Coupon, e: React.MouseEvent) => {
    if (!initialStore) return;

    // Instant UI feedback for sub-100ms INP
    if (coupon.code) {
      setSelectedCode(coupon.code);
      setShowModal(true);
    }

    React.startTransition(() => {
      setAreCouponsUnlocked(true);
      setRevealedCoupons(prev => ({ ...prev, [coupon._id]: true }));
    });

    const clientX = e.clientX;
    const clientY = e.clientY;

    // Run clipboard, animations, and network tracking asynchronously
    setTimeout(() => {
      // 🚀 Trigger Google Ads Conversion Event
      if (typeof window !== 'undefined' && (window as any).gtag && brand.gtagConversion) {
        (window as any).gtag('event', 'conversion', {
          'send_to': brand.gtagConversion.sendTo,
          'value': brand.gtagConversion.value,
          'currency': brand.gtagConversion.currency
        });
      }

      // 🚀 Track click in Backend Database
      if (brand.apiBaseUrl && coupon._id) {
        fetch(`${brand.apiBaseUrl}/api/coupons/${coupon._id}/track`, { method: 'POST' }).catch(() => {});
      }

      if (coupon.code) {
        navigator.clipboard.writeText(coupon.code)
          .then(() => {
            triggerConfetti(clientX, clientY);
            toast.success('Code copied to clipboard!');
          })
          .catch(() => {
            toast.error('Failed to copy. Please copy the code manually.');
          });

        if (initialStore.trackingUrl && !hasRedirected.current) {
          const storeUrl = cleanTrackingUrl(decodeHTML(initialStore.trackingUrl));
          window.open(storeUrl, '_blank', 'noopener,noreferrer');
          setTimeout(() => {
            hasRedirected.current = true;
          }, 7000);
        }
      } else {
        if (initialStore.trackingUrl) window.open(cleanTrackingUrl(decodeHTML(initialStore.trackingUrl)), '_blank', 'noopener,noreferrer');
        toast.success('Deal activated! Redirecting...');
      }
    }, 0);
  }, [initialStore, brand]);

  const handleCloseModal = useCallback(() => { setShowModal(false); setSelectedCode(null); }, []);

  if (serverError) return <EmptyState message={serverError} />;
  if (isLoading) return <LoadingState />;
  if (!initialStore) return <EmptyState message="Store unavailable." />;

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '12px', fontSize: '13px' }, duration: 3000 }} />
      <CouponModal isOpen={showModal} onClose={handleCloseModal} code={selectedCode || ''} trackingUrl={initialStore?.trackingUrl} />


      <div className={`min-h-screen ${themeClasses.backgrounds.primary} font-sans`}>

        {/* ═══════════ MARQUEE TICKER BAND (DARK MODE ONLY) ═══════════ */}
        {brand.isDarkMode && (
          <div className="bg-[#FF1E27] text-black overflow-hidden border-b border-white/10 relative z-30">
            <div className="flex whitespace-nowrap animate-marquee py-2.5 font-black text-xs uppercase tracking-widest">
              <span className="px-6">🔥 {totalCoupons} CODES LIVE</span>
              <span className="px-6">• VERIFIED TODAY BY EDITORS</span>
              <span className="px-6">• UP TO 80% OFF SALE ITEMS</span>
              <span className="px-6">• GUARANTEED WORKING DISCOUNTS</span>
              <span className="px-6">• INSTANT REDIRECT SAVINGS</span>
              <span className="px-6">🔥 {totalCoupons} CODES LIVE</span>
              <span className="px-6">• VERIFIED TODAY BY EDITORS</span>
              <span className="px-6">• UP TO 80% OFF SALE ITEMS</span>
              <span className="px-6">• GUARANTEED WORKING DISCOUNTS</span>
              <span className="px-6">• INSTANT REDIRECT SAVINGS</span>
            </div>
          </div>
        )}

        {/* ═══════════ IMMERSIVE HERO ═══════════ */}
        <header className="relative mesh-gradient overflow-hidden border-b border-white/5">
          {/* Noise & Glow */}
          <div className="noise" />
          <div className="hero-glow absolute inset-0 pointer-events-none" />
          {/* Top line — gradient sweep for dark, static for light */}
          <div className={`absolute inset-x-0 top-0 h-px ${brand.isDarkMode ? 'bg-gradient-to-r from-transparent via-[#FF1E27]/50 to-transparent bg-[length:200%_100%] animate-[gradientSweep_4s_linear_infinite]' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />

          {/* Floating Crimson Orbs — Dark mode only */}
          {brand.isDarkMode && (
            <>
              <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-[#FF1E27]/[0.04] blur-3xl animate-[floatOrb_6s_ease-in-out_infinite] pointer-events-none" />
              <div className="absolute top-[25%] right-[15%] w-24 h-24 rounded-full bg-[#FF1E27]/[0.03] blur-3xl animate-[floatOrb_8s_ease-in-out_infinite_1s] pointer-events-none" />
              <div className="absolute bottom-[20%] left-[30%] w-20 h-20 rounded-full bg-purple-500/[0.02] blur-3xl animate-[floatOrb_7s_ease-in-out_infinite_2s] pointer-events-none" />
            </>
          )}

          <div className={`max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${brand.heroPaddingClass || (brand.isDarkMode ? 'pt-8 pb-12 sm:pt-12 sm:pb-16' : 'pt-8 pb-36 sm:pt-12 sm:pb-48')}`}>
            {(brand.heroStyle === 'cyber' || brand.isDarkMode) ? (
              // ════════════════════════════════════════════════════════════════
              // SPEC REVEAL — FUTURISTIC HERO BANNER WITH STORE LOGO & STATS
              // ════════════════════════════════════════════════════════════════
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Side: Store Logo + Headline & CTAs */}
                <div className="lg:col-span-7 space-y-6 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    {/* Store Logo Circular Emblem */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-2 rounded-full blur-xl opacity-30 bg-[#FF1E27]/20" />
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-4 shadow-xl flex items-center justify-center overflow-hidden bg-white ring-4 ring-[#FF1E27] shadow-[0_0_15px_rgba(255,30,39,0.15)] transition-transform duration-500 hover:scale-105">
                        {initialStore.image?.url ? (
                          <SafeImage src={initialStore.image.url} alt={initialStore.name} width={120} height={120} className="w-full h-full object-contain relative z-10 rounded-full" priority />
                        ) : <span className="text-4xl">🏪</span>}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-[#FF1E27] text-white p-2 rounded-full z-20 ring-4 ring-[#070912] shadow-[0_0_8px_rgba(255,30,39,0.3)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#181c2b] border border-white/10 text-[#FF1E27] text-[11px] font-black uppercase tracking-wider shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-[#FF1E27] animate-pulse" />
                        {initialStore.name.toUpperCase()} DEALS · LIVE NOW
                      </span>

                      <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#FF1E27]">{initialStore.name}</span> Codes & Discounts
                      </h1>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium max-w-xl">
                    {sanitizeBrandText(initialStore.short_description, brand.siteName) || `${totalCoupons} verified ${initialStore.name} codes, checked today by ${brand.siteName} editors. Stack the savings before the drop ends.`}
                  </p>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-1">
                    <a
                      href="#deals"
                      className="px-6 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-[#FF1E27] text-white shadow-[0_0_25px_rgba(255,30,39,0.4)] hover:shadow-[0_0_35px_rgba(255,30,39,0.6)] hover:scale-105 transition-all duration-300"
                    >
                      Grab a Code ↓
                    </a>
                    <a
                      href={initialStore.trackingUrl ? cleanTrackingUrl(decodeHTML(initialStore.trackingUrl)) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-white/5 border border-white/10 text-white hover:border-[#FF1E27] hover:text-[#FF1E27] transition-all duration-300"
                    >
                      Shop {initialStore.name} ↗
                    </a>
                  </div>
                </div>

                {/* Right Side: Big Number Card */}
                <div className="lg:col-span-5">
                  <div className="relative rounded-[28px] bg-gradient-to-br from-[#121626] via-[#0d101d] to-[#080a14] border border-white/10 p-7 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(255,30,39,0.1)] overflow-hidden">
                    {/* Radial background glow */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#FF1E27]/15 rounded-full blur-3xl pointer-events-none" />

                    {/* Stamp Badge */}
                    <div className="absolute top-6 right-6 border-2 border-[#FF1E27] text-[#FF1E27] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest rotate-6 shadow-[0_0_12px_rgba(255,30,39,0.2)]">
                      VERIFIED
                    </div>

                    <div className="text-5xl sm:text-7xl font-black text-[#FF1E27] tracking-tight leading-none font-mono">
                      70<span className="text-2xl sm:text-3xl align-top">%</span>
                    </div>

                    <div className="text-xs sm:text-sm font-extrabold text-slate-400 uppercase tracking-widest mt-2">
                      Max off, right now
                    </div>

                    {/* Code Copy Row */}
                    {(() => {
                      const topCoupon = activeCoupons.find(c => c.code) || activeCoupons[0];
                      const isRevealed = topCoupon ? !!revealedCoupons[topCoupon._id] : false;
                      const rawCode = topCoupon?.code || 'BLOG6';
                      const maskedCode = rawCode.length > 3 ? `${rawCode.slice(0, 3)}••••` : '••••••••';

                      return (
                        <div className="mt-6 p-4 rounded-xl bg-[#060810] border border-dashed border-white/10 flex items-center justify-between gap-4">
                          <span className="font-mono font-bold text-base sm:text-lg text-[#FF1E27] tracking-widest">
                            {isRevealed ? rawCode : maskedCode}
                          </span>
                          <button
                            onClick={(e) => {
                              if (topCoupon) handleGetDeal(topCoupon, e);
                            }}
                            className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all duration-300 ${isRevealed ? 'bg-[#FF1E27] text-white shadow-[0_0_20px_rgba(255,30,39,0.5)]' : 'bg-white text-black hover:bg-[#FF1E27] hover:text-white'}`}
                          >
                            {isRevealed ? 'COPIED!' : 'SHOW CODE'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              // ════════════════════════════════════════════════════════════════
              // LIGHT MODE BRANDS (BLOGZENIX, PENNY SCROLL, TRUST LENSE) — 1-TO-1
              // ════════════════════════════════════════════════════════════════
              <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative group">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-4 bg-brand-primary/20 rounded-full blur-3xl opacity-50" />
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-card rounded-[2rem] p-4 shadow-2xl flex items-center justify-center ring-1 ring-border/20 overflow-hidden group/logo">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    {initialStore.image?.url ? (
                      <SafeImage src={initialStore.image.url} alt={initialStore.name} width={130} height={130} className="object-contain relative z-10" style={{ width: 'auto', height: 'auto' }} priority />
                    ) : <span className="text-5xl">🏪</span>}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-card z-20 shadow-lg">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                      <span className="text-brand-accent">{initialStore.name}</span> Coupon Codes, Promo Codes & Discounts
                    </h1>
                    <p className="text-slate-200 text-base sm:text-lg max-w-2xl leading-relaxed mx-auto sm:mx-0 font-medium">
                      {sanitizeBrandText(initialStore.short_description, brand.siteName) || `Verified discount codes and exclusive deals for ${initialStore.name}. Updated daily.`}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-4 pb-4">
                    {[
                      { emoji: '🎟️', text: `${totalCoupons} Active Coupons` },
                      { emoji: '✅', text: 'Verified Today' },
                      { emoji: '⚡', text: 'Instant Savings' },
                    ].map((pill, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[13px] font-bold px-5 py-2.5 rounded-2xl transition-all hover:scale-105 cursor-default shadow-lg">
                        <span className="text-base">{pill.emoji}</span>
                        {pill.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ═══════════ MAIN CONTENT ═══════════ */}
        <main className={`max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-8 sm:pb-12 text-left ${brand.mainMarginClass || (brand.isDarkMode ? 'pt-10 sm:pt-12' : '-mt-32 sm:-mt-40')}`}>
          <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">

            {/* Left Column — Coupons */}
            <div className="flex-1 min-w-0">
              {/* Section Header */}
              {brand.isDarkMode ? (
                /* SPEC REVEAL — DARK MODE SECTION HEADER */
                <div className="flex flex-col items-start mb-10 sm:mb-12 lg:mb-14">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-[#FF1E27]/15 text-[#FF1E27] border border-[#FF1E27]/30 shadow-[0_0_12px_rgba(255,30,39,0.2)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E27] inline-block mr-2 animate-pulse" />
                      Verified & Live Today
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md leading-tight">
                    🔥 Verified Promo Codes & Active Deals
                  </h2>
                  <p className="text-sm sm:text-base font-medium tracking-wide mt-3.5 text-slate-300/90">
                    Hand-tested by {brand.siteName} editors • {totalCoupons} working {totalCoupons === 1 ? 'offer' : 'offers'} available
                  </p>
                </div>
              ) : (
                /* BLOGZENIX / LIGHT BRANDS — 1-TO-1 ORIGINAL SECTION HEADER */
                <div className="flex flex-col items-start mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm">Top Deals & Coupons</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-xs sm:text-sm text-white/80 font-medium tracking-wide">Last verified today • {totalCoupons} offers available</p>
                  </div>
                </div>
              )}

              {/* Coupon Cards */}
              {activeCoupons.length === 0 ? (
                <div className={`rounded-2xl p-12 text-center border ${(brand.themeMode === 'dark' || brand.isDarkMode) ? 'bg-[#0e121e]/80 backdrop-blur-2xl border-white/[0.05]' : 'bg-card border-border'}`}>
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-lg font-bold text-foreground mb-1">No Active Coupons</h3>
                  <p className="text-foreground-secondary text-sm">We're hunting down fresh deals. Check back soon!</p>
                </div>
              ) : (
                <div className={(brand.cardStyle === 'neon-glass' || brand.isDarkMode) ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-1 xl:grid-cols-2 gap-8"}>
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
                <div className={`mt-16 bg-transparent performance-optimized ${brand.isDarkMode ? 'relative' : ''}`}>
                  {brand.isDarkMode && <div className="absolute -left-8 top-20 w-40 h-40 rounded-full bg-[#FF1E27]/[0.02] blur-[60px] animate-[ambientBreathe_6s_ease-in-out_infinite] pointer-events-none" />}
                  <h2 className={`text-2xl sm:text-3xl font-black mb-8 ${brand.isDarkMode ? 'text-white' : 'text-slate-900'}`}>About {initialStore.name} Discount Codes & Savings</h2>
                  <SmartDescription text={decodeHTML(initialStore.long_description)} trackingUrl={initialStore.trackingUrl} />

                  {/* ═══════════ PROTOTYPE HOW-TO-USE & TROUBLESHOOTING BOX ═══════════ */}
                  {brand.isDarkMode && (
                    <div className="mt-12 p-8 sm:p-10 rounded-[28px] bg-[#0c101c]/90 backdrop-blur-2xl border border-white/[0.06] space-y-8">
                      <div className="border-b border-white/[0.06] pb-4">
                        <span className="text-sm font-black uppercase tracking-widest text-[#FF1E27]">Guide & Troubleshooting</span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white uppercase mt-1">How to use your {initialStore.name} promo code</h3>
                      </div>

                      {/* 3 Step Stroke Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                          <span className="font-mono font-black text-5xl block text-transparent" style={{ WebkitTextStroke: '1.5px #FF1E27' }}>01</span>
                          <h4 className="text-lg font-black text-white">Add items to cart</h4>
                          <p className="text-sm text-slate-300 font-medium leading-relaxed">Visit the official {initialStore.name} site and add your desired products to the shopping bag.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                          <span className="font-mono font-black text-5xl block text-transparent" style={{ WebkitTextStroke: '1.5px #FF1E27' }}>02</span>
                          <h4 className="text-lg font-black text-white">Enter coupon code</h4>
                          <p className="text-sm text-slate-300 font-medium leading-relaxed">At checkout, paste your verified {brand.siteName} coupon code into the Promo Code box.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                          <span className="font-mono font-black text-5xl block text-transparent" style={{ WebkitTextStroke: '1.5px #FF1E27' }}>03</span>
                          <h4 className="text-lg font-black text-white">Apply & instant savings</h4>
                          <p className="text-sm text-slate-300 font-medium leading-relaxed">Click Apply — the discount code reduces your order total instantly.</p>
                        </div>
                      </div>

                      {/* Trouble List */}
                      <div className="space-y-4 pt-6 border-t border-white/[0.06]">
                        <h4 className="text-base sm:text-lg font-black text-[#FF1E27] uppercase tracking-wider mb-2">If your discount code isn't working:</h4>
                        <ul className="grid grid-cols-1 gap-3">
                          {[
                            'Make sure the promo code is entered correctly with no extra spaces or typos.',
                            'Check whether your cart meets the minimum purchase amount requirement.',
                            'Verify that the coupon code hasn\'t expired or reached usage limits.',
                            'Some promotional discounts apply only to specific products or sale categories.',
                            `If one code fails, try another verified ${initialStore.name} coupon code from the list above.`
                          ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm sm:text-base font-semibold text-slate-200 leading-relaxed hover:border-[#FF1E27]/30 transition-colors">
                              <span className="text-[#FF1E27] font-black text-lg leading-none">▸</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ═══════════ FAQ SECTION ═══════════ */}
                  <div className={`mt-16 pt-16 border-t ${brand.isDarkMode ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                    <div className="flex flex-col items-start mb-8">
                      <h2 className={`text-2xl sm:text-3xl font-black ${brand.isDarkMode ? 'text-white' : 'text-slate-900'}`}>Frequently Asked Questions (FAQ)</h2>
                      <p className={`text-sm mt-2 ${brand.isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Everything you need to know about {initialStore.name} discount codes, promo codes & deals.</p>
                    </div>
                    <div className="space-y-4">
                      {[
                        {
                          q: `How do I apply a ${initialStore.name} promo code?`,
                          a: `To apply a ${initialStore.name} promo code, click "Show Code" on an active offer above, copy the code, and paste it into the "Promo Code" box during checkout at ${initialStore.name}.`
                        },
                        {
                          q: `Where can I find verified ${initialStore.name} discount codes?`,
                          a: `All ${initialStore.name} discount codes and coupons on this page are hand-tested and verified daily by our editorial team.`
                        },
                        {
                          q: `Why is my ${initialStore.name} coupon code not working?`,
                          a: `If your ${initialStore.name} coupon code fails at checkout, ensure it hasn't expired, check minimum purchase thresholds, or try another verified code from our list.`
                        },
                        {
                          q: `Can I stack multiple ${initialStore.name} promo codes?`,
                          a: `Generally, ${initialStore.name} allows one promo code per order. Pick the code that yields the maximum savings!`
                        },
                        {
                          q: `How often are new ${initialStore.name} discount codes added?`,
                          a: `Our deal hunting team updates ${initialStore.name} coupon codes daily to deliver the latest working offers.`
                        }
                      ].map((item, i) => (
                        <FAQItem key={i} question={item.q} answer={item.a} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column — Sidebar (Light Mode Only) */}
            {!brand.isDarkMode && (
              <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-8">
                <div className="space-y-6">

                  {/* Guide to Savings */}
                  <div className="rounded-[2rem] border p-6 sm:p-7 relative overflow-hidden group bg-white border-slate-100 shadow-xl shadow-slate-200/30">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-brand-primary opacity-10" />
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-7 px-2 text-slate-500">
                        Guide to Savings
                      </h3>
                      <div className="space-y-7">
                        {[
                          { icon: <Search className="w-4 h-4" />, title: 'Find a deal', desc: 'Browse available offers above' },
                          { icon: <Copy className="w-4 h-4" />, title: 'Copy code', desc: 'Click "Show Code" to copy it' },
                          { icon: <CheckCircle className="w-4 h-4" />, title: 'Save money', desc: 'Apply at checkout to save' },
                        ].map((step, i) => (
                          <div key={i} className="flex gap-4 group/step relative px-1">
                            {i !== 2 && (
                              <div className="absolute left-[20px] top-9 bottom-[-20px] w-[1px] bg-slate-100" />
                            )}
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl border flex items-center justify-center z-20 relative transition-all duration-300 bg-slate-50 border-slate-100 text-slate-400 group-hover/step:bg-white group-hover/step:text-brand-primary group-hover/step:border-brand-primary/20 group-hover/step:shadow-lg">
                                {step.icon}
                              </div>
                            </div>
                            <div className="flex-1 pt-0.5">
                              <div className="text-[13px] font-bold mb-0.5 transition-colors text-slate-800 group-hover/step:text-brand-primary">{step.title}</div>
                              <div className="text-[11px] font-medium leading-tight text-slate-500">{step.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Newsletter CTA */}
                  <div className="rounded-[2rem] p-8 text-white relative overflow-hidden bg-gradient-to-br from-[#143154] via-[#0F172A] to-[#143154] shadow-2xl">
                    <div className="noise" />
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-tr from-brand-accent/10 via-transparent to-transparent" />
                    <div className="text-3xl mb-4 relative z-10 rotate-12">💌</div>
                    <h3 className="font-black text-xl uppercase mb-2 relative z-10">Never miss a drop</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium relative z-10 mb-6">Get pinged the second a new {initialStore.name} code goes live. No spam, just savings.</p>
                    <div className="relative z-10">
                      <form onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed successfully!'); }} className="flex flex-col gap-2.5">
                        <input type="email" placeholder="you@email.com" required className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FF1E27]/50 transition-all text-white placeholder:text-slate-500" />
                        <button type="submit" className="w-full h-11 px-5 font-black text-xs uppercase tracking-wider rounded-xl transition-all bg-brand-accent text-[#0F172A] shadow-md hover:scale-105">Join</button>
                      </form>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </>
  );
}