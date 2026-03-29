const axios = require('axios');
const { callWithCircuitBreaker } = require('../lib/circuitBreaker');

/**
 * Call frontend revalidation endpoint to refresh Next.js cache
 * @param {String} type - Type of revalidation (store, coupon, blog)
 * @param {String} identifier - Slug or ID
 * @param {String} brandId - (Optional) Brand identifier to find specific secret/URL
 * @param {Object} metadata - Additional metadata for revalidation
 */
const callFrontendRevalidation = async (type, identifier, brandId = null, metadata = {}) => {
    return await callWithCircuitBreaker(
        'frontend',
        async () => {
            const isDev = process.env.NODE_ENV === 'development';

            // 1. Resolve Frontend URL based on brand
            let frontendUrl;

            if (brandId === 'blogzenix') {
                frontendUrl = process.env.BLOGZENIX_FRONTEND_URL;
            } else if (brandId === 'pennyscroll') {
                frontendUrl = process.env.PENNYSCROLL_FRONTEND_URL;
            }

            // Global fallback for any older code not passing brandId
            if (!frontendUrl) frontendUrl = process.env.FRONTEND_URL;

            // For local development, prioritize localhost ONLY IF no brand URL was resolved
            if (isDev && !frontendUrl) {
                frontendUrl = 'http://localhost:3000';
            }

            if (!frontendUrl) {
                console.error(`❌ No FRONTEND_URL found for brand: ${brandId || 'global'}. Revalidation aborted.`);
                return { success: false, error: 'Frontend URL missing' };
            }

            const revalidationEndpoint = `${frontendUrl}/api/revalidate`;

            // 2. Resolve Secret based on brand
            let secret;

            if (brandId === 'blogzenix') {
                secret = process.env.BLOGZENIX_REVALIDATE_SECRET;
            } else if (brandId === 'pennyscroll') {
                secret = process.env.PENNYSCROLL_REVALIDATE_SECRET;
            }

            // Fallback for global context
            if (!secret) secret = process.env.NEXT_REVALIDATE_SECRET || process.env.REVALIDATION_SECRET;

            if (!secret) {
                console.error(`❌ No secret key found for revalidation of brand: ${brandId || 'global'}`);
                return { success: false, error: 'Secret missing' };
            }

            const payload = {
                type,
                identifier,
                timestamp: new Date().toISOString(),
                ...metadata
            };

            console.log(`📡 Triggering frontend revalidation for ${type}: ${identifier}`);

            const response = await axios.post(revalidationEndpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${secret}`
                },
                timeout: 5000
            });

            if (response.status >= 200 && response.status < 300) {
                console.log(`✅ Frontend revalidation successful for ${type}: ${identifier}`);
                return { success: true, result: response.data };
            } else {
                console.warn(`⚠️ Frontend revalidation failed for ${type}: ${identifier} (HTTP ${response.status})`);
                return { success: false, error: `HTTP ${response.status}` };
            }
        },
        async () => {
            console.warn(`⚠️ Frontend revalidation circuit breaker open for ${type}: ${identifier}`);
            return { success: false, circuitBreakerOpen: true };
        }
    );
};

module.exports = {
    callFrontendRevalidation
};
