/**
 * Unified Error Handling System
 * Consolidates error handling patterns and provides consistent error management
 * Follows SOLID principles and provides type-safe error handling
 */

import React from 'react';
import { z } from 'zod';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  SERVER = 'server',
  CLIENT = 'client',
  BUSINESS = 'business',
  SYSTEM = 'system'
}

// Base error interface
export interface IAppError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  cause?: Error;
}

// Error handler interface
export interface IErrorHandler {
  handle(error: IAppError): void;
  canHandle(error: IAppError): boolean;
}

// Error reporter interface
export interface IErrorReporter {
  report(error: IAppError): Promise<void>;
}

// Base application error class
export class AppError extends Error implements IAppError {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;
    this.cause = cause;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      cause: this.cause?.message
    };
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    value?: any,
    context?: Record<string, any>
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      {
        field,
        value,
        ...context
      }
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    context?: Record<string, any>
  ) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      context
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Access denied',
    requiredPermission?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      {
        requiredPermission,
        ...context
      }
    );
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    statusCode?: number,
    url?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'NETWORK_ERROR',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      {
        statusCode,
        url,
        ...context
      }
    );
  }
}

export class BusinessError extends AppError {
  constructor(
    message: string,
    businessRule: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'BUSINESS_ERROR',
      ErrorCategory.BUSINESS,
      ErrorSeverity.MEDIUM,
      {
        businessRule,
        ...context
      }
    );
  }
}

export class SystemError extends AppError {
  constructor(
    message: string,
    systemComponent: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(
      message,
      'SYSTEM_ERROR',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      {
        systemComponent,
        ...context
      },
      cause
    );
  }
}

// Error handlers
export class ConsoleErrorHandler implements IErrorHandler {
  canHandle(error: IAppError): boolean {
    return true; // Can handle all errors
  }

  handle(error: IAppError): void {
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.category.toUpperCase()}] ${error.code}: ${error.message}`, {
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack
    });
  }

  private getLogMethod(severity: ErrorSeverity) {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
}

export class ToastErrorHandler implements IErrorHandler {
  canHandle(error: IAppError): boolean {
    // Only handle user-facing errors
    return [
      ErrorCategory.VALIDATION,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.AUTHORIZATION,
      ErrorCategory.BUSINESS
    ].includes(error.category);
  }

  handle(error: IAppError): void {
    // This would integrate with your toast notification system
    // For now, we'll use a simple implementation
    if (typeof window !== 'undefined') {
      // In a real app, you'd use your toast library here
      console.warn('Toast notification:', error.message);
    }
  }
}

export class RemoteErrorReporter implements IErrorReporter {
  constructor(private endpoint: string, private apiKey?: string) {}

  async report(error: IAppError): Promise<void> {
    // Only report high severity errors
    if (error.severity === ErrorSeverity.LOW) {
      return;
    }

    try {
      const payload = {
        ...(error as any).toJSON?.() || {},
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      };

      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

// Error manager - central error handling system
export class ErrorManager {
  private handlers: IErrorHandler[] = [];
  private reporters: IErrorReporter[] = [];
  private errorCounts: Map<string, number> = new Map();
  private readonly maxErrorCount = 10;
  private readonly errorCountWindow = 60000; // 1 minute

  constructor() {
    // Add default handlers
    this.addHandler(new ConsoleErrorHandler());
    this.addHandler(new ToastErrorHandler());
  }

  addHandler(handler: IErrorHandler): void {
    this.handlers.push(handler);
  }

  addReporter(reporter: IErrorReporter): void {
    this.reporters.push(reporter);
  }

  async handle(error: Error | IAppError): Promise<void> {
    const appError = this.normalizeError(error);
    
    // Check for error flooding
    if (this.isErrorFlooding(appError)) {
      return;
    }

    // Handle with appropriate handlers
    for (const handler of this.handlers) {
      if (handler.canHandle(appError)) {
        try {
          handler.handle(appError);
        } catch (handlerError) {
          console.error('Error handler failed:', handlerError);
        }
      }
    }

    // Report to external services
    for (const reporter of this.reporters) {
      try {
        await reporter.report(appError);
      } catch (reporterError) {
        console.error('Error reporter failed:', reporterError);
      }
    }
  }

  private normalizeError(error: Error | IAppError): IAppError {
    if (error instanceof AppError) {
      return error;
    }

    // Convert standard errors to AppError
    if ((error as Error).name === 'ValidationError') {
      return new ValidationError(error.message);
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message);
    }

    // Default to system error
    return new SystemError(
      error.message || 'Unknown error occurred',
      'unknown',
      { originalError: (error as Error).name },
      error as Error
    );
  }

  private isErrorFlooding(error: IAppError): boolean {
    const key = `${error.code}-${error.message}`;
    const count = this.errorCounts.get(key) || 0;
    
    if (count >= this.maxErrorCount) {
      return true;
    }

    this.errorCounts.set(key, count + 1);
    
    // Clean up old counts
    setTimeout(() => {
      this.errorCounts.delete(key);
    }, this.errorCountWindow);

    return false;
  }
}

// Global error manager instance
export const errorManager = new ErrorManager();

// Utility functions
export function createErrorFromResponse(response: Response, context?: Record<string, any>): NetworkError {
  const message = `HTTP ${response.status}: ${response.statusText}`;
  return new NetworkError(message, response.status, response.url, context);
}

export function createValidationErrorFromZod(zodError: z.ZodError, context?: Record<string, any>): ValidationError {
  const firstError = zodError.issues[0];
  const field = firstError.path.join('.');
  const message = firstError.message;
  
  return new ValidationError(message, field, undefined, {
    allErrors: zodError.issues,
    ...context
  });
}

export function handleAsyncError<T>(
  promise: Promise<T>,
  fallbackValue?: T
): Promise<T | undefined> {
  return promise.catch(error => {
    errorManager.handle(error);
    return fallbackValue;
  });
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  fallbackValue?: ReturnType<T>
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch(error => {
          errorManager.handle(error);
          return fallbackValue;
        });
      }
      
      return result;
    } catch (error) {
      errorManager.handle(error as Error);
      return fallbackValue;
    }
  }) as T;
}

// React error boundary helper
export function createErrorBoundary(fallbackComponent: React.ComponentType<{ error: Error }>) {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      const appError = new SystemError(
        error.message,
        'react-component',
        {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        },
        error
      );
      
      errorManager.handle(appError);
    }

    render() {
      if (this.state.hasError && this.state.error) {
        return React.createElement(fallbackComponent, { error: this.state.error });
      }

      return this.props.children;
    }
  };
}

// Hook for error handling in React components
export function useErrorHandler() {
  return {
    handleError: (error: Error | IAppError) => errorManager.handle(error),
    createValidationError: (message: string, field?: string, value?: any) => 
      new ValidationError(message, field, value),
    createBusinessError: (message: string, rule: string) => 
      new BusinessError(message, rule),
    withErrorHandling
  };
}

// Export types