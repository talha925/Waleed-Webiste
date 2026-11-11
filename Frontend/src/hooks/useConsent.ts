'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ad_consent_status';

/**
 * Hook to manage privacy and consent state for analytics and fingerprinting.
 *
 * Rules:
 * - UK / EU visitors: requires explicit opt-in before non-essential tracking.
 * - Non-EU visitors: consent granted by default unless explicitly revoked (opt-out model).
 * - Integrates seamlessly with existing cookie banners via window custom events
 *   ('consentGranted', 'consentRevoked') or localStorage.
 */
export function useConsent() {
    const [hasConsent, setHasConsent] = useState<boolean>(false);
    const [isEuVisitor, setIsEuVisitor] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    useEffect(() => {
        try {
            // Detect EU/UK visitor using timezone heuristic
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const euTimezones = [
                'Europe/',
                'Atlantic/Reykjavik',
                'UTC',
                'GMT'
            ];
            const isEu = euTimezones.some(prefix => tz.startsWith(prefix));
            setIsEuVisitor(isEu);

            // Check stored consent or window global hook
            const stored = localStorage.getItem(STORAGE_KEY);
            const globalConsent = typeof window !== 'undefined' ? (window as any).__PENNY_CONSENT__ : null;

            if (stored === 'granted' || globalConsent === true) {
                setHasConsent(true);
            } else if (stored === 'denied' || globalConsent === false) {
                setHasConsent(false);
            } else {
                // If no decision recorded:
                // Non-EU visitors default to true; EU visitors wait for explicit consent
                setHasConsent(!isEu);
            }
        } catch {
            setHasConsent(true);
        } finally {
            setIsLoaded(true);
        }

        // Listen for external consent banner events
        const handleGrant = () => {
            try {
                localStorage.setItem(STORAGE_KEY, 'granted');
            } catch {}
            setHasConsent(true);
        };

        const handleRevoke = () => {
            try {
                localStorage.setItem(STORAGE_KEY, 'denied');
            } catch {}
            setHasConsent(false);
        };

        window.addEventListener('consentGranted', handleGrant);
        window.addEventListener('consentRevoked', handleRevoke);

        return () => {
            window.removeEventListener('consentGranted', handleGrant);
            window.removeEventListener('consentRevoked', handleRevoke);
        };
    }, []);

    const grantConsent = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'granted');
        } catch {}
        setHasConsent(true);
        window.dispatchEvent(new CustomEvent('consentGranted'));
    }, []);

    const revokeConsent = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'denied');
        } catch {}
        setHasConsent(false);
        window.dispatchEvent(new CustomEvent('consentRevoked'));
    }, []);

    return {
        hasConsent,
        isEuVisitor,
        isLoaded,
        grantConsent,
        revokeConsent
    };
}

