/**
 * Concrete Authentication Service Implementation
 * Consolidates authentication logic from multiple sources
 */

import { 
  IAuthService, 
  User, 
  AuthToken, 
  LoginCredentials, 
  AuthState, 
  SessionConfig, 
  OfflineAction 
} from './interfaces/IAuthService';
import HttpClient from './HttpClient';

class AuthService implements IAuthService {
  private static instance: AuthService;
  private authState: AuthState;
  private sessionConfig: SessionConfig;
  private sessionTimer: NodeJS.Timeout | null = null;
  private offlineActions: OfflineAction[] = [];
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private sessionExpiringListeners: ((timeRemaining: number) => void)[] = [];
  private tokenRefreshListeners: ((token: AuthToken) => void)[] = [];
  private httpClient: HttpClient;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<AuthToken> | null = null;

  private constructor() {
    this.httpClient = new HttpClient();
    this.sessionConfig = {
      timeoutDuration: 7 * 24 * 60 * 60 * 1000, // 7 days (matches backend JWT expiration)
      warningThreshold: 5 * 60 * 1000,          // 5 minutes
      autoRefreshThreshold: 60 * 60 * 1000      // 1 hour before expiry
    };

    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      sessionTimeRemaining: 0,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };

    this.initializeFromStorage();
    this.setupEventListeners();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Hydrate the auth state with a token from the server
   * Prevents "flash" of unauthenticated state on first load
   */
  public async initializeWithToken(token: string | null): Promise<void> {
    if (!token || typeof window === 'undefined') return;

    try {
      // If we already have a valid session and it matches the token, skip
      if (this.authState.isAuthenticated && this.authState.token?.accessToken === token) {
        return;
      }

      const storedToken = this.getStoredToken();

      this.authState.isLoading = true;
      this.notifyAuthStateChange();

      // Preserve stored refreshToken if available
      this.authState.token = {
        accessToken: token,
        refreshToken: storedToken?.refreshToken || '',
        expiresAt: storedToken?.expiresAt && storedToken.expiresAt > Date.now()
          ? storedToken.expiresAt
          : Date.now() + this.sessionConfig.timeoutDuration,
        tokenType: 'Bearer'
      };
      this.authState.isAuthenticated = true;
      this.authState.isLoading = false;
      
      this.startSessionTimer();
      this.notifyAuthStateChange();
      
      // Try to fetch the full user profile in the background
      this.getCurrentUser().catch(() => {
        // Silently fail, we still have the token
      });
    } catch (error) {
      console.error('Failed to initialize with token:', error);
      this.authState.isLoading = false;
      this.notifyAuthStateChange();
    }
  }

  private initializeFromStorage(): void {
    // Skip initialization during SSR
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const storedToken = this.getStoredToken();
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        this.authState.token = storedToken;
        this.authState.user = JSON.parse(storedUser);
        this.authState.isAuthenticated = this.isSessionValid();
        
        if (this.authState.isAuthenticated) {
          this.startSessionTimer();
        } else {
          this.clearStoredToken();
        }
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      this.clearStoredToken();
    }
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // Online/offline detection
      window.addEventListener('online', () => {
        this.authState.isOnline = true;
        this.notifyAuthStateChange();
        this.syncOfflineActions();
      });

      window.addEventListener('offline', () => {
        this.authState.isOnline = false;
        this.notifyAuthStateChange();
      });

      // Storage events for cross-tab synchronization
      window.addEventListener('storage', (event) => {
        if (event.key === 'authToken' || event.key === 'user') {
          this.initializeFromStorage();
          this.notifyAuthStateChange();
        }
      });
    }
  }

  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }

    this.sessionTimer = setInterval(() => {
      const timeRemaining = this.getSessionTimeRemaining();
      this.authState.sessionTimeRemaining = timeRemaining;

      if (timeRemaining <= 0) {
        if (!this.isRefreshing && !this.refreshPromise) {
          this.handleSessionExpired();
        }
      } else if (timeRemaining <= this.sessionConfig.warningThreshold) {
        this.notifySessionExpiring(timeRemaining);
      } else if (timeRemaining <= this.sessionConfig.autoRefreshThreshold) {
        if (!this.isRefreshing && !this.refreshPromise) {
          this.autoRefreshToken();
        }
      }

      this.notifyAuthStateChange();
    }, 5000); // Check every 5s instead of aggressive 1s loop
  }

  private async autoRefreshToken(): Promise<void> {
    if (this.isRefreshing || this.refreshPromise) return;
    try {
      const newToken = await this.refreshToken();
      this.notifyTokenRefresh(newToken);
    } catch (error) {
      console.warn('[AuthService] Auto token refresh deferred (session remains active):', error);
    }
  }

  private handleSessionExpired(): void {
    this.logout();
  }

  private notifyAuthStateChange(): void {
    this.authStateListeners.forEach(listener => listener(this.authState));
  }

  private notifySessionExpiring(timeRemaining: number): void {
    this.sessionExpiringListeners.forEach(listener => listener(timeRemaining));
  }

  private notifyTokenRefresh(token: AuthToken): void {
    this.tokenRefreshListeners.forEach(listener => listener(token));
  }

  // Core authentication methods
  async login(credentials: LoginCredentials): Promise<{ user: User; token: AuthToken }> {
    this.authState.isLoading = true;
    this.notifyAuthStateChange();

    try {
      const response = await this.httpClient.post('/api/auth/login', credentials);
      
      const user: User = response.user;
      const accessToken = response.token || response.accessToken;
      const token: AuthToken = {
        accessToken,
        refreshToken: response.refreshToken,
        expiresAt: Date.now() + this.sessionConfig.timeoutDuration,
        tokenType: 'Bearer'
      };

      this.authState.user = user;
      this.authState.token = token;
      this.authState.isAuthenticated = true;
      this.authState.isLoading = false;

      this.setStoredToken(token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      this.startSessionTimer();
      this.notifyAuthStateChange();

      return { user, token };
    } catch (error) {
      this.authState.isLoading = false;
      this.notifyAuthStateChange();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.authState.isAuthenticated && this.authState.isOnline) {
        await this.httpClient.post('/api/auth/logout', {});
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.authState.user = null;
      this.authState.token = null;
      this.authState.isAuthenticated = false;
      this.authState.sessionTimeRemaining = 0;

      this.clearStoredToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      
      if (this.sessionTimer) {
        clearInterval(this.sessionTimer);
        this.sessionTimer = null;
      }

      this.notifyAuthStateChange();
    }
  }

  async refreshToken(): Promise<AuthToken> {
    // If a refresh is already in progress, reuse the existing promise!
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const currentToken = this.authState.token || this.getStoredToken();
    if (!currentToken?.refreshToken) {
      console.warn('[AuthService] No refresh token available in storage.');
      if (this.isSessionValid()) {
        return currentToken as AuthToken;
      }
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await this.httpClient.post('/api/auth/refresh', {
          refreshToken: currentToken.refreshToken
        });

        const accessToken = response.token || response.accessToken;
        if (!accessToken) {
          throw new Error('Invalid token response from server');
        }

        const expiresDuration = response.expiresIn 
          ? response.expiresIn * 1000 
          : this.sessionConfig.timeoutDuration;

        const newToken: AuthToken = {
          accessToken,
          refreshToken: response.refreshToken || currentToken.refreshToken,
          expiresAt: Date.now() + expiresDuration,
          tokenType: 'Bearer'
        };

        this.authState.token = newToken;
        this.authState.isAuthenticated = true;
        this.setStoredToken(newToken);
        this.notifyAuthStateChange();

        return newToken;
      } catch (error: any) {
        // Only log out on definitive 401/403 invalid token errors, NOT transient network/DB timeout errors!
        const isDefinitiveAuthError = error?.status === 401 && (
          error?.message?.includes('Invalid') || 
          error?.message?.includes('expired') || 
          error?.message?.includes('no longer exists')
        );

        if (isDefinitiveAuthError) {
          console.warn('[AuthService] Refresh token permanently rejected by server, logging out...');
          await this.logout();
        } else {
          console.warn('[AuthService] Token refresh temporarily deferred (maintaining session):', error?.message || error);
        }
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await this.httpClient.post('/api/auth/validate', { token });
      return response.valid === true;
    } catch (error) {
      return false;
    }
  }

  // User management
  async getCurrentUser(): Promise<User | null> {
    if (!this.authState.isAuthenticated) {
      return null;
    }

    try {
      const response = await this.httpClient.get('/api/auth/me');
      const user = response.user;
      
      this.authState.user = user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }
      this.notifyAuthStateChange();
      
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return this.authState.user;
    }
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    if (!this.authState.user) {
      throw new Error('No authenticated user');
    }

    const response = await this.httpClient.put('/api/auth/me', userData);
    const updatedUser = response.user;
    
    this.authState.user = updatedUser;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    this.notifyAuthStateChange();
    
    return updatedUser;
  }

  // Permission management
  hasPermission(permission: string): boolean {
    return this.authState.user?.permissions?.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    return this.authState.user?.role === role;
  }

  // Session management
  getSessionTimeRemaining(): number {
    if (!this.authState.token) {
      return 0;
    }
    return Math.max(0, this.authState.token.expiresAt - Date.now());
  }

  async extendSession(): Promise<void> {
    await this.refreshToken();
  }

  isSessionValid(): boolean {
    return this.getSessionTimeRemaining() > 0;
  }

  // Token management
  getStoredToken(): AuthToken | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const stored = localStorage.getItem('authToken');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  setStoredToken(token: AuthToken): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem('authToken', JSON.stringify(token));
  }

  clearStoredToken(): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem('authToken');
  }

  // Offline support
  queueOfflineAction(action: OfflineAction): void {
    this.offlineActions.push(action);
    if (typeof window !== 'undefined') {
      if (typeof window !== 'undefined') {
      localStorage.setItem('offlineActions', JSON.stringify(this.offlineActions));
    }
    }
  }

  async syncOfflineActions(): Promise<void> {
    if (!this.authState.isOnline || this.offlineActions.length === 0) {
      return;
    }

    const actionsToSync = [...this.offlineActions];
    
    for (const action of actionsToSync) {
      try {
        // Process offline action based on type
        await this.processOfflineAction(action);
        
        // Remove successfully processed action
        this.offlineActions = this.offlineActions.filter(a => a !== action);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
      }
    }

    localStorage.setItem('offlineActions', JSON.stringify(this.offlineActions));
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    // Implement specific offline action processing logic
    // This would depend on the types of actions your app supports
    console.log('Processing offline action:', action);
  }

  getOfflineActions(): OfflineAction[] {
    return [...this.offlineActions];
  }

  clearOfflineActions(): void {
    this.offlineActions = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('offlineActions');
    }
  }

  // Event handlers
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  onSessionExpiring(callback: (timeRemaining: number) => void): () => void {
    this.sessionExpiringListeners.push(callback);
    
    return () => {
      this.sessionExpiringListeners = this.sessionExpiringListeners.filter(listener => listener !== callback);
    };
  }

  onTokenRefresh(callback: (token: AuthToken) => void): () => void {
    this.tokenRefreshListeners.push(callback);
    
    return () => {
      this.tokenRefreshListeners = this.tokenRefreshListeners.filter(listener => listener !== callback);
    };
  }

  // Public getter for current auth state
  getAuthState(): AuthState {
    return { ...this.authState };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default AuthService;