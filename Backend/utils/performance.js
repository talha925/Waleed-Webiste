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

const perf = {
  /** Start a named timer (console.time) */
  start(label) {
    console.time(label);
  },

  /** End a named timer (console.timeEnd) */
  end(label) {
    console.timeEnd(label);
  },

  /** Run an async block and automatically time it */
  async run(label, fn) {
    console.time(label);
    const result = await fn();
    console.timeEnd(label);
    return result;
  },

  /** Log payload size in KB and return the numeric size */
  logSize(label, data) {
    const sizeKB = Buffer.byteLength(JSON.stringify(data)) / 1024;
    console.log(`${label} payload size: ${sizeKB.toFixed(2)} KB`);
    return sizeKB;
  },

  /** Safe start – only starts if the label is not already active */
  safeStart(label) {
    if (_timers.has(label)) return;
    _timers.add(label);
    console.time(label);
  },

  /** Safe end – only ends if the label was started */
  safeEnd(label) {
    if (!_timers.has(label)) return;
    _timers.delete(label);
    console.timeEnd(label);
  },

  /** Safe run – combines safeStart/safeEnd around an async function */
  async safeRun(label, fn) {
    this.safeStart(label);
    const result = await fn();
    this.safeEnd(label);
    return result;
  },
};

module.exports = perf;
