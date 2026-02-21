const axios = require('axios');
const { callWithCircuitBreaker } = require('../lib/circuitBreaker');

/**
 * Call frontend revalidation endpoint to refresh Next.js cache
 * @param {String} type - Type of revalidation (store, coupon, blog)
 * @param {String} identifier - Slug or ID
 * @param {Object} metadata - Additional metadata for revalidation
 */
const callFrontendRevalidation = async (type, identifier, metadata = {}) => {
    return await callWithCircuitBreaker(
        'frontend',
        async () => {
            const isDev = process.env.NODE_ENV === 'development';
            let frontendUrl = process.env.FRONTEND_URL;

            // For local development, prioritize localhost if FRONTEND_URL looks like production
            if (isDev && (!frontendUrl || frontendUrl.includes('pennyscroll.com'))) {
                frontendUrl = 'http://localhost:3000';
            } else if (!frontendUrl) {
                frontendUrl = 'http://localhost:3000';
            }

            const revalidationEndpoint = `${frontendUrl}/api/revalidate`;

            // Use NEXT_REVALIDATE_SECRET as primary, REVALIDATION_SECRET as fallback
            const secret = process.env.NEXT_REVALIDATE_SECRET || process.env.REVALIDATION_SECRET || 'default-secret';

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
