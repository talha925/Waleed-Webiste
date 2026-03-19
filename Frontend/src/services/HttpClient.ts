/**
 * HTTP Client Implementation
 * Refactored from ApiClient to follow SOLID principles
 */

import {
  IHttpClient,
  RequestConfig,
  ResponseData,
  HttpError,
  RequestInterceptor,
  ResponseInterceptor
} from './interfaces/IHttpClient';
import { getApiUrl } from '@/lib/config';

class HttpClient implements IHttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
    
    // Resolve brand ID dynamically
    let brandId = process.env.NEXT_PUBLIC_APP_BRAND_ID || 'pennyscroll';
    
    if (typeof window !== 'undefined') {
      // Client-side detection
      const host = window.location.hostname;
      if (host.includes('blogzenix.com') || host.includes('blogzenix-frontend.vercel.app')) {
        brandId = 'blogzenix';
      } else if (host.includes('pennyscroll.com') || host.includes('pennyscroll-frontend.vercel.app')) {
        brandId = 'pennyscroll';
      }
    } else {
      // Server-side detection
      try {
        // Use a dynamic require to isolate server-only 'next/headers' usage
        const { getBrandConfig } = require('@config/server-config');
        const brand = getBrandConfig();
        brandId = brand.brandId;
      } catch (e) {
        // Fallback if not in a request context
      }
    }

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'x-brand-id': brandId
    };
    this.timeout = 30000; // 30 seconds
  }

  // Core HTTP methods
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, body: data });
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, body: data });
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, body: data });
  }

  // Generic request method
  async request<T = any>(config: RequestConfig & { url: string }): Promise<T> {
    try {
      // Apply request interceptors
      let processedConfig = await this.applyRequestInterceptors(config);

      // Build the request
      const requestOptions = await this.buildRequestOptions(processedConfig);
      const fullUrl = this.buildFullUrl(processedConfig.url);

      // Create abort controller for timeout
      const abortController = this.createAbortController();
      const timeoutId = setTimeout(() => abortController.abort(), processedConfig.timeout || this.timeout);

      try {
        // Make the request
        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: abortController.signal
        });

        clearTimeout(timeoutId);

        // Process response
        const responseData = await this.processResponse<T>(response);

        // Apply response interceptors
        const processedResponse = await this.applyResponseInterceptors(responseData);

        return processedResponse.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw await this.handleRequestError(error, config);
      }
    } catch (error) {
      throw await this.applyResponseErrorInterceptors(error as HttpError);
    }
  }

  private async applyRequestInterceptors(config: RequestConfig & { url: string }): Promise<RequestConfig & { url: string }> {
    let processedConfig = { ...config };

    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        try {
          processedConfig = await interceptor.onRequest(processedConfig);
        } catch (error) {
          if (interceptor.onRequestError) {
            throw await interceptor.onRequestError(error as Error);
          }
          throw error;
        }
      }
    }

    return processedConfig;
  }

  private async applyResponseInterceptors<T>(response: ResponseData<T>): Promise<ResponseData<T>> {
    let processedResponse = { ...response };

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponse) {
        processedResponse = await interceptor.onResponse(processedResponse);
      }
    }

    return processedResponse;
  }

  private async applyResponseErrorInterceptors(error: HttpError): Promise<HttpError> {
    let processedError = error;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponseError) {
        processedError = await interceptor.onResponseError(processedError);
      }
    }

    return processedError;
  }

  private buildFullUrl(url: string): string {
    // Handle absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Handle API routes
    if (url.startsWith('/api/')) {
      return url; // Use relative URL for local API routes
    }

    // Use getApiUrl helper for external routes
    if (this.baseURL) {
      return url.startsWith('/') ? this.baseURL + url : `${this.baseURL}/${url}`;
    }

    return getApiUrl(url);
  }

  private async buildRequestOptions(config: RequestConfig & { url: string }): Promise<RequestInit> {
    const headers = new Headers({
      ...this.defaultHeaders,
      ...config.headers
    });

    const options: RequestInit = {
      method: config.method || 'GET',
      headers,
      cache: config.cache || 'no-store'
    };

    // Add body for methods that support it
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method || '')) {
      if (config.body instanceof FormData) {
        // Remove Content-Type header for FormData (browser will set it with boundary)
        headers.delete('Content-Type');
        options.body = config.body;
      } else if (typeof config.body === 'string') {
        options.body = config.body;
      } else {
        options.body = JSON.stringify(config.body);
      }
    }

    // Add query parameters
    if (config.params) {
      const url = new URL(config.url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return options;
  }

  private async processResponse<T>(response: Response): Promise<ResponseData<T>> {
    if (!response.ok) {
      throw await this.createHttpError(response);
    }

    let data: T;

    // Handle different response types
    if (response.status === 204) {
      data = null as any;
    } else {
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text() as any;
      } else {
        data = await response.blob() as any;
      }
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };
  }

  private async createHttpError(response: Response): Promise<HttpError> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData: any = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        errorData = await response.text();
        errorMessage = errorData || errorMessage;
      }
    } catch (parseError) {
      // If we can't parse the error response, use the default message
    }

    const error = new Error(errorMessage) as HttpError;
    error.status = response.status;
    error.statusText = response.statusText;
    error.response = errorData;
    error.isNetworkError = false;
    error.isTimeoutError = false;

    return error;
  }

  private async handleRequestError(error: any, config: RequestConfig): Promise<HttpError> {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout') as HttpError;
      timeoutError.status = 408;
      timeoutError.statusText = 'Request Timeout';
      timeoutError.isNetworkError = false;
      timeoutError.isTimeoutError = true;
      return timeoutError;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error('Network error') as HttpError;
      networkError.status = 0;
      networkError.statusText = 'Network Error';
      networkError.isNetworkError = true;
      networkError.isTimeoutError = false;
      return networkError;
    }

    // If it's already an HttpError, return it
    if (error.status !== undefined) {
      return error as HttpError;
    }

    // Convert unknown errors to HttpError
    const unknownError = new Error(error.message || 'Unknown error') as HttpError;
    unknownError.status = 500;
    unknownError.statusText = 'Internal Server Error';
    unknownError.isNetworkError = false;
    unknownError.isTimeoutError = false;
    return unknownError;
  }

  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);

    // Return unsubscribe function
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter(i => i !== interceptor);
    };
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);

    return () => {
      this.responseInterceptors = this.responseInterceptors.filter(i => i !== interceptor);
    };
  }

  // Configuration
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  // Utility methods
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  createAbortController(): AbortController {
    return new AbortController();
  }
}

export default HttpClient;