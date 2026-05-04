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

            // 1. Resolve Frontend URLs (Support multiple for Dev)
            const frontendUrls = [];
            
            // Always add localhost in dev
            if (isDev) {
                frontendUrls.push('http://localhost:3000');
            }

            // Add brand-specific production URL
            let productionUrl;
            if (brandId === 'blogzenix') {
                productionUrl = process.env.BLOGZENIX_FRONTEND_URL;
            } else if (brandId === 'pennyscroll') {
                productionUrl = process.env.PENNYSCROLL_FRONTEND_URL;
            }

            if (productionUrl && !frontendUrls.includes(productionUrl)) {
                frontendUrls.push(productionUrl);
            }

            // Fallback
            if (frontendUrls.length === 0 && process.env.FRONTEND_URL) {
                frontendUrls.push(process.env.FRONTEND_URL);
            }

            if (frontendUrls.length === 0) {
                console.error(`❌ No FRONTEND_URL found for brand: ${brandId || 'global'}. Revalidation aborted.`);
                return { success: false, error: 'Frontend URL missing' };
            }

            // 2. Resolve Secret based on brand
            let secret;
            if (brandId === 'blogzenix') {
                secret = process.env.BLOGZENIX_REVALIDATE_SECRET;
            } else if (brandId === 'pennyscroll') {
                secret = process.env.PENNYSCROLL_REVALIDATE_SECRET;
            }

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

            console.log(`📡 Triggering frontend revalidation for ${type}: ${identifier} on ${frontendUrls.length} targets`);

            // 3. Trigger all revalidation requests in parallel
            const results = await Promise.allSettled(frontendUrls.map(async (url) => {
                const endpoint = `${url}/api/revalidate`;
                try {
                    const res = await axios.post(endpoint, payload, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${secret}`
                        },
                        timeout: 5000
                    });
                    console.log(`✅ Success: ${url} revalidated for ${type}`);
                    return { url, success: true, status: res.status };
                } catch (err) {
                    console.warn(`⚠️ Failed: ${url} revalidation failed (${err.message})`);
                    return { url, success: false, error: err.message };
                }
            }));

            const allSuccessful = results.every(r => r.status === 'fulfilled' && r.value.success);
            return { 
                success: allSuccessful, 
                targets: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Rejected' }) 
            };
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
