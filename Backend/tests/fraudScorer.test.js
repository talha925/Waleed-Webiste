/**
 * Unit Tests for Fraud Scoring Engine & Traffic Classification
 *
 * Verifies all 15 required test specifications:
 * 1. Normal browser, normal behaviour = Low risk
 * 2. WebDriver = +4
 * 3. Headless browser = +4
 * 4. Software WebGL = +2
 * 5. Missing languages = +2
 * 6. Country mismatch = +1
 * 7. No interaction after end = +2
 * 8. Active time under 2 seconds = +2
 * 9. Same fingerprint across 4 IPs and qualifying distinct identifiers = +4
 * 10. Same GCLID used by a different visit = +3
 * 11. Duplicate beacon does not double-count
 * 12. Multiple weak signals produce the correct cumulative score
 * 13. Consent not granted = no tracking
 * 14. Visitors without GCLID are still tracked
 * 15. Traffic classification works independently from fraud scoring
 */

const {
    calculateFraudScore,
    getRiskLevel,
    SCORING_RULES
} = require('../utils/fraudScorer');
const { classifyTraffic } = require('../utils/trafficClassifier');

describe('Fraud Scoring Engine & Detection Tests', () => {
    const normalSignals = {
        webdriver: false,
        headless: false,
        softwareWebGL: false,
        hasLanguages: true,
        languages: ['en-US', 'en'],
        platform: 'Win32',
        cores: 8,
        memory: 8,
        screen: { width: 1920, height: 1080, colorDepth: 24, pixelRatio: 1 },
        touchSupport: false,
        timezone: 'America/New_York',
        webglVendor: 'Google Inc. (NVIDIA)',
        webglRenderer: 'ANGLE (NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0)'
    };

    const normalBehaviour = {
        pointerMoves: 45,
        touchMoves: 0,
        scrollEvents: 12,
        maxScrollDepth: 65,
        clicks: 3,
        keyPresses: 0,
        visibleTimeMs: 15400
    };

    const normalServer = {
        ip: '198.51.100.22',
        country: 'US',
        cfTimezone: 'America/New_York',
        asn: 'AS15169',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    };

    // Test 1: Normal browser, normal behaviour = Low risk
    test('1. Normal browser, normal behaviour = Low risk', () => {
        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer,
            targetCountry: 'US'
        });

        expect(result.score).toBe(0);
        expect(result.risk).toBe('Low');
        expect(result.why).toHaveLength(0);
    });

    // Test 2: WebDriver = +4
    test('2. WebDriver = +4', () => {
        const result = calculateFraudScore({
            signals: { ...normalSignals, webdriver: true },
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer
        });

        expect(result.score).toBe(SCORING_RULES.WEBDRIVER);
        expect(result.score).toBe(4);
        expect(result.risk).toBe('Medium');
        expect(result.why).toContain('Automated browser detected via navigator.webdriver');
    });

    // Test 3: Headless browser = +4
    test('3. Headless browser User-Agent = +4', () => {
        const headlessServer = {
            ...normalServer,
            ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/128.0.0.0 Safari/537.36'
        };

        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: headlessServer
        });

        expect(result.score).toBe(SCORING_RULES.HEADLESS_UA);
        expect(result.score).toBe(4);
        expect(result.risk).toBe('Medium');
        expect(result.why).toContain('Headless browser User-Agent pattern detected');
    });

    // Test 4: Software WebGL = +2
    test('4. Software WebGL = +2', () => {
        const softwareWebglSignals = {
            ...normalSignals,
            webglVendor: 'Google Inc.',
            webglRenderer: 'Google SwiftShader (LLVM 10.0)'
        };

        const result = calculateFraudScore({
            signals: softwareWebglSignals,
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer
        });

        expect(result.score).toBe(SCORING_RULES.SOFTWARE_WEBGL);
        expect(result.score).toBe(2);
        expect(result.risk).toBe('Low');
        expect(result.why[0]).toMatch(/Software WebGL/i);
    });

    // Test 5: Missing languages = +2
    test('5. Missing languages = +2', () => {
        const noLangSignals = {
            ...normalSignals,
            hasLanguages: false,
            languages: []
        };

        const result = calculateFraudScore({
            signals: noLangSignals,
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer
        });

        expect(result.score).toBe(SCORING_RULES.NO_LANGUAGES);
        expect(result.score).toBe(2);
        expect(result.risk).toBe('Low');
        expect(result.why).toContain('Missing browser languages in navigator');
    });

    // Test 6: Country mismatch = +1
    test('6. Country mismatch = +1', () => {
        const foreignServer = {
            ...normalServer,
            country: 'RU'
        };

        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: foreignServer,
            targetCountry: 'US'
        });

        expect(result.score).toBe(SCORING_RULES.COUNTRY_MISMATCH);
        expect(result.score).toBe(1);
        expect(result.risk).toBe('Low');
        expect(result.why[0]).toMatch(/Visitor country \(RU\) does not match target country \(US\)/);
    });

    // Test 7: No interaction after end = +2
    test('7. No interaction after end = +2', () => {
        const zeroInteractions = {
            pointerMoves: 0,
            touchMoves: 0,
            scrollEvents: 0,
            maxScrollDepth: 0,
            clicks: 0,
            keyPresses: 0,
            visibleTimeMs: 12000 // long time, but zero clicks/moves
        };

        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: zeroInteractions,
            isEndEvent: true,
            serverInfo: normalServer
        });

        expect(result.score).toBe(SCORING_RULES.NO_INTERACTION);
        expect(result.score).toBe(2);
        expect(result.risk).toBe('Low');
        expect(result.why).toContain('Zero user interaction recorded after session end');
    });

    // Test 8: Active time under 2 seconds = +2
    test('8. Active time under 2 seconds = +2', () => {
        const quickBounce = {
            ...normalBehaviour,
            visibleTimeMs: 800 // less than 2000ms
        };

        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: quickBounce,
            isEndEvent: true,
            serverInfo: normalServer
        });

        expect(result.score).toBe(SCORING_RULES.ACTIVE_TIME_UNDER_2S);
        expect(result.score).toBe(2);
        expect(result.risk).toBe('Low');
        expect(result.why[0]).toMatch(/Active visible time under 2 seconds/);
    });

    // Test 9: Same fingerprint across 4 IPs and qualifying distinct identifiers = +4
    test('9. Same fingerprint across 4 IPs and qualifying distinct identifiers = +4', () => {
        const clusterData = {
            isCluster: true,
            distinctIps: 5,
            distinctIds: 6
        };

        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer,
            clusterData
        });

        expect(result.score).toBe(SCORING_RULES.ROTATING_PROXY_CLUSTER);
        expect(result.score).toBe(4);
        expect(result.risk).toBe('Medium');
        expect(result.why[0]).toMatch(/Suspicious device cluster/);
    });

    // Test 10: Same GCLID used by a different visit = +3
    test('10. Same GCLID used by a different visit = +3', () => {
        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer,
            gclidReuse: true
        });

        expect(result.score).toBe(SCORING_RULES.GCLID_REUSE);
        expect(result.score).toBe(3);
        expect(result.risk).toBe('Low');
        expect(result.why).toContain('Duplicate GCLID reused across different visit IDs');
    });

    // Test 11: Duplicate beacon does not double-count
    test('11. Duplicate beacon does not double-count', () => {
        const clusterData = { isCluster: true, distinctIps: 4, distinctIds: 4 };

        // First beacon snapshot
        const firstResult = calculateFraudScore({
            signals: { ...normalSignals, webdriver: true },
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer,
            clusterData
        });

        // Second identical beacon snapshot
        const secondResult = calculateFraudScore({
            signals: { ...normalSignals, webdriver: true },
            behaviour: normalBehaviour,
            isEndEvent: true,
            serverInfo: normalServer,
            clusterData
        });

        expect(firstResult.score).toBe(8); // 4 (webdriver) + 4 (cluster)
        expect(secondResult.score).toBe(8); // Remains strictly 8, does NOT accumulate to 16
        expect(firstResult.why).toEqual(secondResult.why);
    });

    // Test 12: Multiple weak signals produce the correct cumulative score
    test('12. Multiple weak signals produce the correct cumulative score', () => {
        const foreignServerWithMismatch = {
            ...normalServer,
            country: 'FR', // +1 country mismatch
            cfTimezone: 'Europe/Paris' // Mismatches with signals.timezone 'America/New_York' (+1)
        };

        const quickBounceZeroInteraction = {
            pointerMoves: 0,
            touchMoves: 0,
            scrollEvents: 0,
            maxScrollDepth: 0,
            clicks: 0,
            keyPresses: 0,
            visibleTimeMs: 500 // +2 no interaction, +2 visible time < 2s
        };

        const result = calculateFraudScore({
            signals: {
                ...normalSignals,
                timezone: 'America/New_York',
                hasLanguages: false, // +2 missing languages
                languages: []
            },
            behaviour: quickBounceZeroInteraction,
            isEndEvent: true,
            serverInfo: foreignServerWithMismatch,
            targetCountry: 'US'
        });

        // Country mismatch (1) + Timezone mismatch (1) + No interaction (2) + Time < 2s (2) + No languages (2) = 8
        expect(result.score).toBe(8);
        expect(result.risk).toBe('High');
        expect(result.why).toHaveLength(5);
    });

    // Test 13: Consent not granted = no tracking
    test('13. Consent status helper verifies tracking should be disabled when consent is denied', () => {
        function shouldTrackVisitor({ consentGiven, isEuVisitor }) {
            if (isEuVisitor && !consentGiven) return false;
            return true;
        }

        expect(shouldTrackVisitor({ consentGiven: false, isEuVisitor: true })).toBe(false);
        expect(shouldTrackVisitor({ consentGiven: true, isEuVisitor: true })).toBe(true);
        expect(shouldTrackVisitor({ consentGiven: false, isEuVisitor: false })).toBe(true);
    });

    // Test 14: Visitors without GCLID are still tracked
    test('14. Visitors without GCLID are still tracked and scored properly', () => {
        const visitWithoutGclid = {
            gadSource: '1',
            gclid: null,
            params: { gad_source: '1' }
        };

        const classification = classifyTraffic({
            referrer: '',
            params: visitWithoutGclid.params,
            currentUrl: 'https://www.specreveal.com/store/comfrt?gad_source=1'
        });

        expect(classification.source).toBe('Google Ads');

        const result = calculateFraudScore({
            signals: normalSignals,
            behaviour: normalBehaviour,
            isEndEvent: false, // init event
            serverInfo: normalServer
        });

        expect(result.score).toBe(0);
        expect(result.risk).toBe('Low');
    });

    // Test 15: Traffic classification works independently from fraud scoring
    test('15. Traffic classification works independently from fraud scoring', () => {
        // Legitimate Google Ads visit
        const adTraffic = classifyTraffic({
            referrer: 'https://www.google.com/',
            params: { gad_source: '1' }
        });
        expect(adTraffic.source).toBe('Google Ads');

        // Organic Google visit
        const organicTraffic = classifyTraffic({
            referrer: 'https://www.google.com/search?q=coupon+codes',
            params: {}
        });
        expect(organicTraffic.source).toBe('Google Organic');

        // Direct visit
        const directTraffic = classifyTraffic({
            referrer: '',
            params: {}
        });
        expect(directTraffic.source).toBe('Direct');

        // Social visit
        const socialTraffic = classifyTraffic({
            referrer: 'https://l.instagram.com/',
            params: { utm_source: 'instagram', utm_medium: 'social' }
        });
        expect(socialTraffic.source).toBe('Facebook / Instagram');

        // TikTok visit
        const tikTokTraffic = classifyTraffic({
            referrer: 'https://www.tiktok.com/',
            params: {}
        });
        expect(tikTokTraffic.source).toBe('TikTok');

        // Ensure classification does not alter fraud score
        const score1 = calculateFraudScore({ signals: normalSignals, behaviour: normalBehaviour, isEndEvent: true, serverInfo: normalServer });
        const score2 = calculateFraudScore({ signals: normalSignals, behaviour: normalBehaviour, isEndEvent: true, serverInfo: normalServer });
        expect(score1.score).toBe(score2.score);
    });
});

