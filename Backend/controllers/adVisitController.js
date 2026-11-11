/**
 * AdVisit Controller
 *
 * Handles visitor tracking, bot detection signal processing, behaviour snapshots,
 * and fraud scoring calculation.
 */

const { getAdVisitModel } = require('../models/AdVisit');
const {
    calculateFraudScore,
    checkRotatingProxyCluster,
    checkGclidReuse
} = require('../utils/fraudScorer');
const { classifyTraffic } = require('../utils/trafficClassifier');

// Maximum allowed lengths for sanitization
const MAX_STR_LEN = {
    ID: 100,
    URL: 2000,
    PARAM: 250,
    SIG: 100
};

/**
 * Strips dangerous characters and ensures input is a safe, bounded string
 */
function sanitizeString(val, maxLen = 250) {
    if (val === null || val === undefined) return null;
    let str = String(val).trim();
    // Prevent NoSQL injection tokens
    if (str.startsWith('$')) {
        str = str.replace(/^\$+/, '');
    }
    return str.slice(0, maxLen);
}

/**
 * Parses and validates incoming payload
 */
function parseAndValidatePayload(rawBody) {
    if (!rawBody) {
        throw new Error('Empty request payload');
    }

    let parsed;
    if (typeof rawBody === 'string') {
        try {
            parsed = JSON.parse(rawBody);
        } catch {
            throw new Error('Malformed JSON payload');
        }
    } else if (typeof rawBody === 'object') {
        parsed = rawBody;
    } else {
        throw new Error('Invalid request content type');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Payload must be a JSON object');
    }

    const event = sanitizeString(parsed.event, 20);
    if (!['init', 'end', 'snapshot'].includes(event)) {
        throw new Error('Invalid event type. Must be init, end, or snapshot');
    }

    const visitId = sanitizeString(parsed.visitId, MAX_STR_LEN.ID);
    if (!visitId) {
        throw new Error('Missing or invalid visitId');
    }

    const fpHash = sanitizeString(parsed.fpHash, 64);
    if (!fpHash) {
        throw new Error('Missing or invalid fpHash');
    }

    // Whitelist and sanitize params
    const rawParams = parsed.params || {};
    const sanitizedParams = {
        kw: sanitizeString(rawParams.kw, MAX_STR_LEN.PARAM),
        network: sanitizeString(rawParams.network, MAX_STR_LEN.PARAM),
        device: sanitizeString(rawParams.device, MAX_STR_LEN.PARAM),
        mt: sanitizeString(rawParams.mt, MAX_STR_LEN.PARAM),
        utm_source: sanitizeString(rawParams.utm_source, MAX_STR_LEN.PARAM),
        utm_medium: sanitizeString(rawParams.utm_medium, MAX_STR_LEN.PARAM),
        utm_campaign: sanitizeString(rawParams.utm_campaign, MAX_STR_LEN.PARAM),
        utm_content: sanitizeString(rawParams.utm_content, MAX_STR_LEN.PARAM),
        utm_term: sanitizeString(rawParams.utm_term, MAX_STR_LEN.PARAM)
    };

    // Whitelist and sanitize signals
    const rawSig = parsed.signals || {};
    const sanitizedSignals = {
        webdriver: Boolean(rawSig.webdriver),
        headless: Boolean(rawSig.headless),
        softwareWebGL: Boolean(rawSig.softwareWebGL),
        hasLanguages: rawSig.hasLanguages !== false,
        languages: Array.isArray(rawSig.languages)
            ? rawSig.languages.slice(0, 10).map(l => sanitizeString(l, 20)).filter(Boolean)
            : [],
        platform: sanitizeString(rawSig.platform, MAX_STR_LEN.SIG) || '',
        cores: Math.max(0, Math.min(256, Number(rawSig.cores) || 0)),
        memory: Math.max(0, Math.min(512, Number(rawSig.memory) || 0)),
        screen: {
            width: Math.max(0, Math.min(10000, Number(rawSig.screen?.width) || 0)),
            height: Math.max(0, Math.min(10000, Number(rawSig.screen?.height) || 0)),
            colorDepth: Math.max(0, Math.min(64, Number(rawSig.screen?.colorDepth) || 0)),
            pixelRatio: Math.max(0.1, Math.min(10, Number(rawSig.screen?.pixelRatio) || 1))
        },
        touchSupport: Boolean(rawSig.touchSupport),
        timezone: sanitizeString(rawSig.timezone, MAX_STR_LEN.SIG) || '',
        webglVendor: sanitizeString(rawSig.webglVendor, MAX_STR_LEN.SIG) || '',
        webglRenderer: sanitizeString(rawSig.webglRenderer, MAX_STR_LEN.SIG) || ''
    };

    // Whitelist and sanitize behaviour
    const rawBeh = parsed.behaviour || {};
    const sanitizedBehaviour = {
        pointerMoves: Math.max(0, Math.min(1000000, Number(rawBeh.pointerMoves) || 0)),
        touchMoves: Math.max(0, Math.min(1000000, Number(rawBeh.touchMoves) || 0)),
        scrollEvents: Math.max(0, Math.min(1000000, Number(rawBeh.scrollEvents) || 0)),
        maxScrollDepth: Math.max(0, Math.min(100, Number(rawBeh.maxScrollDepth) || 0)),
        clicks: Math.max(0, Math.min(100000, Number(rawBeh.clicks) || 0)),
        keyPresses: Math.max(0, Math.min(100000, Number(rawBeh.keyPresses) || 0)),
        visibleTimeMs: Math.max(0, Math.min(86400000, Number(rawBeh.visibleTimeMs) || 0))
    };

    return {
        event,
        visitId,
        fpHash,
        brandId: sanitizeString(parsed.brandId, 50),
        gclid: sanitizeString(parsed.gclid || rawParams.gclid, MAX_STR_LEN.PARAM),
        gadSource: sanitizeString(parsed.gadSource || rawParams.gad_source, 20),
        referrer: sanitizeString(parsed.referrer, MAX_STR_LEN.URL) || '',
        path: sanitizeString(parsed.path, MAX_STR_LEN.URL) || '/',
        landingPage: sanitizeString(parsed.landingPage, MAX_STR_LEN.URL) || '/',
        params: sanitizedParams,
        signals: sanitizedSignals,
        behaviour: sanitizedBehaviour
    };
}

/**
 * Checks if the request comes from an exempted owner/testing IP
 */
function isOwnerIp(clientIp) {
    const rawOwnIps = process.env.OWN_IPS || '';
    if (!rawOwnIps || !clientIp) return false;

    const ownIps = rawOwnIps
        .split(',')
        .map(ip => ip.trim())
        .filter(Boolean);

    return ownIps.includes(clientIp);
}

/**
 * Main Controller Handler for POST /api/ad-visit
 */
async function recordAdVisit(req, res) {
    try {
        // 1. Validate and parse payload
        let validated;
        try {
            validated = parseAndValidatePayload(req.body);
        } catch (valErr) {
            return res.status(400).json({ error: valErr.message });
        }

        // 2. Extract strictly server-side verified headers (NEVER trust client inputs for these)
        const clientIp = (
            req.headers['cf-connecting-ip'] ||
            req.ip ||
            req.connection?.remoteAddress ||
            '127.0.0.1'
        ).trim();

        // Check OWN_IPS exclusion
        if (isOwnerIp(clientIp)) {
            return res.status(200).json({
                status: 'ignored',
                reason: 'own_ip_excluded'
            });
        }

        const country = (req.headers['cf-ipcountry'] || 'UNKNOWN').trim().toUpperCase();
        const cfTimezone = req.headers['cf-timezone'] ? String(req.headers['cf-timezone']).trim() : null;
        const asn = req.headers['x-client-asn'] ? String(req.headers['x-client-asn']).trim() : null;
        const ua = req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 500) : '';

        // 3. Resolve Brand & Tenant Model
        const brandId = req.brand?.brandId || validated.brandId || 'pennyscroll';
        const AdVisitModel = req.models?.AdVisit || getAdVisitModel(req.db);

        // 4. Traffic Classification (Independent from fraud scoring)
        const classification = classifyTraffic({
            referrer: validated.referrer,
            params: {
                ...validated.params,
                gclid: validated.gclid,
                gad_source: validated.gadSource
            },
            currentUrl: validated.landingPage
        });

        // 5. Check historical cluster and GCLID reuse
        const isEndEvent = validated.event === 'end' || validated.event === 'snapshot';
        const targetCountry = process.env.TARGET_COUNTRY || 'US';

        const [clusterData, gclidReuse] = await Promise.all([
            checkRotatingProxyCluster(AdVisitModel, {
                fpHash: validated.fpHash,
                currentIp: clientIp,
                currentVisitId: validated.visitId,
                currentGclid: validated.gclid,
                brandId
            }),
            checkGclidReuse(AdVisitModel, validated.gclid, validated.visitId)
        ]);

        // 6. Calculate Fraud Score
        const serverInfo = {
            ip: clientIp,
            country,
            cfTimezone,
            asn,
            ua
        };

        const scoringResult = calculateFraudScore({
            signals: validated.signals,
            behaviour: validated.behaviour,
            isEndEvent,
            serverInfo,
            clusterData,
            gclidReuse,
            targetCountry
        });

        // 7. Upsert Evidence Record in MongoDB
        // Recalculates and replaces score/behaviour without double-counting on multiple snapshots
        const updateData = {
            $set: {
                brandId,
                gclid: validated.gclid,
                gadSource: validated.gadSource,
                trafficSource: classification.source,
                trafficMedium: classification.medium,
                trafficCampaign: classification.campaign,
                referrer: validated.referrer,
                ip: clientIp,
                country,
                cfTimezone,
                asn,
                ua,
                path: validated.path,
                landingPage: validated.landingPage,
                params: validated.params,
                fpHash: validated.fpHash,
                signals: validated.signals,
                behaviour: validated.behaviour,
                behaviourSeen: isEndEvent || Boolean(validated.behaviour.visibleTimeMs > 0),
                score: scoringResult.score,
                why: scoringResult.why,
                risk: scoringResult.risk,
                updatedAt: new Date()
            },
            $setOnInsert: {
                visitId: validated.visitId,
                createdAt: new Date()
            }
        };

        await AdVisitModel.updateOne(
            { visitId: validated.visitId },
            updateData,
            { upsert: true }
        );

        return res.status(200).json({
            status: 'recorded',
            visitId: validated.visitId,
            risk: scoringResult.risk,
            score: scoringResult.score,
            trafficSource: classification.source
        });
    } catch (err) {
        console.error('❌ Error recording ad visit:', err);
        return res.status(500).json({ error: 'Internal server error recording visit' });
    }
}

/**
 * Escapes CSV values and neutralizes formula injection
 */
function escapeCsv(cell) {
    if (cell === null || cell === undefined) return '';
    let str = String(cell);
    if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
    }
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCsvLine(row) {
    return row.map(escapeCsv).join(',');
}

/**
 * Admin: Get Overview Statistics (Super-Admin Only)
 */
async function getAdminStats(req, res) {
    try {
        const AdVisitModel = req.models?.AdVisit || getAdVisitModel(req.db);
        const { brandId, days = 7 } = req.query;

        const match = {
            createdAt: { $gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000) }
        };
        if (brandId && brandId !== 'all') {
            match.brandId = brandId.toLowerCase().trim();
        }

        const [counts, brandBreakdown, trafficBreakdown, topIps] = await Promise.all([
            // Risk breakdown
            AdVisitModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$risk',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Brand breakdown
            AdVisitModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$brandId',
                        count: { $sum: 1 },
                        highRisk: {
                            $sum: { $cond: [{ $eq: ['$risk', 'High'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            // Traffic Source breakdown
            AdVisitModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$trafficSource',
                        count: { $sum: 1 },
                        highRisk: {
                            $sum: { $cond: [{ $eq: ['$risk', 'High'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            // Top suspicious IPs
            AdVisitModel.aggregate([
                { $match: { ...match, score: { $gte: 4 } } },
                {
                    $group: {
                        _id: '$ip',
                        hits: { $sum: 1 },
                        maxScore: { $max: '$score' },
                        country: { $first: '$country' },
                        trafficSource: { $first: '$trafficSource' },
                        reasons: { $addToSet: '$why' }
                    }
                },
                { $sort: { maxScore: -1, hits: -1 } },
                { $limit: 5 }
            ])
        ]);

        let totalVisits = 0;
        let highRisk = 0;
        let mediumRisk = 0;
        let lowRisk = 0;

        for (const item of counts) {
            totalVisits += item.count;
            if (item._id === 'High') highRisk = item.count;
            if (item._id === 'Medium') mediumRisk = item.count;
            if (item._id === 'Low') lowRisk = item.count;
        }

        res.status(200).json({
            status: 'success',
            days: Number(days),
            totalVisits,
            highRisk,
            mediumRisk,
            lowRisk,
            brandBreakdown,
            trafficBreakdown,
            topIps: topIps.map(ip => ({
                ip: ip._id,
                hits: ip.hits,
                maxScore: ip.maxScore,
                country: ip.country,
                trafficSource: ip.trafficSource,
                reasons: Array.from(new Set([].concat(...ip.reasons))).filter(Boolean).slice(0, 3)
            }))
        });
    } catch (err) {
        console.error('❌ Admin stats error:', err);
        res.status(500).json({ error: 'Failed to retrieve fraud stats' });
    }
}

/**
 * Admin: Get Paginated Visits with Filter & Sort (Super-Admin Only)
 */
async function getAdminVisits(req, res) {
    try {
        const AdVisitModel = req.models?.AdVisit || getAdVisitModel(req.db);
        const {
            brandId,
            risk,
            trafficSource,
            minScore,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 25
        } = req.query;

        const query = {};

        if (brandId && brandId !== 'all') {
            query.brandId = brandId.toLowerCase().trim();
        }
        if (risk && risk !== 'all') {
            query.risk = risk;
        }
        if (trafficSource && trafficSource !== 'all') {
            query.trafficSource = trafficSource;
        }
        if (minScore) {
            query.score = { $gte: Number(minScore) };
        }
        if (search) {
            const cleanSearch = String(search).trim();
            query.$or = [
                { ip: { $regex: cleanSearch, $options: 'i' } },
                { visitId: { $regex: cleanSearch, $options: 'i' } },
                { gclid: { $regex: cleanSearch, $options: 'i' } },
                { path: { $regex: cleanSearch, $options: 'i' } }
            ];
        }

        const pageNum = Math.max(1, Number(page) || 1);
        const pageLimit = Math.min(100, Math.max(5, Number(limit) || 25));
        const skip = (pageNum - 1) * pageLimit;

        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [visits, total] = await Promise.all([
            AdVisitModel.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(pageLimit)
                .lean(),
            AdVisitModel.countDocuments(query)
        ]);

        res.status(200).json({
            status: 'success',
            page: pageNum,
            limit: pageLimit,
            total,
            totalPages: Math.ceil(total / pageLimit) || 1,
            visits
        });
    } catch (err) {
        console.error('❌ Admin visits error:', err);
        res.status(500).json({ error: 'Failed to retrieve visitor records' });
    }
}

/**
 * Admin: Get Rotating Proxy Clusters (Super-Admin Only)
 */
async function getAdminClusters(req, res) {
    try {
        const AdVisitModel = req.models?.AdVisit || getAdVisitModel(req.db);
        const { brandId, days = 7, minDistinctIps = 4 } = req.query;

        const match = {
            createdAt: { $gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000) }
        };
        if (brandId && brandId !== 'all') {
            match.brandId = brandId.toLowerCase().trim();
        }

        const clusters = await AdVisitModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$fpHash',
                    visits: { $sum: 1 },
                    ips: { $addToSet: '$ip' },
                    gclids: { $addToSet: '$gclid' },
                    avgScore: { $avg: '$score' },
                    maxScore: { $max: '$score' },
                    countries: { $addToSet: '$country' },
                    trafficSources: { $addToSet: '$trafficSource' },
                    brands: { $addToSet: '$brandId' }
                }
            },
            {
                $project: {
                    fpHash: '$_id',
                    visits: 1,
                    distinctIPs: { $size: '$ips' },
                    distinctGclids: {
                        $size: {
                            $filter: {
                                input: '$gclids',
                                as: 'g',
                                cond: { $and: [{ $ne: ['$$g', null] }, { $ne: ['$$g', ''] }] }
                            }
                        }
                    },
                    avgScore: { $round: ['$avgScore', 1] },
                    maxScore: 1,
                    countries: 1,
                    trafficSources: 1,
                    brands: 1
                }
            },
            {
                $match: {
                    distinctIPs: { $gte: Number(minDistinctIps) }
                }
            },
            { $sort: { distinctIPs: -1, visits: -1 } }
        ]);

        res.status(200).json({
            status: 'success',
            totalClusters: clusters.length,
            clusters
        });
    } catch (err) {
        console.error('❌ Admin clusters error:', err);
        res.status(500).json({ error: 'Failed to retrieve device clusters' });
    }
}

/**
 * Admin: One-Click CSV Export Download (Super-Admin Only)
 */
async function exportAdminCsv(req, res) {
    try {
        const AdVisitModel = req.models?.AdVisit || getAdVisitModel(req.db);
        const { type = 'ips', brandId, days = 7, minScore = 7 } = req.query;

        const match = {
            createdAt: { $gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000) }
        };
        if (brandId && brandId !== 'all') {
            match.brandId = brandId.toLowerCase().trim();
        }

        let filename = `suspicious-${type}-${Date.now()}.csv`;
        let csvContent = '';

        if (type === 'ips') {
            const ipPipeline = [
                { $match: { ...match, score: { $gte: Number(minScore) } } },
                {
                    $group: {
                        _id: '$ip',
                        hits: { $sum: 1 },
                        maxScore: { $max: '$score' },
                        country: { $first: '$country' },
                        asn: { $first: '$asn' },
                        reasons: { $addToSet: '$why' },
                        first: { $min: '$createdAt' },
                        last: { $max: '$createdAt' },
                        trafficSources: { $addToSet: '$trafficSource' }
                    }
                },
                { $sort: { maxScore: -1, hits: -1 } }
            ];

            const results = await AdVisitModel.aggregate(ipPipeline);
            const headers = ['ip', 'hits', 'maxScore', 'country', 'asn', 'reasons', 'first', 'last', 'trafficSource'];
            const rows = [toCsvLine(headers)];

            for (const r of results) {
                const flatReasons = Array.from(new Set([].concat(...r.reasons))).filter(Boolean).join('; ');
                rows.push(toCsvLine([
                    r._id,
                    r.hits,
                    r.maxScore,
                    r.country || 'UNKNOWN',
                    r.asn || '',
                    flatReasons,
                    r.first ? new Date(r.first).toISOString() : '',
                    r.last ? new Date(r.last).toISOString() : '',
                    (r.trafficSources || []).join('; ')
                ]));
            }
            csvContent = rows.join('\n');
            filename = `suspicious-ips-${brandId || 'all'}.csv`;

        } else if (type === 'clusters') {
            const clusterPipeline = [
                { $match: match },
                {
                    $group: {
                        _id: '$fpHash',
                        visits: { $sum: 1 },
                        ips: { $addToSet: '$ip' },
                        gclids: { $addToSet: '$gclid' },
                        avgScore: { $avg: '$score' },
                        countries: { $addToSet: '$country' },
                        trafficSources: { $addToSet: '$trafficSource' }
                    }
                },
                {
                    $project: {
                        fpHash: '$_id',
                        visits: 1,
                        distinctIPs: { $size: '$ips' },
                        distinctGclids: {
                            $size: {
                                $filter: {
                                    input: '$gclids',
                                    as: 'g',
                                    cond: { $and: [{ $ne: ['$$g', null] }, { $ne: ['$$g', ''] }] }
                                }
                            }
                        },
                        avgScore: { $round: ['$avgScore', 2] },
                        countries: 1,
                        trafficSources: 1
                    }
                },
                { $match: { distinctIPs: { $gte: 5 } } },
                { $sort: { distinctIPs: -1, visits: -1 } }
            ];

            const results = await AdVisitModel.aggregate(clusterPipeline);
            const headers = ['fpHash', 'visits', 'distinctIPs', 'distinctGclids', 'avgScore', 'countries', 'trafficSources'];
            const rows = [toCsvLine(headers)];

            for (const c of results) {
                rows.push(toCsvLine([
                    c.fpHash,
                    c.visits,
                    c.distinctIPs,
                    c.distinctGclids,
                    c.avgScore,
                    (c.countries || []).join('; '),
                    (c.trafficSources || []).join('; ')
                ]));
            }
            csvContent = rows.join('\n');
            filename = `device-clusters-${brandId || 'all'}.csv`;

        } else if (type === 'gclids') {
            const gclids = await AdVisitModel.find({
                ...match,
                gclid: { $ne: null, $exists: true, $nin: ['', null] },
                score: { $gte: Number(minScore) }
            }).sort({ score: -1, createdAt: -1 }).lean();

            const headers = ['time', 'gclid', 'ip', 'country', 'score', 'reasons', 'kw', 'network', 'device', 'trafficSource'];
            const rows = [toCsvLine(headers)];

            for (const g of gclids) {
                rows.push(toCsvLine([
                    g.createdAt ? new Date(g.createdAt).toISOString() : '',
                    g.gclid,
                    g.ip,
                    g.country || 'UNKNOWN',
                    g.score,
                    (g.why || []).join('; '),
                    g.params?.kw || '',
                    g.params?.network || '',
                    g.params?.device || '',
                    g.trafficSource || 'Google Ads'
                ]));
            }
            csvContent = rows.join('\n');
            filename = `suspicious-gclids-${brandId || 'all'}.csv`;
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
    } catch (err) {
        console.error('❌ Admin CSV export error:', err);
        res.status(500).json({ error: 'Failed to generate CSV export' });
    }
}

module.exports = {
    recordAdVisit,
    getAdminStats,
    getAdminVisits,
    getAdminClusters,
    exportAdminCsv,
    sanitizeString,
    parseAndValidatePayload
};

