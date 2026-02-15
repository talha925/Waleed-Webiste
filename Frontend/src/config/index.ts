/**
 * Unified Configuration Management System
 * Centralizes application configuration and eliminates hardcoded values
 * Follows SOLID principles and provides type-safe configuration management
 */

import React from 'react';
import { z } from 'zod';

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Configuration schemas for validation
const DatabaseConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean().default(false),
  connectionTimeout: z.number().int().positive().default(30000),
  maxConnections: z.number().int().positive().default(10)
});

const AuthConfigSchema = z.object({
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('24h'),
  refreshTokenExpiresIn: z.string().default('7d'),
  bcryptRounds: z.number().int().min(10).max(15).default(12),
  sessionTimeout: z.number().int().positive().default(1800000), // 30 minutes
  maxLoginAttempts: z.number().int().positive().default(5),
  lockoutDuration: z.number().int().positive().default(900000) // 15 minutes
});

const ApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeout: z.number().int().positive().default(30000),
  retryAttempts: z.number().int().min(0).max(5).default(3),
  retryDelay: z.number().int().positive().default(1000),
  rateLimit: z.object({
    windowMs: z.number().int().positive().default(900000), // 15 minutes
    maxRequests: z.number().int().positive().default(100)
  })
});

const StorageConfigSchema = z.object({
  provider: z.enum(['local', 's3', 'cloudinary']).default('local'),
  local: z.object({
    uploadDir: z.string().default('./uploads'),
    maxFileSize: z.number().int().positive().default(10485760), // 10MB
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp'])
  }).optional(),
  s3: z.object({
    bucket: z.string(),
    region: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    maxFileSize: z.number().int().positive().default(10485760)
  }).optional(),
  cloudinary: z.object({
    cloudName: z.string(),
    apiKey: z.string(),
    apiSecret: z.string(),
    maxFileSize: z.number().int().positive().default(10485760)
  }).optional()
});

const CacheConfigSchema = z.object({
  provider: z.enum(['memory', 'redis']).default('memory'),
  ttl: z.number().int().positive().default(3600), // 1 hour
  maxSize: z.number().int().positive().default(1000),
  redis: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    password: z.string().optional(),
    db: z.number().int().min(0).default(0)
  }).optional()
});

const LoggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  format: z.enum(['json', 'simple']).default('simple'),
  file: z.object({
    enabled: z.boolean().default(false),
    path: z.string().default('./logs'),
    maxSize: z.string().default('10m'),
    maxFiles: z.number().int().positive().default(5)
  }),
  console: z.object({
    enabled: z.boolean().default(true),
    colorize: z.boolean().default(true)
  })
});

const EmailConfigSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'mailgun']).default('smtp'),
  from: z.string().email(),
  smtp: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    secure: z.boolean().default(false),
    username: z.string(),
    password: z.string()
  }).optional(),
  sendgrid: z.object({
    apiKey: z.string()
  }).optional(),
  mailgun: z.object({
    apiKey: z.string(),
    domain: z.string()
  }).optional()
});

const MonitoringConfigSchema = z.object({
  enabled: z.boolean().default(false),
  errorReporting: z.object({
    enabled: z.boolean().default(false),
    endpoint: z.string().url().optional(),
    apiKey: z.string().optional()
  }),
  analytics: z.object({
    enabled: z.boolean().default(false),
    googleAnalyticsId: z.string().optional(),
    mixpanelToken: z.string().optional()
  }),
  performance: z.object({
    enabled: z.boolean().default(false),
    sampleRate: z.number().min(0).max(1).default(0.1)
  })
});

const FeatureFlagsSchema = z.object({
  enableNewDashboard: z.boolean().default(false),
  enableAdvancedAnalytics: z.boolean().default(false),
  enableBetaFeatures: z.boolean().default(false),
  enableMaintenanceMode: z.boolean().default(false),
  enableOfflineSupport: z.boolean().default(false)
});

// Main configuration schema
const ConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  port: z.number().int().positive().default(3000),
  host: z.string().default('localhost'),
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string()), z.boolean()]).default('*'),
    credentials: z.boolean().default(true)
  }),
  database: DatabaseConfigSchema,
  auth: AuthConfigSchema,
  api: ApiConfigSchema,
  storage: StorageConfigSchema,
  cache: CacheConfigSchema,
  logging: LoggingConfigSchema,
  email: EmailConfigSchema,
  monitoring: MonitoringConfigSchema,
  featureFlags: FeatureFlagsSchema
});

// Configuration types
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
export type AppConfig = z.infer<typeof ConfigSchema>;

// Configuration provider interface
export interface IConfigProvider {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  getAll(): Record<string, any>;
}

// Environment variable provider
export class EnvironmentConfigProvider implements IConfigProvider {
  private cache = new Map<string, any>();

  get<T>(key: string): T | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const envKey = this.toEnvKey(key);
    const value = process.env[envKey];
    
    if (value === undefined) {
      return undefined;
    }

    const parsedValue = this.parseValue(value);
    this.cache.set(key, parsedValue);
    return parsedValue;
  }

  set<T>(key: string, value: T): void {
    const envKey = this.toEnvKey(key);
    process.env[envKey] = String(value);
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    const envKey = this.toEnvKey(key);
    return process.env[envKey] !== undefined;
  }

  getAll(): Record<string, any> {
    return { ...process.env };
  }

  private toEnvKey(key: string): string {
    return key
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/\./g, '_');
  }

  private parseValue(value: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // If not JSON, return as string
      return value;
    }
  }
}

// File-based configuration provider
export class FileConfigProvider implements IConfigProvider {
  private config: Record<string, any> = {};

  constructor(configPath?: string) {
    if (configPath) {
      this.loadFromFile(configPath);
    }
  }

  get<T>(key: string): T | undefined {
    return this.getNestedValue(this.config, key);
  }

  set<T>(key: string, value: T): void {
    this.setNestedValue(this.config, key, value);
  }

  has(key: string): boolean {
    return this.getNestedValue(this.config, key) !== undefined;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  private loadFromFile(path: string): void {
    try {
      // In a real implementation, you'd use fs to read the file
      // For now, we'll just initialize with empty config
      this.config = {};
    } catch (error) {
      console.warn(`Failed to load config from ${path}:`, error);
      this.config = {};
    }
  }

  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, prop) => {
      if (!(prop in current)) {
        current[prop] = {};
      }
      return current[prop];
    }, obj);
    target[lastKey] = value;
  }
}

// Configuration manager
export class ConfigManager {
  private providers: IConfigProvider[] = [];
  private cache = new Map<string, any>();
  private config: AppConfig | null = null;

  constructor() {
    // Add default providers
    this.addProvider(new EnvironmentConfigProvider());
  }

  addProvider(provider: IConfigProvider): void {
    this.providers.unshift(provider); // Add to beginning for priority
  }

  get<T>(key: string): T | undefined {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    for (const provider of this.providers) {
      const value = provider.get<T>(key);
      if (value !== undefined) {
        this.cache.set(key, value);
        return value;
      }
    }

    return undefined;
  }

  set<T>(key: string, value: T): void {
    // Set in the first provider (highest priority)
    if (this.providers.length > 0) {
      this.providers[0].set(key, value);
      this.cache.set(key, value);
    }
  }

  has(key: string): boolean {
    return this.providers.some(provider => provider.has(key));
  }

  getConfig(): AppConfig {
    if (this.config) {
      return this.config;
    }

    // Build configuration from providers
    const rawConfig = this.buildRawConfig();
    
    try {
      this.config = ConfigSchema.parse(rawConfig);
      return this.config;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      throw new Error('Invalid configuration');
    }
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    try {
      const rawConfig = this.buildRawConfig();
      ConfigSchema.parse(rawConfig);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.config = null;
  }

  private buildRawConfig(): any {
    const config: any = {};
    
    // Merge all provider configurations
    for (const provider of [...this.providers].reverse()) {
      const providerConfig = provider.getAll();
      this.deepMerge(config, providerConfig);
    }

    return config;
  }

  private deepMerge(target: any, source: any): any {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}

// Global configuration manager instance
export const configManager = new ConfigManager();

// Convenience functions
export function getConfig(): AppConfig {
  return configManager.getConfig();
}

export function getEnvironment(): Environment {
  return configManager.get<Environment>('environment') || 'development';
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

export function isTest(): boolean {
  return getEnvironment() === 'test';
}

export function getFeatureFlag(flag: keyof FeatureFlags): boolean {
  const config = getConfig();
  return config.featureFlags[flag];
}

export function getDatabaseConfig(): DatabaseConfig {
  return getConfig().database;
}

export function getAuthConfig(): AuthConfig {
  return getConfig().auth;
}

export function getApiConfig(): ApiConfig {
  return getConfig().api;
}

export function getStorageConfig(): StorageConfig {
  return getConfig().storage;
}

export function getCacheConfig(): CacheConfig {
  return getConfig().cache;
}

export function getLoggingConfig(): LoggingConfig {
  return getConfig().logging;
}

export function getEmailConfig(): EmailConfig {
  return getConfig().email;
}

export function getMonitoringConfig(): MonitoringConfig {
  return getConfig().monitoring;
}

// Configuration validation on module load
if (typeof window === 'undefined') {
  // Only validate on server-side
  const validation = configManager.validateConfig();
  if (!validation.isValid) {
    console.warn('Configuration validation warnings:', validation.errors);
  }
}