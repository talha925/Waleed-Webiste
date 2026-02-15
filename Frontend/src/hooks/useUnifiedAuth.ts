/**
 * Unified Authentication Hook
 * Consolidates logic from useOptimizedAuth, useEnhancedAuth, and AuthContext
 * Follows SOLID principles and provides a clean interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '@/services/AuthService';
import {
  User,
  AuthToken,
  LoginCredentials,
  AuthState,
  OfflineAction
} from '@/services/interfaces/IAuthService';

interface AuthHookOptions {
  // Feature flags
  enableOfflineSupport?: boolean;
  enableSessionWarnings?: boolean;
  enableAutoRefresh?: boolean;
  
  // Configuration
  sessionWarningThreshold?: number; // milliseconds before expiry to show warning
  autoRefreshThreshold?: number;    // milliseconds before expiry to auto-refresh
  
  // Callbacks
  onLogin?: (user: User) => void;
  onLogout?: () => void;
  onSessionExpiring?: (timeRemaining: number) => void;
  onTokenRefresh?: (token: AuthToken) => void;
  onOfflineAction?: (action: OfflineAction) => void;
  
  // Debug
  debug?: boolean;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  extendSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  queueOfflineAction: (action: OfflineAction) => void;
  syncOfflineActions: () => Promise<void>;
  clearOfflineActions: () => void;
}

type UseAuthReturn = AuthState & AuthActions;

export function useUnifiedAuth(options: AuthHookOptions = {}): UseAuthReturn {
  const {
    enableOfflineSupport = false,
    enableSessionWarnings = true,
    enableAutoRefresh = true,
    sessionWarningThreshold = 5 * 60 * 1000, // 5 minutes
    autoRefreshThreshold = 10 * 60 * 1000,   // 10 minutes
    onLogin,
    onLogout,
    onSessionExpiring,
    onTokenRefresh,
    onOfflineAction,
    debug = false
  } = options;

  // State from auth service
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  
  // Local state for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for cleanup
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const warningShownRef = useRef(false);
  const autoRefreshAttemptedRef = useRef(false);

  const log = useCallback((message: string, data?: any) => {
    if (debug) {
      console.log(`[useUnifiedAuth] ${message}`, data);
    }
  }, [debug]);

  // Subscribe to auth service events
  useEffect(() => {
    log('Setting up auth service subscriptions');
    
    // Auth state changes
    const unsubscribeAuthState = authService.onAuthStateChange((newState) => {
      log('Auth state changed', newState);
      setAuthState(newState);
      
      // Reset warning flags when auth state changes
      if (!newState.isAuthenticated) {
        warningShownRef.current = false;
        autoRefreshAttemptedRef.current = false;
      }
    });
    
    unsubscribeRefs.current.push(unsubscribeAuthState);

    // Session expiring warnings
    if (enableSessionWarnings) {
      const unsubscribeSessionExpiring = authService.onSessionExpiring((timeRemaining) => {
        log('Session expiring', { timeRemaining });
        
        if (!warningShownRef.current && timeRemaining <= sessionWarningThreshold) {
          warningShownRef.current = true;
          onSessionExpiring?.(timeRemaining);
        }
      });
      
      unsubscribeRefs.current.push(unsubscribeSessionExpiring);
    }

    // Token refresh events
    const unsubscribeTokenRefresh = authService.onTokenRefresh((token) => {
      log('Token refreshed', token);
      warningShownRef.current = false;
      autoRefreshAttemptedRef.current = false;
      onTokenRefresh?.(token);
    });
    
    unsubscribeRefs.current.push(unsubscribeTokenRefresh);

    return () => {
      log('Cleaning up auth service subscriptions');
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [enableSessionWarnings, sessionWarningThreshold, onSessionExpiring, onTokenRefresh, log]);

  // Auto-refresh logic
  useEffect(() => {
    if (!enableAutoRefresh || !authState.isAuthenticated) {
      return;
    }

    const checkAutoRefresh = () => {
      const timeRemaining = authState.sessionTimeRemaining;
      
      if (timeRemaining > 0 && 
          timeRemaining <= autoRefreshThreshold && 
          !autoRefreshAttemptedRef.current) {
        
        log('Auto-refreshing token', { timeRemaining });
        autoRefreshAttemptedRef.current = true;
        
        authService.refreshToken().catch((error) => {
          log('Auto-refresh failed', error);
          // Reset flag to allow manual retry
          autoRefreshAttemptedRef.current = false;
        });
      }
    };

    // Check immediately
    checkAutoRefresh();

    // Set up interval to check periodically
    const interval = setInterval(checkAutoRefresh, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [enableAutoRefresh, authState.isAuthenticated, authState.sessionTimeRemaining, autoRefreshThreshold, log]);

  // Actions
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    log('Attempting login', { email: credentials.email });
    setIsLoading(true);
    setError(null);
    
    try {
      const { user } = await authService.login(credentials);
      log('Login successful', user);
      onLogin?.(user);
    } catch (error) {
      log('Login failed', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onLogin, log]);

  const logout = useCallback(async (): Promise<void> => {
    log('Attempting logout');
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.logout();
      log('Logout successful');
      onLogout?.();
    } catch (error) {
      log('Logout failed', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onLogout, log]);

  const refreshToken = useCallback(async (): Promise<void> => {
    log('Attempting token refresh');
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.refreshToken();
      log('Token refresh successful');
      warningShownRef.current = false;
      autoRefreshAttemptedRef.current = false;
    } catch (error) {
      log('Token refresh failed', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [log]);

  const updateUser = useCallback(async (userData: Partial<User>): Promise<void> => {
    log('Attempting user update', userData);
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.updateUser(userData);
      log('User update successful');
    } catch (error) {
      log('User update failed', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [log]);

  const extendSession = useCallback(async (): Promise<void> => {
    log('Attempting session extension');
    await refreshToken();
  }, [refreshToken, log]);

  const hasPermission = useCallback((permission: string): boolean => {
    const result = authService.hasPermission(permission);
    log('Permission check', { permission, result });
    return result;
  }, [log]);

  const hasRole = useCallback((role: string): boolean => {
    const result = authService.hasRole(role);
    log('Role check', { role, result });
    return result;
  }, [log]);

  // Offline support actions (only if enabled)
  const queueOfflineAction = useCallback((action: OfflineAction): void => {
    if (!enableOfflineSupport) {
      log('Offline support disabled, ignoring action', action);
      return;
    }
    
    log('Queueing offline action', action);
    authService.queueOfflineAction(action);
    onOfflineAction?.(action);
  }, [enableOfflineSupport, onOfflineAction, log]);

  const syncOfflineActions = useCallback(async (): Promise<void> => {
    if (!enableOfflineSupport) {
      log('Offline support disabled, skipping sync');
      return;
    }
    
    log('Syncing offline actions');
    setIsLoading(true);
    
    try {
      await authService.syncOfflineActions();
      log('Offline actions synced successfully');
    } catch (error) {
      log('Offline actions sync failed', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [enableOfflineSupport, log]);

  const clearOfflineActions = useCallback((): void => {
    if (!enableOfflineSupport) {
      log('Offline support disabled, skipping clear');
      return;
    }
    
    log('Clearing offline actions');
    authService.clearOfflineActions();
  }, [enableOfflineSupport, log]);

  // Clear error when auth state changes successfully
  useEffect(() => {
    if (authState.isAuthenticated && error) {
      setError(null);
    }
  }, [authState.isAuthenticated, error]);

  return {
    // Auth state (with loading override for UI operations)
    ...authState,
    isLoading: isLoading || authState.isLoading,
    
    // Actions
    login,
    logout,
    refreshToken,
    updateUser,
    extendSession,
    hasPermission,
    hasRole,
    queueOfflineAction,
    syncOfflineActions,
    clearOfflineActions
  };
}

// Convenience hooks for specific use cases
export function useAuth() {
  return useUnifiedAuth();
}

export function useAuthWithOffline() {
  return useUnifiedAuth({
    enableOfflineSupport: true,
    enableSessionWarnings: true,
    enableAutoRefresh: true
  });
}

export function useBasicAuth() {
  return useUnifiedAuth({
    enableOfflineSupport: false,
    enableSessionWarnings: false,
    enableAutoRefresh: false
  });
}

export function useAuthWithCallbacks(callbacks: {
  onLogin?: (user: User) => void;
  onLogout?: () => void;
  onSessionExpiring?: (timeRemaining: number) => void;
}) {
  return useUnifiedAuth({
    enableSessionWarnings: true,
    enableAutoRefresh: true,
    ...callbacks
  });
}