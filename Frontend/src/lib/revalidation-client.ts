/**
 * Client-side utility for triggering revalidation
 * Integrates with WebSocket client for real-time updates
 */

interface RevalidationOptions {
  type: 'path' | 'tag' | 'blog' | 'stores' | 'coupons' | 'categories' | 'all';
  path?: string;
  tag?: string;
  blogId?: string;
  storeSlug?: string;
  couponId?: string;
  categorySlug?: string;
  source?: 'api' | 'websocket' | 'manual';
}

interface RevalidationResponse {
  message: string;
  source: string;
  timestamp: string;
}

class RevalidationClient {
  private baseUrl: string;
  private secret: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    this.secret = process.env.REVALIDATION_SECRET || '';
  }

  /**
   * Trigger revalidation via API endpoint
   */
  async revalidate(options: RevalidationOptions): Promise<RevalidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          secret: this.secret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Revalidation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Revalidation error:', error);
      throw error;
    }
  }

  /**
   * Revalidate store-related content
   */
  async revalidateStore(storeSlug: string, source: 'api' | 'websocket' | 'manual' = 'manual'): Promise<RevalidationResponse> {
    return this.revalidate({
      type: 'stores',
      storeSlug,
      source,
    });
  }

  /**
   * Revalidate coupon-related content
   */
  async revalidateCoupon(couponId: string, storeSlug?: string, source: 'api' | 'websocket' | 'manual' = 'manual'): Promise<RevalidationResponse> {
    return this.revalidate({
      type: 'coupons',
      couponId,
      storeSlug,
      source,
    });
  }

  /**
   * Revalidate category-related content
   */
  async revalidateCategory(categorySlug: string, source: 'api' | 'websocket' | 'manual' = 'manual'): Promise<RevalidationResponse> {
    return this.revalidate({
      type: 'categories',
      categorySlug,
      source,
    });
  }

  /**
   * Revalidate blog-related content
   */
  async revalidateBlog(blogId?: string, source: 'api' | 'websocket' | 'manual' = 'manual'): Promise<RevalidationResponse> {
    return this.revalidate({
      type: 'blog',
      blogId,
      source,
    });
  }

  /**
   * Revalidate by specific tag
   */
  async revalidateByTag(tag: string, source: 'api' | 'websocket' | 'manual' = 'manual'): Promise<RevalidationResponse> {
    return this.revalidate({
      type: 'tag',
      tag,
      source,
    });
  }

  /**
   * Revalidate by specific path
   */
  async revalidateByPath(path: string, source: 'api' | 'websocket' | 'manual' = 'manual'): Promise<RevalidationResponse> {
    return this.revalidate({
      type: 'path',
      path,
      source,
    });
  }

  /**
   * Revalidate all content
   */
  async revalidateAll(source: 'api' | 'websocket' | 'manual' = 'manual'): Promise<RevalidationResponse> {
    return this.revalidate({
      type: 'all',
      source,
    });
  }
}

// Export singleton instance
export const revalidationClient = new RevalidationClient();

// Export types for use in other files
export type { RevalidationOptions, RevalidationResponse };