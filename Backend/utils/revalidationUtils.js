const axios = require('axios');
const { callWithCircuitBreaker } = require('../lib/circuitBreaker');

// 🚀 REVALIDATION AGGREGATOR
// Prevents slamming the frontend with 50+ requests during bulk updates.
// Stores pending revalidations by key (type:identifier:brandId)
const pendingRevalidations = new Map();
const DEBOUNCE_MS = 2000; // 2 seconds delay to aggregate bursts

/**
 * Call frontend revalidation endpoint to refresh Next.js cache
 * @param {String} type - Type of revalidation (store, coupon, blog)
 * @param {String} identifier - Slug or ID
 * @param {String} brandId - (Optional) Brand identifier to find specific secret/URL
 * @param {Object} metadata - Additional metadata for revalidation
 */
const callFrontendRevalidation = async (type, identifier, brandId = null, metadata = {}) => {
    const key = `${type}:${identifier}:${brandId || 'global'}`;

    // If there's already a pending revalidation for this target, just update the metadata
    if (pendingRevalidations.has(key)) {
        const existing = pendingRevalidations.get(key);
        existing.metadata = { ...existing.metadata, ...metadata };
        console.log(`⏱️ Aggregating revalidation for ${key}...`);
        return existing.promise;
    }

    // Create a new deferred promise
    let resolveFn, rejectFn;
    const promise = new Promise((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
    });

    const task = {
        type,
        identifier,
        brandId,
        metadata,
        promise,
        timeout: setTimeout(async () => {
            try {
                const result = await executeRevalidation(type, identifier, brandId, task.metadata);
                pendingRevalidations.delete(key);
                resolveFn(result);
            } catch (err) {
                pendingRevalidations.delete(key);
                rejectFn(err);
            }
        }, DEBOUNCE_MS)
    };

    pendingRevalidations.set(key, task);
    return promise;
};

/**
 * Internal execution logic for revalidation
 */
const executeRevalidation = async (type, identifier, brandId, metadata) => {
    return await callWithCircuitBreaker(
        'frontend',
        async () => {
            const isDev = process.env.NODE_ENV === 'development';

            // 1. Resolve Frontend URLs
            const frontendUrls = [];
            
            // Always add localhost in dev
            if (isDev) {
                frontendUrls.push('http://localhost:3000');
            }

            // Determine production URL from environment variables
            // Try brand-specific first, then generic fallback
            let productionUrl = null;
            if (brandId) {
                const upperBrand = brandId.toUpperCase();
                productionUrl = process.env[`${upperBrand}_FRONTEND_URL`] || process.env.FRONTEND_URL;
            } else {
                productionUrl = process.env.FRONTEND_URL;
            }

            // Clean up and add the URL
            if (productionUrl && productionUrl.startsWith('http')) {
                // Ensure no trailing slash
                const cleanUrl = productionUrl.replace(/\/$/, '');
                if (!frontendUrls.includes(cleanUrl)) {
                    frontendUrls.push(cleanUrl);
                }
            }

            // Extra check: if we are in production and still only have localhost, 
            // we have a config problem. Try to infer from common brand domains if needed.
            if (!isDev && (frontendUrls.length === 0 || frontendUrls.every(u => u.includes('localhost')))) {
                if (brandId === 'blogzenix') frontendUrls.push('https://www.blogzenix.com');
                if (brandId === 'pennyscroll') frontendUrls.push('https://pennyscroll.com');
            }

            if (frontendUrls.length === 0) {
                console.error(`❌ No FRONTEND_URL found for brand: ${brandId || 'global'}. Revalidation aborted.`);
                return { success: false, error: 'Frontend URL missing' };
            }

            // 2. Resolve Secret based on brand
            let secret = null;
            if (brandId) {
                const upperBrand = brandId.toUpperCase();
                secret = process.env[`${upperBrand}_REVALIDATE_SECRET`];
            }
            
            if (!secret) {
                secret = process.env.NEXT_REVALIDATE_SECRET || process.env.REVALIDATION_SECRET;
            }

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

            console.log(`📡 [DEBOUNCED] Triggering frontend revalidation for ${type}: ${identifier} on ${frontendUrls.length} targets: ${frontendUrls.join(', ')}`);

            // 3. Trigger all revalidation requests in parallel
            const results = await Promise.allSettled(frontendUrls.map(async (url) => {
                const endpoint = `${url}/api/revalidate`;
                try {
                    const res = await axios.post(endpoint, payload, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${secret}`
                        },
                        timeout: 10000 // Increased to 10s for slow cold starts
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

