/**
 * API Route Handler Factory
 * Standardizes API route handling and eliminates repetitive code
 * Follows SOLID principles and DRY pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

// Standard error response format
interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
  timestamp: string;
}

// Standard success response format
interface SuccessResponse<T = any> {
  data: T;
  success: true;
  timestamp: string;
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// Handler configuration
interface HandlerConfig {
  requireAuth?: boolean;
  allowedMethods?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  cache?: {
    ttl: number;
    key?: string;
  };
  validation?: {
    body?: (data: any) => { isValid: boolean; errors?: string[] };
    query?: (params: any) => { isValid: boolean; errors?: string[] };
  };
  timeout?: number;
}

// Handler function type
type HandlerFunction<T = any> = (
  request: NextRequest,
  context: {
    params?: any;
    searchParams?: URLSearchParams;
    user?: any;
    body?: any;
  }
) => Promise<T>;

// Error types
class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ValidationError extends ApiError {
  constructor(message: string, public errors: string[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

// Rate limiting (simple in-memory implementation)
class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  static check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }
}

// Authentication helper
async function authenticateRequest(request: NextRequest): Promise<any> {
  const authorization = request.headers.get('authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid Bearer token');
  }

  const token = authorization.substring(7);
  
  try {
    // Validate token with auth service
    const response = await fetch(`${config.api.baseUrl}/api/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new AuthenticationError('Invalid token');
    }

    const { user } = await response.json();
    return user;
  } catch (error) {
    throw new AuthenticationError('Token validation failed');
  }
}

// Response helpers
function createSuccessResponse<T>(data: T, meta?: any): NextResponse {
  const response: SuccessResponse<T> = {
    data,
    success: true,
    timestamp: new Date().toISOString(),
    ...(meta && { meta })
  };
  
  return NextResponse.json(response);
}

function createErrorResponse(
  error: string,
  status: number = 500,
  details?: string,
  code?: string
): NextResponse {
  const response: ErrorResponse = {
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(code && { code })
  };
  
  return NextResponse.json(response, { status });
}

// Main handler factory
export function createApiHandler(
  config: HandlerConfig = {}
) {
  return function handler(
    handlers: {
      GET?: HandlerFunction;
      POST?: HandlerFunction;
      PUT?: HandlerFunction;
      DELETE?: HandlerFunction;
      PATCH?: HandlerFunction;
    }
  ) {
    return async function(request: NextRequest, context: { params?: any } = {}) {
      const method = request.method;
      const startTime = Date.now();
      
      try {
        // Method validation
        if (config.allowedMethods && !config.allowedMethods.includes(method)) {
          return createErrorResponse(
            `Method ${method} not allowed`,
            405,
            `Allowed methods: ${config.allowedMethods.join(', ')}`,
            'METHOD_NOT_ALLOWED'
          );
        }

        // Get handler for method
        const handlerFn = handlers[method as keyof typeof handlers];
        if (!handlerFn) {
          return createErrorResponse(
            `Method ${method} not implemented`,
            405,
            undefined,
            'METHOD_NOT_IMPLEMENTED'
          );
        }

        // Rate limiting
        if (config.rateLimit) {
          const clientId = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
          const rateLimitKey = `${clientId}:${request.nextUrl.pathname}`;
          
          if (!RateLimiter.check(
            rateLimitKey,
            config.rateLimit.requests,
            config.rateLimit.windowMs
          )) {
            return createErrorResponse(
              'Rate limit exceeded',
              429,
              `Maximum ${config.rateLimit.requests} requests per ${config.rateLimit.windowMs}ms`,
              'RATE_LIMIT_EXCEEDED'
            );
          }
        }

        // Authentication
        let user: any = null;
        if (config.requireAuth) {
          user = await authenticateRequest(request);
        }

        // Parse request body
        let body: any = null;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          try {
            const contentType = request.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              body = await request.json();
            } else if (contentType?.includes('multipart/form-data')) {
              body = await request.formData();
            } else {
              body = await request.text();
            }
          } catch (error) {
            throw new ValidationError('Invalid request body', ['Body must be valid JSON']);
          }
        }

        // Validation
        if (config.validation) {
          // Body validation
          if (config.validation.body && body) {
            const validation = config.validation.body(body);
            if (!validation.isValid) {
              throw new ValidationError(
                'Request body validation failed',
                validation.errors || ['Invalid body']
              );
            }
          }

          // Query validation
          if (config.validation.query) {
            const searchParams = request.nextUrl.searchParams;
            const queryParams = Object.fromEntries(searchParams.entries());
            const validation = config.validation.query(queryParams);
            if (!validation.isValid) {
              throw new ValidationError(
                'Query parameters validation failed',
                validation.errors || ['Invalid query parameters']
              );
            }
          }
        }

        // Execute handler with timeout
        const handlerPromise = handlerFn(request, {
          params: context.params,
          searchParams: request.nextUrl.searchParams,
          user,
          body
        });

        let result: any;
        if (config.timeout) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.timeout);
          });
          
          result = await Promise.race([handlerPromise, timeoutPromise]);
        } else {
          result = await handlerPromise;
        }

        // Handle different result types
        if (result instanceof NextResponse) {
          return result;
        }

        // Create success response
        const processingTime = Date.now() - startTime;
        const response = createSuccessResponse(result);
        
        // Add performance headers
        response.headers.set('X-Processing-Time', `${processingTime}ms`);
        
        return response;

      } catch (error) {
        console.error(`API Error in ${method} ${request.nextUrl.pathname}:`, error);
        
        // Handle known error types
        if (error instanceof ApiError) {
          return createErrorResponse(
            error.message,
            error.status,
            error.details,
            error.code
          );
        }

        if (error instanceof ValidationError) {
          return createErrorResponse(
            error.message,
            error.status,
            error.errors.join(', '),
            error.code
          );
        }

        // Handle unknown errors
        return createErrorResponse(
          'Internal server error',
          500,
          process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
          'INTERNAL_ERROR'
        );
      }
    };
  };
}

// Convenience functions for common patterns
export function createPublicHandler(handlers: Parameters<ReturnType<typeof createApiHandler>>[0]) {
  return createApiHandler({ requireAuth: false })(handlers);
}

export function createAuthenticatedHandler(handlers: Parameters<ReturnType<typeof createApiHandler>>[0]) {
  return createApiHandler({ requireAuth: true })(handlers);
}

export function createProxyHandler(
  targetBaseUrl: string,
  options: {
    requireAuth?: boolean;
    transformResponse?: (data: any) => any;
    cacheKey?: string;
  } = {}
) {
  return createApiHandler({ requireAuth: options.requireAuth || false })({
    GET: async (request, { searchParams }) => {
      const endpoint = request.nextUrl.pathname.replace('/api/', '');
      const queryString = searchParams?.toString();
      const url = `${targetBaseUrl}/${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new ApiError(
          `External API error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return options.transformResponse ? options.transformResponse(data) : data;
    }
  });
}

// Export error classes for use in handlers
export {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
};