/**
 * Fraud Scoring Engine
 *
 * Implements rule-based, evidence-driven visitor & click scoring.
 * All scoring weights are defined in a single, centralized configuration object.
 *
 * Risk Levels:
 *   0 - 3 : Low
 *   4 - 6 : Medium
 *   7 +   : High
 */

const SCORING_RULES = Object.freeze({
    WEBDRIVER: 4,
    HEADLESS_UA: 4,
    SOFTWARE_WEBGL: 2,
    NO_LANGUAGES: 2,
    COUNTRY_MISMATCH: 1,
    TIMEZONE_MISMATCH: 1,
    NO_INTERACTION: 2,
    ACTIVE_TIME_UNDER_2S: 2,
    ROTATING_PROXY_CLUSTER: 4,
    GCLID_REUSE: 3
});

const HEADLESS_UA_REGEX = /HeadlessChrome|Headless|PhantomJS|Puppeteer|Playwright|Electron/i;
const SOFTWARE_WEBGL_REGEX = /swiftshader|llvmpipe|softpipe|mesa|software|rasterizer/i;

/**
 * Normalizes timezone string (e.g., 'America/New_York' vs 'EDT' or offset)
 */
function normalizeTimezone(tz) {
    if (!tz || typeof tz !== 'string') return '';
    return tz.trim().toLowerCase().replace(/_/g, '/');
}

/**
 * Calculates risk level from numerical score
 */
function getRiskLevel(score) {
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
}

/**
 * Calculates the fraud score for a visit based on collected signals, behaviour,
 * server context, and historical cluster data.
 *
 * @param {Object} params
 * @param {Object} params.signals - Client-collected bot & environment signals
 * @param {Object} params.behaviour - Client-collected interaction metrics
 * @param {boolean} params.isEndEvent - Whether this is an end/unload event or snapshot
 * @param {Object} params.serverInfo - Trusted server data (IP, country, cfTimezone, UA)
 * @param {Object} params.clusterData - Historical cluster check results ({ isCluster: boolean })
 * @param {boolean} params.gclidReuse - Whether the GCLID was seen in another visitId
 * @param {string} params.targetCountry - Target country code (default 'US')
 * @returns {{ score: number, why: string[], risk: 'Low'|'Medium'|'High' }}
 */
function calculateFraudScore({
    signals = {},
    behaviour = {},
    isEndEvent = false,
    serverInfo = {},
    clusterData = {},
    gclidReuse = false,
    targetCountry = 'US'
} = {}) {
    let score = 0;
    const why = [];

    // 1. navigator.webdriver (+4)
    if (signals.webdriver === true) {
        score += SCORING_RULES.WEBDRIVER;
        why.push('Automated browser detected via navigator.webdriver');
    }

    // 2. Headless User-Agent (+4)
    // Avoid double counting if client signals.headless and serverInfo.ua both detect headless
    const isHeadlessUa = Boolean(serverInfo.ua && HEADLESS_UA_REGEX.test(serverInfo.ua));
    const isHeadlessSignal = Boolean(signals.headless);

    if (isHeadlessUa || isHeadlessSignal) {
        score += SCORING_RULES.HEADLESS_UA;
        why.push('Headless browser User-Agent pattern detected');
    }

    // 3. Software WebGL (+2)
    const renderer = String(signals.webglRenderer || '');
    const vendor = String(signals.webglVendor || '');
    const isSoftwareWebgl =
        signals.softwareWebGL === true ||
        SOFTWARE_WEBGL_REGEX.test(renderer) ||
        SOFTWARE_WEBGL_REGEX.test(vendor);

    if (isSoftwareWebgl) {
        score += SCORING_RULES.SOFTWARE_WEBGL;
        why.push('Software WebGL rendering detected (potential virtualized/headless environment)');
    }

    // 4. Missing browser languages (+2)
    const hasLanguages = signals.hasLanguages !== false &&
        Array.isArray(signals.languages) &&
        signals.languages.length > 0;

    if (!hasLanguages) {
        score += SCORING_RULES.NO_LANGUAGES;
        why.push('Missing browser languages in navigator');
    }

    // 5. Country mismatch with TARGET_COUNTRY (+1) (Weak signal)
    const expectedCountry = String(targetCountry || 'US').toUpperCase();
    const visitorCountry = String(serverInfo.country || 'UNKNOWN').toUpperCase();

    if (visitorCountry !== 'UNKNOWN' && visitorCountry !== 'XX' && visitorCountry !== 'T1' && visitorCountry !== expectedCountry) {
        score += SCORING_RULES.COUNTRY_MISMATCH;
        why.push(`Visitor country (${visitorCountry}) does not match target country (${expectedCountry})`);
    }

    // 6. Browser timezone mismatch with Cloudflare timezone (+1) (Weak signal)
    const cfTz = normalizeTimezone(serverInfo.cfTimezone);
    const browserTz = normalizeTimezone(signals.timezone);

    if (cfTz && browserTz && cfTz !== browserTz) {
        score += SCORING_RULES.TIMEZONE_MISMATCH;
        why.push(`Browser timezone (${signals.timezone}) mismatch with Cloudflare timezone (${serverInfo.cfTimezone})`);
    }

    // 7 & 8. Behaviour Signals (ONLY evaluated on END events to prevent false positives during active navigation)
    if (isEndEvent) {
        const pointerMoves = Number(behaviour.pointerMoves || 0);
        const touchMoves = Number(behaviour.touchMoves || 0);
        const clicks = Number(behaviour.clicks || 0);
        const keyPresses = Number(behaviour.keyPresses || 0);
        const scrollEvents = Number(behaviour.scrollEvents || 0);
        const totalInteractions = pointerMoves + touchMoves + clicks + keyPresses + scrollEvents;

        // 7. No interaction after end event (+2)
        if (totalInteractions === 0) {
            score += SCORING_RULES.NO_INTERACTION;
            why.push('Zero user interaction recorded after session end');
        }

        // 8. Active visible time under 2 seconds (+2)
        const visibleTimeMs = Number(behaviour.visibleTimeMs || 0);
        if (visibleTimeMs < 2000) {
            score += SCORING_RULES.ACTIVE_TIME_UNDER_2S;
            why.push(`Active visible time under 2 seconds (${visibleTimeMs}ms)`);
        }
    }

    // 9. Rotating Proxy / Shared Fingerprint Cluster (+4)
    // Cluster condition: Same fingerprint seen across >=4 distinct IPs AND >=4 distinct click/visit identifiers
    if (clusterData && clusterData.isCluster === true) {
        score += SCORING_RULES.ROTATING_PROXY_CLUSTER;
        const details = `seen across ${clusterData.distinctIps || 4}+ distinct IPs and ${clusterData.distinctIds || 4}+ identifiers`;
        why.push(`Suspicious device cluster: fingerprint ${details} (potential rotating proxy)`);
    }

    // 10. Same GCLID reused by a different visitId (+3)
    if (gclidReuse === true) {
        score += SCORING_RULES.GCLID_REUSE;
        why.push('Duplicate GCLID reused across different visit IDs');
    }

    const risk = getRiskLevel(score);

    return {
        score,
        why,
        risk
    };
}

/**
 * Checks for rotating proxy cluster over the previous 24 hours.
 *
 * @param {Object} AdVisitModel - Mongoose model for AdVisit
 * @param {string} fpHash - Fingerprint SHA-256 hash
 * @param {string} currentIp - Current visitor IP
 * @param {string} currentVisitId - Current visit identifier
 * @param {string|null} currentGclid - Current GCLID (if any)
 * @param {string|null} brandId - Brand identifier (for multi-brand scoping)
 * @returns {Promise<{ isCluster: boolean, distinctIps: number, distinctIds: number }>}
 */
async function checkRotatingProxyCluster(AdVisitModel, {
    fpHash,
    currentIp,
    currentVisitId,
    currentGclid = null,
    brandId = null
}) {
    if (!fpHash || !AdVisitModel) {
        return { isCluster: false, distinctIps: 1, distinctIds: 1 };
    }

    try {
        const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const query = {
            fpHash,
            createdAt: { $gte: past24h }
        };

        if (brandId) {
            query.brandId = brandId;
        }

        const recentVisits = await AdVisitModel.find(query, {
            ip: 1,
            visitId: 1,
            gclid: 1
        }).lean().limit(100);

        const ipSet = new Set(recentVisits.map(v => v.ip));
        if (currentIp) ipSet.add(currentIp);

        const visitIdSet = new Set(recentVisits.map(v => v.visitId));
        if (currentVisitId) visitIdSet.add(currentVisitId);

        const gclids = recentVisits.map(v => v.gclid).filter(Boolean);
        if (currentGclid) gclids.push(currentGclid);
        const gclidSet = new Set(gclids);

        const distinctIps = ipSet.size;
        const distinctVisitIds = visitIdSet.size;
        const distinctGclids = gclidSet.size;

        // Cluster requirement:
        // Same fpHash appears across >= 4 distinct IPs AND
        // (if Google Ads GCLIDs available, >= 4 distinct GCLIDs; or >= 4 distinct visit IDs for general traffic)
        let isCluster = false;
        let distinctIds = distinctVisitIds;

        if (distinctIps >= 4) {
            if (distinctGclids >= 4) {
                isCluster = true;
                distinctIds = distinctGclids;
            } else if (distinctVisitIds >= 4) {
                isCluster = true;
                distinctIds = distinctVisitIds;
            }
        }

        return {
            isCluster,
            distinctIps,
            distinctIds
        };
    } catch (err) {
        console.warn('⚠️ Error checking rotating proxy cluster:', err.message);
        return { isCluster: false, distinctIps: 1, distinctIds: 1 };
    }
}

/**
 * Checks if a GCLID has been used by another distinct visitId.
 */
async function checkGclidReuse(AdVisitModel, currentGclid, currentVisitId) {
    if (!currentGclid || !currentVisitId || !AdVisitModel) {
        return false;
    }

    try {
        const existing = await AdVisitModel.findOne({
            gclid: currentGclid,
            visitId: { $ne: currentVisitId }
        }).select('_id').lean();

        return Boolean(existing);
    } catch (err) {
        console.warn('⚠️ Error checking GCLID reuse:', err.message);
        return false;
    }
}

module.exports = {
    SCORING_RULES,
    getRiskLevel,
    calculateFraudScore,
    checkRotatingProxyCluster,
    checkGclidReuse
};

