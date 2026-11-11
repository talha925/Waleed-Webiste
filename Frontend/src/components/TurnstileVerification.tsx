'use client';

/**
 * Cloudflare Turnstile Verification Component (Phase 2)
 *
 * Feature Flag: ENABLE_TURNSTILE=false (Off by default).
 *
 * When enabled, conditionally presents a friendly Turnstile verification widget
 * to high-risk visitors before critical CTA/checkout operations.
 * Legitimate users who complete the challenge continue unimpeded.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface TurnstileVerificationProps {
    siteKey?: string;
    onSuccess: (token: string) => void;
    onError?: (error: string) => void;
    onExpire?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    action?: string;
    className?: string;
}

declare global {
    interface Window {
        turnstile?: {
            render: (container: HTMLElement | string, options: any) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
        onTurnstileLoaded?: () => void;
    }
}

export default function TurnstileVerification({
    siteKey,
    onSuccess,
    onError,
    onExpire,
    theme = 'auto',
    action = 'security-check',
    className = ''
}: TurnstileVerificationProps) {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_TURNSTILE === 'true';
    const resolvedSiteKey = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (!isEnabled || !resolvedSiteKey) return;

        // Load Cloudflare Turnstile Script if not already loaded
        const SCRIPT_ID = 'cf-turnstile-script';
        let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement;

        if (!script) {
            script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoaded';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        window.onTurnstileLoaded = () => {
            setIsLoaded(true);
        };

        if (window.turnstile) {
            setIsLoaded(true);
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {}
            }
        };
    }, [isEnabled, resolvedSiteKey]);

    useEffect(() => {
        if (!isLoaded || !window.turnstile || !containerRef.current || !resolvedSiteKey) return;

        try {
            if (widgetIdRef.current) {
                window.turnstile.remove(widgetIdRef.current);
            }

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: resolvedSiteKey,
                action,
                theme,
                callback: (token: string) => {
                    onSuccess(token);
                },
                'error-callback': (err: any) => {
                    if (onError) onError(String(err));
                },
                'expired-callback': () => {
                    if (onExpire) onExpire();
                }
            });
        } catch (err) {
            console.warn('⚠️ Turnstile render error:', err);
        }
    }, [isLoaded, resolvedSiteKey, action, theme, onSuccess, onError, onExpire]);

    // If disabled or missing sitekey, render nothing
    if (!isEnabled || !resolvedSiteKey) {
        return null;
    }

    return (
        <div className={`turnstile-container my-4 flex flex-col items-center justify-center ${className}`}>
            <div ref={containerRef} />
            <p className="text-xs text-gray-500 mt-2">
                Protected by Cloudflare Turnstile
            </p>
        </div>
    );
}

