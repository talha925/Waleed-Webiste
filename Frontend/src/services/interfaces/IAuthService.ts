/**
 * Authentication Service Interface
 * Defines the contract for authentication operations
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  permissions?: string[];
  avatar?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionTimeRemaining: number;
  isOnline: boolean;
}

export interface SessionConfig {
  timeoutDuration: number;
  warningThreshold: number;
  autoRefreshThreshold: number;
}

export interface OfflineAction {
  action: string;
  data: any;
  timestamp: number;
}

export interface IAuthService {
  // Core authentication methods
  login(credentials: LoginCredentials): Promise<{ user: User; token: AuthToken }>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthToken>;
  validateToken(token: string): Promise<boolean>;
  
  // User management
  getCurrentUser(): Promise<User | null>;
  updateUser(userData: Partial<User>): Promise<User>;
  
  // Permission management
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  
  // Session management
  getSessionTimeRemaining(): number;
  extendSession(): Promise<void>;
  isSessionValid(): boolean;
  
  // Token management
  getStoredToken(): AuthToken | null;
  setStoredToken(token: AuthToken): void;
  clearStoredToken(): void;
  
  // Offline support
  queueOfflineAction(action: OfflineAction): void;
  syncOfflineActions(): Promise<void>;
  getOfflineActions(): OfflineAction[];
  clearOfflineActions(): void;
  
  // Event handlers
  onAuthStateChange(callback: (state: AuthState) => void): () => void;
  onSessionExpiring(callback: (timeRemaining: number) => void): () => void;
  onTokenRefresh(callback: (token: AuthToken) => void): () => void;
}