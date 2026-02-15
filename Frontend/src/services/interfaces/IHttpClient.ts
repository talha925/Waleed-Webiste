/**
 * HTTP Client Interface
 * Defines the contract for HTTP communication
 */

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
  cache?: RequestCache;
  skipAuth?: boolean;
  isPublicRoute?: boolean;
  signal?: AbortSignal;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface HttpError extends Error {
  status: number;
  statusText: string;
  response?: any;
  isNetworkError: boolean;
  isTimeoutError: boolean;
}

export interface RequestInterceptor {
  onRequest?: (config: RequestConfig & { url: string }) => RequestConfig & { url: string } | Promise<RequestConfig & { url: string }>;
  onRequestError?: (error: Error) => Error | Promise<Error>;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: ResponseData<T>) => ResponseData<T> | Promise<ResponseData<T>>;
  onResponseError?: (error: HttpError) => HttpError | Promise<HttpError>;
}

export interface IHttpClient {
  // Core HTTP methods
  get<T = any>(url: string, config?: RequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  
  // Generic request method
  request<T = any>(config: RequestConfig & { url: string }): Promise<T>;
  
  // Interceptor management
  addRequestInterceptor(interceptor: RequestInterceptor): () => void;
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void;
  
  // Configuration
  setBaseURL(baseURL: string): void;
  setDefaultHeaders(headers: Record<string, string>): void;
  setTimeout(timeout: number): void;
  
  // Utility methods
  isOnline(): boolean;
  getBaseURL(): string;
  createAbortController(): AbortController;
}