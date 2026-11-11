/**
 * Cloudflare Turnstile Verification Utility (Phase 2)
 *
 * Verifies Turnstile challenge response tokens server-side using the Cloudflare Siteverify API.
 * Feature flag: ENABLE_TURNSTILE=false by default.
 */

const axios = require('axios');

const TURNSTILE_VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifies a Turnstile response token with Cloudflare's API.
 *
 * @param {string} token - The turnstile response token submitted from the client
 * @param {string} remoteIp - Visitor IP address
 * @returns {Promise<{ success: boolean, errorCodes?: string[], hostname?: string }>}
 */
async function verifyTurnstileToken(token, remoteIp = null) {
    const isEnabled = process.env.ENABLE_TURNSTILE === 'true';
    if (!isEnabled) {
        // If feature flag is off, treat verification as bypassed/successful
        return { success: true, bypassed: true };
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.warn('⚠️ Turnstile is enabled but TURNSTILE_SECRET_KEY is not configured.');
        return { success: false, errorCodes: ['missing_secret_key'] };
    }

    if (!token) {
        return { success: false, errorCodes: ['missing_input_token'] };
    }

    try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        if (remoteIp) {
            formData.append('remoteip', remoteIp);
        }

        const response = await axios.post(TURNSTILE_VERIFY_ENDPOINT, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 5000
        });

        const data = response.data || {};
        return {
            success: Boolean(data.success),
            errorCodes: data['error-codes'] || [],
            hostname: data.hostname,
            challengeTs: data.challenge_ts
        };
    } catch (err) {
        console.error('❌ Cloudflare Turnstile verification error:', err.message);
        return {
            success: false,
            errorCodes: ['verification_request_failed', err.message]
        };
    }
}

module.exports = {
    verifyTurnstileToken
};

