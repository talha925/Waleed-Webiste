import { revalidationClient } from './revalidation-client';
import { websocketHealthMonitor } from './websocket-health';
import config from './config';

/**
 * WebSocket Client Options Interface
 */
interface WebSocketClientOptions {
  url?: string;
  protocols?: string[];
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  timeoutInterval?: number;
  enableLogging?: boolean;
  onopen?: (event: Event) => void;
  onclose?: (event: CloseEvent) => void;
  onconnecting?: () => void;
  onmessage?: (event: MessageEvent) => void;
  onerror?: (error: Event) => void;
}

/**
 * WebSocket Message Interface
 */
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

/**
 * Subscription Interface
 */
interface Subscription {
  type: string;
  resource: string;
  identifier: string;
  timestamp: number;
}

/**
 * WebSocket Client for Real-time Updates
 * Features: Auto-reconnect, JWT auth, subscription management, exponential backoff
 * Integrates with Next.js caching and revalidation system
 */
class WebSocketClient {
  // Connection properties
  public url: string;
  public protocols: string[];
  public ws: WebSocket | null;
  public forcedClose: boolean;
  public timedOut: boolean;
  
  // Reconnection properties
  public reconnectAttempts: number;
  public maxReconnectAttempts: number;
  public reconnectInterval: number;
  public maxReconnectInterval: number;
  public reconnectDecay: number;
  public timeoutInterval: number;
  
  // Authentication and messaging
  public authToken: string | null;
  public isAuthenticated: boolean;
  public subscriptions: Map<string, Subscription>;
  public messageQueue: string[];
  
  // Configuration
  public enableLogging: boolean;
  
  // Event handlers
  public onopen: (event: Event) => void;
  public onclose: (event: CloseEvent) => void;
  public onconnecting: () => void;
  public onmessage: (event: MessageEvent) => void;
  public onerror: (error: Event) => void;
  
  // Multiple handler support
  private messageHandlers: Set<(message: any) => void>;
  private connectionHandlers: Set<(connected: boolean) => void>;
  private errorHandlers: Set<(error: string) => void>;
  
  // Health monitoring
  public healthCheckInterval: NodeJS.Timeout | null;
  public lastPongTime: number;

  constructor(options: WebSocketClientOptions = {}) {
    this.url = options.url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    this.protocols = options.protocols || [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectInterval = options.reconnectInterval || 1000; // Start with 1 second
    this.maxReconnectInterval = options.maxReconnectInterval || 30000; // Max 30 seconds
    this.reconnectDecay = options.reconnectDecay || 1.5; // Exponential backoff multiplier
    this.timeoutInterval = options.timeoutInterval || 2000;
    this.enableLogging = options.enableLogging !== false;
    
    this.ws = null;
    this.forcedClose = false;
    this.timedOut = false;
    this.subscriptions = new Map(); // Store active subscriptions
    this.messageQueue = []; // Queue messages when disconnected
    this.authToken = null;
    this.isAuthenticated = false;
    
    // Initialize handler sets
    this.messageHandlers = new Set();
    this.connectionHandlers = new Set();
    this.errorHandlers = new Set();
    
    // Event handlers
    this.onopen = options.onopen || (() => {});
    this.onclose = options.onclose || (() => {});
    this.onconnecting = options.onconnecting || (() => {});
    this.onmessage = options.onmessage || (() => {});
    this.onerror = options.onerror || (() => {});
    
    // Bind methods to preserve context
    this.connect = this.connect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.send = this.send.bind(this);
    this.close = this.close.bind(this);
    
    // Health check interval
    this.healthCheckInterval = null;
    this.lastPongTime = Date.now();
    
    this.log('WebSocket client initialized');
  }

  /**
   * Set message handler
   */
  setMessageHandler(handler: (message: any) => void): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Set connection handler
   */
  setConnectionHandler(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Set error handler
   */
  setErrorHandler(handler: (error: string) => void): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * Notify all message handlers
   */
  private notifyMessageHandlers(message: any): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        this.log('Error in message handler:', error);
      }
    });
  }

  /**
   * Notify all connection handlers
   */
  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        this.log('Error in connection handler:', error);
      }
    });
  }

  /**
   * Notify all error handlers
   */
  private notifyErrorHandlers(error: string): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (error) {
        this.log('Error in error handler:', error);
      }
    });
  }

  log(message: string, data: any = null): void {
    if (this.enableLogging) {
      const timestamp = new Date().toISOString();
      console.log(`[WebSocket ${timestamp}] ${message}`, data || '');
    }
  }

  /**
   * Set JWT authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    this.log('Auth token updated');
    
    // If already connected, send auth message
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.authenticate();
    }
  }

  /**
   * Send authentication message
   */
  authenticate(): void {
    if (!this.authToken) {
      this.log('No auth token available');
      websocketHealthMonitor.onAuthError('No authentication token provided');
      return;
    }

    const authMessage: WebSocketMessage = {
      type: 'auth',
      token: this.authToken,
      timestamp: Date.now()
    };

    this.send(authMessage);
    this.log('Authentication message sent');
  }

  /**
   * Connect to WebSocket server
   */
  connect(reconnectAttempt: boolean = false): void {
    this.forcedClose = false;
    // Prevent duplicate connections if one is already open or connecting
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.log('WebSocket connection attempt ignored (already open or connecting)');
      return;
    }

    this.log(`${reconnectAttempt ? 'Reconnecting' : 'Connecting'} to WebSocket...`);
    this.onconnecting();

    websocketHealthMonitor.onConnectionAttempt();

    try {
      this.ws = new WebSocket(this.url, this.protocols);
      
      // Set up event handlers
      this.ws.onopen = (event) => {
        this.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000; // Reset interval
        this.timedOut = false;
        
        websocketHealthMonitor.onConnectionSuccess();
        if (this.ws) {
          websocketHealthMonitor.startPingMonitoring(this.ws);
        }
        
        // Notify connection handlers
        this.notifyConnectionHandlers(true);
        
        // Authenticate if token is available
        if (this.authToken) {
          this.authenticate();
        }
        
        // Process queued messages
        this.processMessageQueue();
        
        // Start health check
        this.startHealthCheck();
        
        this.onopen(event);
      };

      this.ws.onclose = (event) => {
        this.log('WebSocket connection closed', { 
          code: event.code, 
          reason: event.reason, 
          wasClean: event.wasClean 
        });
        
        this.stopHealthCheck();
        this.isAuthenticated = false;
        websocketHealthMonitor.onDisconnection();
        websocketHealthMonitor.stopPingMonitoring();
        
        // Notify connection handlers
        this.notifyConnectionHandlers(false);
        
        this.onclose(event);
        
        if (!this.forcedClose) {
          this.reconnect();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          websocketHealthMonitor.onMessageReceived();
          
          // Handle ping/pong for latency measurement
          if (message.type === 'pong' && message.timestamp) {
            websocketHealthMonitor.onPongReceived(message.timestamp);
            return;
          }
          
          console.log('WebSocket message received:', message);
          this.handleMessage(event);
        } catch (error: unknown) {
          this.log('Error parsing message:', error);
          websocketHealthMonitor.onMessageError((error as Error).message || 'Message parsing error');
        }
      };

      this.ws.onerror = (error: Event): void => {
        this.log('WebSocket error:', error);
        websocketHealthMonitor.onConnectionFailure((error as any).message || 'Connection error');
        
        // Notify error handlers
        this.notifyErrorHandlers((error as any).message || 'WebSocket connection error');
        
        this.onerror(error);
      };

      // Set connection timeout
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.log('Connection timeout');
          this.timedOut = true;
          this.ws.close();
        }
      }, this.timeoutInterval);

    } catch (error: unknown) {
      this.log('Failed to create WebSocket connection', error);
      // Create a proper Event object for the error handler
      const errorEvent = new Event('error');
      (errorEvent as any).error = error;
      this.onerror(errorEvent);
      this.reconnect();
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.log('Message received', data);

      // Notify message handlers first
      this.notifyMessageHandlers(data);

      // Handle different message types
      switch (data.type) {
        case 'auth_success':
          this.isAuthenticated = true;
          this.log('Authentication successful');
          // Resubscribe to all active subscriptions
          this.resubscribeAll();
          break;
          
        case 'auth_failed':
          this.isAuthenticated = false;
          this.log('Authentication failed', data.message);
          break;
          
        case 'pong':
          this.lastPongTime = Date.now();
          break;
          
        case 'store_updated':
          this.handleStoreUpdate(data);
          break;
          
        case 'coupon_updated':
        case 'coupon_created':
        case 'coupon_deleted':
          this.handleCouponUpdate(data);
          break;
          
        case 'category_updated':
          this.handleCategoryUpdate(data);
          break;
          
        case 'blog_updated':
        case 'blog_created':
        case 'blog_deleted':
          this.handleBlogUpdate(data);
          break;
          
        case 'bulk_update':
          this.handleBulkUpdate(data);
          break;
          
        default:
          // Pass to custom message handler
          this.onmessage(event);
      }
    } catch (error) {
      this.log('Error parsing message', error);
      this.notifyErrorHandlers('Error parsing message: ' + (error as Error).message);
      // Still call onmessage for raw data
      this.onmessage(event);
    }
  }

  /**
   * Handle store update notifications
   */
  async handleStoreUpdate(data: any): Promise<void> {
    const { storeSlug, action } = data;
    this.log(`Store update: ${action} for ${storeSlug}`);
    
    try {
      // Use revalidation client for efficient cache management
      if (storeSlug) {
        await revalidationClient.revalidateStore(storeSlug, 'websocket');
        this.log(`Revalidated store: ${storeSlug}`);
      }
    } catch (error) {
      this.log('Error revalidating store', error);
    }
    
    // Emit custom event for UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('store_updated', { 
        detail: { storeSlug, action, data } 
      }));
    }
  }

  /**
   * Handle coupon update notifications
   */
  async handleCouponUpdate(data: any): Promise<void> {
    const { couponId, storeSlug, action } = data;
    this.log(`Coupon update: ${action} for coupon ${couponId}`);
    
    try {
      // Use revalidation client for efficient cache management
      if (couponId && storeSlug) {
        await revalidationClient.revalidateCoupon(couponId, storeSlug, 'websocket');
        this.log(`Revalidated coupon: ${couponId}`);
      }
    } catch (error) {
      this.log('Error revalidating coupon', error);
    }
    
    // Emit custom event for UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coupon_updated', { 
        detail: { couponId, storeSlug, action, data } 
      }));
    }
  }

  /**
   * Handle category update notifications
   */
  async handleCategoryUpdate(data: any): Promise<void> {
    const { categoryId, categorySlug, action } = data;
    this.log(`Category update: ${action} for category ${categoryId}`);
    
    try {
      // Use revalidation client for efficient cache management
      if (categorySlug) {
        await revalidationClient.revalidateCategory(categorySlug, 'websocket');
        this.log(`Revalidated category: ${categorySlug}`);
      }
    } catch (error) {
      this.log('Error revalidating category', error);
    }
    
    // Emit custom event for UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('category_updated', { 
        detail: { categoryId, categorySlug, action, data } 
      }));
    }
  }

  /**
   * Handle blog update notifications
   */
  async handleBlogUpdate(data: any): Promise<void> {
    const { blogId, action } = data;
    this.log(`Blog update: ${action} for blog ${blogId}`);
    
    try {
      // Use revalidation client for efficient cache management
      if (blogId) {
        await revalidationClient.revalidateBlog(blogId, 'websocket');
        this.log(`Revalidated blog: ${blogId}`);
      }
    } catch (error) {
      this.log('Error revalidating blog', error);
    }
    
    // Emit custom event for UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('blog_updated', { 
        detail: { blogId, action, data } 
      }));
    }
  }

  /**
   * Handle bulk update notifications
   */
  async handleBulkUpdate(data: any): Promise<void> {
    const { tags, action } = data;
    this.log(`Bulk update: ${action} for tags ${tags?.join(', ')}`);
    
    try {
      // Use revalidation client for efficient bulk operations
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          await revalidationClient.revalidateByTag(tag, 'websocket');
        }
        this.log(`Revalidated tags: ${tags.join(', ')}`);
      }
    } catch (error) {
      this.log('Error revalidating bulk update', error);
    }
    
    // Emit custom event for UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bulk_updated', { 
        detail: { tags, action, data } 
      }));
    }
  }

  /**
   * Subscribe to updates for specific resources
   */
  subscribe(type: string, identifier: string): void {
    const subscriptionKey = `${type}:${identifier}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.log(`Already subscribed to ${subscriptionKey}`);
      return;
    }

    const subscription: Subscription = {
      type: 'subscribe',
      resource: type,
      identifier,
      timestamp: Date.now()
    };

    this.subscriptions.set(subscriptionKey, subscription);
    
    if (this.isConnected() && this.isAuthenticated) {
      this.send(subscription);
      this.log(`Subscribed to ${subscriptionKey}`);
    } else {
      this.log(`Subscription queued: ${subscriptionKey}`);
    }
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(type: string, identifier: string): void {
    const subscriptionKey = `${type}:${identifier}`;
    
    if (!this.subscriptions.has(subscriptionKey)) {
      this.log(`Not subscribed to ${subscriptionKey}`);
      return;
    }

    const unsubscription: WebSocketMessage = {
      type: 'unsubscribe',
      resource: type,
      identifier,
      timestamp: Date.now()
    };

    this.subscriptions.delete(subscriptionKey);
    
    if (this.isConnected() && this.isAuthenticated) {
      this.send(unsubscription);
      this.log(`Unsubscribed from ${subscriptionKey}`);
    }
  }

  /**
   * Resubscribe to all active subscriptions
   */
  resubscribeAll(): void {
    this.log(`Resubscribing to ${this.subscriptions.size} subscriptions`);
    
    const subscriptionsArray = Array.from(this.subscriptions.entries());
    for (const [key, subscription] of subscriptionsArray) {
      this.send(subscription);
    }
  }

  /**
   * Send message to server
   */
  send(data: WebSocketMessage | string): void {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.isConnected()) {
      try {
        this.ws!.send(message);
        websocketHealthMonitor.onMessageSent();
        this.log('Message sent', data);
      } catch (error: unknown) {
        console.error('Error sending WebSocket message:', error);
        websocketHealthMonitor.onMessageError((error as Error).message || 'Message sending error');
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      this.log('Message queued (not connected)', data);
    }
  }

  /**
   * Process queued messages
   */
  processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;
    
    this.log(`Processing ${this.messageQueue.length} queued messages`);
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(message);
      }
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Reconnect with exponential backoff
   */
  reconnect(): void {
    if (this.forcedClose) {
      this.log('Reconnection cancelled (forced close)');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      return;
    }

    websocketHealthMonitor.onReconnectionAttempt();

    this.reconnectAttempts++;
    
    const timeout = this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts - 1);
    const actualTimeout = Math.min(timeout, this.maxReconnectInterval);
    
    this.log(`Reconnecting in ${actualTimeout}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(true);
    }, actualTimeout);
  }

  /**
   * Start health check (ping/pong)
   */
  startHealthCheck(): void {
    this.stopHealthCheck(); // Clear any existing interval
    
    this.healthCheckInterval = setInterval(() => {
      if (this.isConnected()) {
        // Check if we received a pong recently
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        
        if (timeSinceLastPong > 60000) { // 1 minute timeout
          this.log('Health check failed - no pong received');
          if (this.ws) {
            this.ws.close();
          }
          return;
        }
        
        // Send ping
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop health check
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Close WebSocket connection
   */
  close(code: number = 1000, reason: string = 'Normal closure'): void {
    this.forcedClose = true;
    this.stopHealthCheck();
    
    if (this.ws) {
      this.ws.close(code, reason);
      this.log('WebSocket connection closed manually');
    }
  }

  // Add method to get health status
  getHealthStatus(): any {
    return websocketHealthMonitor.getHealthStatus();
  }

  getHealthMetrics(): any {
    return websocketHealthMonitor.getMetrics();
  }

  // Cleanup method
  destroy(): void {
    this.forcedClose = true;
    websocketHealthMonitor.stopPingMonitoring();
    
    if (this.ws) {
      this.ws.close();
    }
    
    this.stopHealthCheck();
  }

  /**
   * Get connection statistics
   */
  getStats(): any {
    return {
      connected: this.isConnected(),
      authenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: this.subscriptions.size,
      queuedMessages: this.messageQueue.length,
      lastPongTime: this.lastPongTime,
      readyState: this.ws ? this.ws.readyState : null
    };
  }
}

// Singleton instance for global use
let wsClient: WebSocketClient | null = null;

/**
 * No-op WebSocket client used when realtime mode is not ws-managed
 * Implements the same surface so hooks/components don't need conditionals
 */
class NoopWebSocketClient {
  public ws: WebSocket | null = null;
  public enableLogging = false;
  private messageHandlers: Set<(message: any) => void> = new Set();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private errorHandlers: Set<(error: string) => void> = new Set();

  setMessageHandler(handler: (message: any) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  setConnectionHandler(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    // Immediately reflect disconnected status
    try { handler(false); } catch {}
    return () => this.connectionHandlers.delete(handler);
  }

  setErrorHandler(handler: (error: string) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  isConnected(): boolean { return false; }
  connect(): void {
    // Notify that connection is not available (avoid for..of for ES5 target)
    this.connectionHandlers.forEach((h) => { try { h(false); } catch {} });
  }
  close(): void { /* no-op */ }
  subscribe(): void { /* no-op */ }
  unsubscribe(): void { /* no-op */ }
  send(): void { /* no-op */ }
  getHealthStatus(): any {
    return {
      status: 'healthy',
      score: 100,
      issues: [],
      recommendations: ['Realtime disabled: mode is not ws-managed'],
    };
  }
  getHealthMetrics(): any {
    return {
      connectionAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      reconnectionAttempts: 0,
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 0,
      lastConnectionTime: null,
      lastDisconnectionTime: null,
      connectionDuration: 0,
      errors: [],
    };
  }
}

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(options: WebSocketClientOptions = {}): WebSocketClient {
  // Only instantiate a real WebSocket client when explicitly enabled
  const mode = (config as any)?.realtime?.mode || process.env.NEXT_PUBLIC_REALTIME_MODE || 'http-only';
  const shouldUseWS = mode === 'ws-managed' || mode === 'ws';

  if (!wsClient) {
    wsClient = shouldUseWS ? new WebSocketClient(options) : (new NoopWebSocketClient() as unknown as WebSocketClient);
  }
  return wsClient;
}

/**
 * Initialize WebSocket client with authentication
 */
export function initializeWebSocket(authToken?: string, options: WebSocketClientOptions = {}): WebSocketClient {
  const client = getWebSocketClient(options);
  
  if (authToken) {
    client.setAuthToken(authToken);
  }
  
  // Auto-connect if not already connected
  if (!client.isConnected()) {
    client.connect();
  }
  
  return client;
}

/**
 * Subscribe to store updates
 */
export function subscribeToStore(storeSlug: string): void {
  const client = getWebSocketClient();
  client.subscribe('store', storeSlug);
}

/**
 * Subscribe to coupon updates
 */
export function subscribeToCoupon(couponId: string): void {
  const client = getWebSocketClient();
  client.subscribe('coupon', couponId);
}

/**
 * Subscribe to category updates
 */
export function subscribeToCategories(): void {
  const client = getWebSocketClient();
  client.subscribe('categories', 'all');
}

/**
 * Cleanup WebSocket connection
 */
export function cleanupWebSocket(): void {
  if (wsClient) {
    wsClient.close();
    wsClient = null;
  }
}

export default WebSocketClient;
