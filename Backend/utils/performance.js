// utils/performance.js
/**
 * Simple performance helper for detailed timing and payload-size logging.
 * Usage examples:
 *   const perf = require('../utils/performance');
 *   await perf.run('mongo-update', async () => await Coupon.findById(id));
 *   await perf.safeRun('revalidation', async () => await callFrontendRevalidation(...));
 *   perf.logSize('coupon-list', coupons);
 */

// Internal set to track active timers and prevent duplicate console.time warnings
const _timers = new Set();

// Ensure performance logs don't spam production unless explicitly requested
const isEnabled = () => process.env.NODE_ENV !== 'production' || process.env.PERF_LOG === 'true';

const perf = {
  /** Start a named timer (console.time) */
  start(label) {
    if (isEnabled()) console.time(label);
  },

  /** End a named timer (console.timeEnd) */
  end(label) {
    if (isEnabled()) console.timeEnd(label);
  },

  /** Run an async block and automatically time it */
  async run(label, fn) {
    if (isEnabled()) console.time(label);
    const result = await fn();
    if (isEnabled()) console.timeEnd(label);
    return result;
  },

  /** Log payload size in KB and return the numeric size */
  logSize(label, data) {
    const sizeKB = Buffer.byteLength(JSON.stringify(data)) / 1024;
    if (isEnabled()) console.log(`${label} payload size: ${sizeKB.toFixed(2)} KB`);
    return sizeKB;
  },

  /** Safe start – only starts if the label is not already active */
  safeStart(label) {
    if (!isEnabled() || _timers.has(label)) return;
    _timers.add(label);
    console.time(label);
  },

  /** Safe end – only ends if the label was started */
  safeEnd(label) {
    if (!isEnabled() || !_timers.has(label)) return;
    _timers.delete(label);
    console.timeEnd(label);
  },

  /** Safe run – avoids duplicate labels for overlapping async blocks */
  async safeRun(label, fn) {
    if (!isEnabled()) return await fn();
    
    if (_timers.has(label)) {
      return await fn();
    }
    
    _timers.add(label);
    console.time(label);
    try {
      return await fn();
    } finally {
      _timers.delete(label);
      console.timeEnd(label);
    }
  }
};

module.exports = perf;
