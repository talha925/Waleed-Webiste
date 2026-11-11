/**
 * Traffic Classification Utility
 *
 * Categorizes visitors into distinct traffic acquisition channels:
 * - Google Ads
 * - Google Organic
 * - Bing Organic
 * - Other Search Engines
 * - Facebook / Instagram
 * - TikTok
 * - Email
 * - Referral
 * - Direct
 * - Unknown
 *
 * NOTE: Traffic classification is completely decoupled from fraud scoring.
 */

function classifyTraffic({ referrer = '', params = {}, currentUrl = '' } = {}) {
    const ref = (referrer || '').toLowerCase().trim();
    const p = params || {};

    const utmSource = (p.utm_source || '').toLowerCase().trim();
    const utmMedium = (p.utm_medium || '').toLowerCase().trim();
    const utmCampaign = (p.utm_campaign || '').toLowerCase().trim();

    const gadSource = p.gad_source;
    const gclid = p.gclid;
    const gbraid = p.gbraid;
    const wbraid = p.wbraid;
    const gadCampaignId = p.gad_campaignid;

    // Google ValueTrack parameters
    const kw = p.kw;
    const network = p.network;
    const device = p.device;
    const mt = p.mt;

    // 1. Google Ads Traffic
    // Detected through gclid, gad_source, gbraid, wbraid, ValueTrack, or explicit Google paid UTMs
    const isGooglePaidUtm =
        (utmSource.includes('google') || utmSource === 'adwords') &&
        ['cpc', 'ppc', 'paid', 'ad', 'paidsearch', 'cpm'].includes(utmMedium);

    const hasGoogleAdParam = Boolean(
        gclid ||
        gadSource ||
        gbraid ||
        wbraid ||
        gadCampaignId ||
        (network && ['g', 's', 'd', 'u', 'yt'].includes(String(network).toLowerCase())) ||
        (kw && device)
    );

    if (hasGoogleAdParam || isGooglePaidUtm) {
        return {
            source: 'Google Ads',
            medium: utmMedium || (gclid || gadSource ? 'cpc' : 'ad'),
            campaign: utmCampaign || (gadCampaignId ? `campaign_${gadCampaignId}` : null)
        };
    }

    // 2. Google Organic Search
    // Referrer from Google domains without paid ad indicators
    const isGoogleReferrer =
        ref.includes('google.') ||
        (!ref.includes('googleadservices.com') && ref.includes('google'));

    if (isGoogleReferrer && !hasGoogleAdParam && !isGooglePaidUtm) {
        return {
            source: 'Google Organic',
            medium: 'organic',
            campaign: utmCampaign || null
        };
    }

    // 3. Bing Organic Search
    if (ref.includes('bing.com') || ref.includes('msn.com')) {
        return {
            source: 'Bing Organic',
            medium: utmMedium || 'organic',
            campaign: utmCampaign || null
        };
    }

    // 4. Other Search Engines
    const otherSearchRegex = /(yahoo\.com|duckduckgo\.com|ecosia\.org|baidu\.com|yandex\.|ask\.com|qwant\.com|startpage\.com)/i;
    if (otherSearchRegex.test(ref) || utmMedium === 'organic') {
        return {
            source: 'Other Search Engines',
            medium: utmMedium || 'organic',
            campaign: utmCampaign || null
        };
    }

    // 5. Facebook / Instagram (Meta)
    const isMetaReferrer = /(facebook\.com|instagram\.com|fb\.com|l\.instagram\.com|l\.facebook\.com|m\.facebook\.com|lm\.facebook\.com)/i.test(ref);
    const isMetaUtm = ['facebook', 'instagram', 'fb', 'ig', 'meta'].some(s => utmSource.includes(s));
    if (isMetaReferrer || isMetaUtm) {
        return {
            source: 'Facebook / Instagram',
            medium: utmMedium || 'social',
            campaign: utmCampaign || null
        };
    }

    // 6. TikTok
    const isTikTokReferrer = ref.includes('tiktok.com');
    const isTikTokUtm = utmSource.includes('tiktok');
    if (isTikTokReferrer || isTikTokUtm) {
        return {
            source: 'TikTok',
            medium: utmMedium || 'social',
            campaign: utmCampaign || null
        };
    }

    // 7. Email Campaigns
    const isEmailUtm = ['email', 'newsletter'].includes(utmMedium) || ['email', 'newsletter', 'klaviyo', 'mailchimp', 'sendgrid'].some(s => utmSource.includes(s));
    if (isEmailUtm) {
        return {
            source: 'Email',
            medium: utmMedium || 'email',
            campaign: utmCampaign || null
        };
    }

    // 8. Direct Traffic
    // No referrer and no campaign parameters
    const hasAnyUtm = Boolean(utmSource || utmMedium || utmCampaign);
    const isSelfReferral = isInternalReferral(ref);

    if ((!ref || isSelfReferral) && !hasAnyUtm) {
        return {
            source: 'Direct',
            medium: 'none',
            campaign: null
        };
    }

    // 9. Referral Traffic
    // Any external referrer not caught above
    if (ref && !isSelfReferral) {
        let domain = ref;
        try {
            domain = new URL(ref).hostname;
        } catch {
            // Keep raw ref if not parseable
        }
        return {
            source: 'Referral',
            medium: utmMedium || 'referral',
            campaign: utmCampaign || domain
        };
    }

    // 10. Unknown
    return {
        source: 'Unknown',
        medium: utmMedium || 'unknown',
        campaign: utmCampaign || null
    };
}

/**
 * Checks if referrer matches internal website domains
 */
function isInternalReferral(referrer) {
    if (!referrer) return false;
    const internalDomains = [
        'pennyscroll.com',
        'specreveal.com',
        'blogzenix.com',
        'trendfiltered.com',
        'localhost',
        '127.0.0.1'
    ];
    return internalDomains.some(d => referrer.toLowerCase().includes(d));
}

module.exports = {
    classifyTraffic
};

