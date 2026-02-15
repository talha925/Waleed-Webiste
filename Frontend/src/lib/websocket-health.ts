interface HealthMetrics {
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  reconnectionAttempts: number;
  messagesReceived: number;
  messagesSent: number;
  averageLatency: number;
  lastConnectionTime: number | null;
  lastDisconnectionTime: number | null;
  connectionDuration: number;
  errors: Array<{
    timestamp: number;
    error: string;
    type: 'connection' | 'message' | 'auth' | 'network';
  }>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

class WebSocketHealthMonitor {
  private metrics: HealthMetrics = {
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
    errors: []
  };

  private latencyMeasurements: number[] = [];
  private connectionStartTime: number | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic health checks
    this.startHealthChecks();
  }

  // Connection Events
  onConnectionAttempt(): void {
    this.metrics.connectionAttempts++;
    this.connectionStartTime = Date.now();
  }

  onConnectionSuccess(): void {
    this.metrics.successfulConnections++;
    this.metrics.lastConnectionTime = Date.now();
    
    if (this.connectionStartTime) {
      const connectionTime = Date.now() - this.connectionStartTime;
      this.updateLatency(connectionTime);
    }
  }

  onConnectionFailure(error: string): void {
    this.metrics.failedConnections++;
    this.addError(error, 'connection');
  }

  onReconnectionAttempt(): void {
    this.metrics.reconnectionAttempts++;
  }

  onDisconnection(): void {
    this.metrics.lastDisconnectionTime = Date.now();
    
    if (this.metrics.lastConnectionTime) {
      this.metrics.connectionDuration += Date.now() - this.metrics.lastConnectionTime;
    }
  }

  // Message Events
  onMessageReceived(): void {
    this.metrics.messagesReceived++;
  }

  onMessageSent(): void {
    this.metrics.messagesSent++;
  }

  onMessageError(error: string): void {
    this.addError(error, 'message');
  }

  // Authentication Events
  onAuthError(error: string): void {
    this.addError(error, 'auth');
  }

  // Network Events
  onNetworkError(error: string): void {
    this.addError(error, 'network');
  }

  // Latency Tracking
  private updateLatency(latency: number): void {
    this.latencyMeasurements.push(latency);
    
    // Keep only last 100 measurements
    if (this.latencyMeasurements.length > 100) {
      this.latencyMeasurements.shift();
    }
    
    // Calculate average
    this.metrics.averageLatency = 
      this.latencyMeasurements.reduce((sum, val) => sum + val, 0) / 
      this.latencyMeasurements.length;
  }

  // Error Tracking
  private addError(error: string, type: HealthMetrics['errors'][0]['type']): void {
    this.metrics.errors.push({
      timestamp: Date.now(),
      error,
      type
    });

    // Keep only last 50 errors
    if (this.metrics.errors.length > 50) {
      this.metrics.errors.shift();
    }
  }

  // Health Assessment
  getHealthStatus(): HealthStatus {
    const now = Date.now();
    const recentErrors = this.metrics.errors.filter(
      error => now - error.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Connection success rate
    const totalConnections = this.metrics.connectionAttempts;
    const successRate = totalConnections > 0 
      ? this.metrics.successfulConnections / totalConnections 
      : 1;

    if (successRate < 0.9) {
      score -= 30;
      issues.push(`Low connection success rate: ${(successRate * 100).toFixed(1)}%`);
      recommendations.push('Check network connectivity and server availability');
    }

    // Recent errors
    if (recentErrors.length > 5) {
      score -= 25;
      issues.push(`High error rate: ${recentErrors.length} errors in last 5 minutes`);
      recommendations.push('Investigate recent error patterns');
    }

    // Latency
    if (this.metrics.averageLatency > 1000) {
      score -= 20;
      issues.push(`High latency: ${this.metrics.averageLatency.toFixed(0)}ms`);
      recommendations.push('Check network conditions and server performance');
    }

    // Reconnection frequency
    if (this.metrics.reconnectionAttempts > 10) {
      score -= 15;
      issues.push(`Frequent reconnections: ${this.metrics.reconnectionAttempts} attempts`);
      recommendations.push('Investigate connection stability issues');
    }

    // Connection recency
    const timeSinceLastConnection = this.metrics.lastConnectionTime 
      ? now - this.metrics.lastConnectionTime 
      : Infinity;

    if (timeSinceLastConnection > 10 * 60 * 1000) { // 10 minutes
      score -= 40;
      issues.push('No recent successful connection');
      recommendations.push('Attempt to reconnect to WebSocket server');
    }

    // Determine status
    let status: HealthStatus['status'];
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  // Metrics Access
  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  getRecentErrors(minutes: number = 5): HealthMetrics['errors'] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.metrics.errors.filter(error => error.timestamp > cutoff);
  }

  // Ping/Pong for latency measurement
  startPingMonitoring(websocket: WebSocket): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        
        // Send ping message
        websocket.send(JSON.stringify({
          type: 'ping',
          timestamp: pingTime
        }));

        // Note: Pong response should be handled in message listener
        // to calculate actual round-trip time
      }
    }, 30000); // Ping every 30 seconds
  }

  onPongReceived(pingTimestamp: number): void {
    const latency = Date.now() - pingTimestamp;
    this.updateLatency(latency);
  }

  stopPingMonitoring(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Health Check Automation
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      const health = this.getHealthStatus();
      
      // Log health status for monitoring
      console.log('WebSocket Health Check:', {
        status: health.status,
        score: health.score,
        issues: health.issues
      });

      // Emit health events for external monitoring
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('websocket-health-update', {
          detail: health
        }));
      }
    }, 60000); // Check every minute
  }

  // Cleanup
  destroy(): void {
    this.stopPingMonitoring();
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Reset metrics (useful for testing)
  reset(): void {
    this.metrics = {
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
      errors: []
    };
    
    this.latencyMeasurements = [];
    this.connectionStartTime = null;
  }

  // Export metrics for external monitoring
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      health: this.getHealthStatus(),
      timestamp: Date.now()
    }, null, 2);
  }
}

// Singleton instance
export const websocketHealthMonitor = new WebSocketHealthMonitor();

// Export types
export type { HealthMetrics, HealthStatus };export { WebSocketHealthMonitor };
