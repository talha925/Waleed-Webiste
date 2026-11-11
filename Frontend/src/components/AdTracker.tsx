'use client';

/**
 * AdTracker Client Component (Next.js App Router)
 *
 * Implements website-wide visitor tracking, browser fingerprinting (SHA-256),
 * bot detection signal harvesting, and behavioral activity monitoring.
 *
 * Tracks all website visitors (Subject to user privacy & consent).
 * NEVER collects keystrokes, form text, or sensitive inputs — counts only.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useConsent } from '../hooks/useConsent';

// Helper to safely get brand ID without crashing if BrandProvider is absent
function getDetectedBrandId(): string {
    if (typeof window === 'undefined') return 'pennyscroll';
    const host = window.location.hostname.toLowerCase();
    if (host.includes('specreveal')) return 'specreveal';
    if (host.includes('blogzenix')) return 'blogzenix';
    if (host.includes('trendfiltered')) return 'trendfiltered';
    if (host.includes('pennyscroll')) return 'pennyscroll';
    return process.env.NEXT_PUBLIC_APP_BRAND_ID || 'pennyscroll';
}

/**
 * Computes a SHA-256 browser fingerprint excluding User-Agent.
 */
async function generateBrowserFingerprint(): Promise<{
    fpHash: string;
    signals: Record<string, any>;
}> {
    const nav = typeof window !== 'undefined' ? window.navigator : ({} as any);
    const scr = typeof window !== 'undefined' ? window.screen : ({} as any);

    // 1. WebGL Vendor & Renderer Extraction
    let webglVendor = '';
    let webglRenderer = '';
    let softwareWebGL = false;

    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                webglVendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
                webglRenderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
            } else {
                webglVendor = (gl as any).getParameter((gl as any).VENDOR) || '';
                webglRenderer = (gl as any).getParameter((gl as any).RENDERER) || '';
            }

            if (/swiftshader|llvmpipe|softpipe|mesa|software/i.test(webglRenderer) || /swiftshader|llvmpipe/i.test(webglVendor)) {
                softwareWebGL = true;
            }
        }
    } catch {}

    // 2. Offscreen Canvas Hash
    let canvasData = '';
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = '#f60';
            ctx.fillRect(10, 10, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('AdClickEvidence2026', 15, 15);
            ctx.strokeStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(50, 25, 20, 0, Math.PI * 2, true);
            ctx.stroke();
            canvasData = canvas.toDataURL();
        }
    } catch {}

    // 3. Extract Core Attributes (Explicitly EXCLUDING User-Agent)
    const platform = nav.platform || '';
    const languages = Array.isArray(nav.languages) ? nav.languages : [nav.language || ''];
    const hasLanguages = languages.length > 0 && languages[0] !== '';
    const hardwareConcurrency = nav.hardwareConcurrency || 0;
    const deviceMemory = (nav as any).deviceMemory || 0;
    const width = scr.width || 0;
    const height = scr.height || 0;
    const colorDepth = scr.colorDepth || 0;
    const pixelRatio = window.devicePixelRatio || 1;
    const maxTouchPoints = nav.maxTouchPoints || 0;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

    // 4. Build Fingerprint Payload
    const fingerprintComponents = [
        platform,
        languages.join(','),
        hardwareConcurrency,
        deviceMemory,
        `${width}x${height}`,
        colorDepth,
        pixelRatio,
        maxTouchPoints,
        timezone,
        webglVendor,
        webglRenderer,
        canvasData
    ].join('|||');

    // 5. Generate SHA-256 Hash
    let fpHash = '';
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(fingerprintComponents);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        fpHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
        // Fallback simple hash if subtle crypto fails
        let hash = 0;
        for (let i = 0; i < fingerprintComponents.length; i++) {
            hash = (hash << 5) - hash + fingerprintComponents.charCodeAt(i);
            hash |= 0;
        }
        fpHash = Math.abs(hash).toString(16).padStart(16, '0');
    }

    // 6. Bot Detection Signals
    const isWebdriver = Boolean(nav.webdriver);
    const isHeadless = isWebdriver || (!(window as any).chrome && !(window as any).safari && !maxTouchPoints);

    const signals = {
        webdriver: isWebdriver,
        headless: isHeadless,
        softwareWebGL,
        hasLanguages,
        languages,
        platform,
        cores: hardwareConcurrency,
        memory: deviceMemory,
        screen: {
            width,
            height,
            colorDepth,
            pixelRatio
        },
        touchSupport: maxTouchPoints > 0,
        timezone,
        webglVendor,
        webglRenderer
    };

    return { fpHash, signals };
}

export interface AdTrackerProps {
    trackUrl?: string;
    brandId?: string;
}

export default function AdTracker({ trackUrl, brandId }: AdTrackerProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { hasConsent, isLoaded } = useConsent();

    // Interaction counters ref (NEVER records typed text or keystroke values)
    const metricsRef = useRef({
        pointerMoves: 0,
        touchMoves: 0,
        scrollEvents: 0,
        maxScrollDepth: 0,
        clicks: 0,
        keyPresses: 0,
        visibleTimeMs: 0
    });

    const sessionRef = useRef<{
        visitId: string;
        fpHash: string;
        signals: Record<string, any>;
        landingPage: string;
        resolvedBrandId: string;
    } | null>(null);

    const visibleTimerStartRef = useRef<number>(Date.now());
    const isTrackingActiveRef = useRef<boolean>(false);

    // Endpoint resolution
    const resolvedEndpoint =
        trackUrl ||
        process.env.NEXT_PUBLIC_TRACK_URL ||
        '/api/ad-visit';

    /**
     * Send tracking payload to backend safely (fails silently)
     */
    const sendBeaconPayload = useCallback((eventType: 'init' | 'end' | 'snapshot') => {
        if (!sessionRef.current || !isTrackingActiveRef.current) return;

        try {
            // Update visible time
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                const delta = now - visibleTimerStartRef.current;
                if (delta > 0 && delta < 60000) {
                    metricsRef.current.visibleTimeMs += delta;
                }
                visibleTimerStartRef.current = now;
            }

            // Extract available URL query parameters
            const params: Record<string, string> = {};
            if (searchParams) {
                searchParams.forEach((val, key) => {
                    params[key] = val;
                });
            }

            const currentPath = window.location.pathname;

            const payload = {
                event: eventType,
                visitId: sessionRef.current.visitId,
                brandId: sessionRef.current.resolvedBrandId,
                fpHash: sessionRef.current.fpHash,
                gclid: params.gclid || null,
                gadSource: params.gad_source || null,
                referrer: document.referrer || '',
                path: currentPath,
                landingPage: sessionRef.current.landingPage,
                params: {
                    kw: params.kw || null,
                    network: params.network || null,
                    device: params.device || null,
                    mt: params.mt || null,
                    utm_source: params.utm_source || null,
                    utm_medium: params.utm_medium || null,
                    utm_campaign: params.utm_campaign || null,
                    utm_content: params.utm_content || null,
                    utm_term: params.utm_term || null,
                    gad_source: params.gad_source || null,
                    gclid: params.gclid || null,
                    gbraid: params.gbraid || null,
                    wbraid: params.wbraid || null,
                    gad_campaignid: params.gad_campaignid || null
                },
                signals: sessionRef.current.signals,
                behaviour: { ...metricsRef.current }
            };

            const payloadStr = JSON.stringify(payload);

            // Attempt navigator.sendBeacon with text/plain (avoids CORS preflight)
            let beaconSent = false;
            if (navigator.sendBeacon) {
                const blob = new Blob([payloadStr], { type: 'text/plain' });
                beaconSent = navigator.sendBeacon(resolvedEndpoint, blob);
            }

            // Fallback to fetch with keepalive if beacon failed or is snapshot
            if (!beaconSent) {
                fetch(resolvedEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        'x-brand-id': sessionRef.current.resolvedBrandId
                    },
                    body: payloadStr,
                    keepalive: true
                }).catch(() => {
                    // Fail silently
                });
            }
        } catch {
            // Fail silently
        }
    }, [resolvedEndpoint, searchParams]);

    // Initializer Effect: Run fingerprinting during idle time to prevent blocking page load
    useEffect(() => {
        if (!isLoaded || !hasConsent) return;

        let isMounted = true;
        let idleCallbackId: any = null;
        let timeoutId: any = null;

        async function initSession() {
            try {
                // 1. Visit ID Resolution (Session-persisted)
                let visitId = sessionStorage.getItem('ad_visit_id');
                if (!visitId) {
                    visitId = typeof crypto.randomUUID === 'function'
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                    sessionStorage.setItem('ad_visit_id', visitId);
                }

                // 2. Landing Page Recording
                let landingPage = sessionStorage.getItem('ad_landing_page');
                if (!landingPage) {
                    landingPage = window.location.href;
                    sessionStorage.setItem('ad_landing_page', landingPage);
                }

                // 3. Resolve Brand ID
                const resolvedBrandId = brandId || getDetectedBrandId();

                // 4. Generate Fingerprint & Signals (runs offscreen)
                const { fpHash, signals } = await generateBrowserFingerprint();

                if (!isMounted) return;

                sessionRef.current = {
                    visitId,
                    fpHash,
                    signals,
                    landingPage,
                    resolvedBrandId
                };

                isTrackingActiveRef.current = true;
                visibleTimerStartRef.current = Date.now();

                // Send initial beacon
                sendBeaconPayload('init');
            } catch {
                // Fail silently
            }
        }

        // Defer execution using requestIdleCallback so initial page render & LCP are instant
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            idleCallbackId = (window as any).requestIdleCallback(initSession, { timeout: 2000 });
        } else {
            timeoutId = setTimeout(initSession, 800);
        }

        return () => {
            isMounted = false;
            if (idleCallbackId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
                (window as any).cancelIdleCallback(idleCallbackId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isLoaded, hasConsent, brandId, sendBeaconPayload]);

    // Behaviour Monitoring & Periodic Snapshot Effect
    useEffect(() => {
        if (!hasConsent) return;

        // Throttled event handlers
        let lastMove = 0;
        const handlePointerMove = () => {
            const now = Date.now();
            if (now - lastMove > 100) {
                metricsRef.current.pointerMoves += 1;
                lastMove = now;
            }
        };

        let lastTouch = 0;
        const handleTouchMove = () => {
            const now = Date.now();
            if (now - lastTouch > 100) {
                metricsRef.current.touchMoves += 1;
                lastTouch = now;
            }
        };

        let lastScroll = 0;
        const handleScroll = () => {
            const now = Date.now();
            if (now - lastScroll > 100) {
                metricsRef.current.scrollEvents += 1;
                lastScroll = now;

                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (scrollHeight > 0) {
                    const depth = Math.round((window.scrollY / scrollHeight) * 100);
                    if (depth > metricsRef.current.maxScrollDepth) {
                        metricsRef.current.maxScrollDepth = Math.min(100, depth);
                    }
                }
            }
        };

        const handleClick = () => {
            metricsRef.current.clicks += 1;
        };

        // Record key activity count ONLY - NEVER capture key value or input contents
        const handleKeyDown = () => {
            metricsRef.current.keyPresses += 1;
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                sendBeaconPayload('end');
            } else if (document.visibilityState === 'visible') {
                visibleTimerStartRef.current = Date.now();
            }
        };

        const handlePageHide = () => {
            sendBeaconPayload('end');
        };

        // Attach listeners
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('click', handleClick, { passive: true });
        window.addEventListener('keydown', handleKeyDown, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);

        // 10-second periodic heartbeat snapshots
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                sendBeaconPayload('snapshot');
            }
        }, 10000);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
            clearInterval(intervalId);
        };
    }, [hasConsent, sendBeaconPayload]);

    // SPA Navigation Listener (Next.js App Router)
    useEffect(() => {
        if (!hasConsent || !isTrackingActiveRef.current) return;
        // On route change, send a snapshot of current navigation state
        sendBeaconPayload('snapshot');
    }, [pathname, searchParams, hasConsent, sendBeaconPayload]);

    return null; // Silent invisible monitoring component
}

