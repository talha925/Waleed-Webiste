// Banner cache utility for global cache invalidation
export class BannerCache {
  private static readonly CACHE_KEY = 'heroBannerData';
  private static readonly TIMESTAMP_KEY = 'heroBannerTimestamp';

  // Global cache invalidation - can be called from admin panel or other components
  static invalidate(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
      localStorage.removeItem(this.TIMESTAMP_KEY);

      // Dispatch custom event to notify HeroBanner component
      window.dispatchEvent(new CustomEvent('bannerCacheInvalidated'));
    }
  }

  // Check if cache exists
  static hasCache(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.CACHE_KEY) !== null;
  }

  // Get cache age in milliseconds
  static getCacheAge(): number {
    if (typeof window === 'undefined') return Infinity;
    const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);
    if (!timestamp) return Infinity;
    return Date.now() - parseInt(timestamp);
  }
}