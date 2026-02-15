import { useState, useEffect, useCallback, useRef } from 'react';
import { getWebSocketClient } from '@/lib/websocket-client';
import type { HealthStatus, HealthMetrics } from '@/lib/websocket-health';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (topics: string[]) => void;
  unsubscribe: (topics: string[]) => void;
  sendMessage: (message: any) => void;
  healthStatus: HealthStatus | null;
  healthMetrics: HealthMetrics | null;
  refreshHealth: () => void;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  subscriptions?: string[];
}

/**
 * Hook for WebSocket functionality with real-time updates
 * Integrates with the WebSocket client and provides React-friendly interface
 */
export const useWebSocket = (
  arg1: boolean | UseWebSocketOptions = true,
  arg2: string[] = []
): UseWebSocketReturn => {
  const resolvedAutoConnect = typeof arg1 === 'object' && arg1 !== null
    ? (arg1.autoConnect ?? true)
    : (arg1 as boolean);
  const resolvedSubscriptions = typeof arg1 === 'object' && arg1 !== null
    ? (arg1.subscriptions ?? [])
    : (arg2 ?? []);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set(resolvedSubscriptions));
  
  // Get WebSocket client instance
  const websocketClient = getWebSocketClient();

  // Connection state handler
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    setConnectionState(connected ? 'connected' : 'disconnected');
    
    if (connected) {
      setError(null);
      // Re-subscribe to topics after reconnection
      if (subscriptionsRef.current.size > 0) {
        const topics = Array.from(subscriptionsRef.current);
        topics.forEach(topic => {
          const [type, identifier] = topic.split(':');
          if (type && identifier) {
            websocketClient.subscribe(type, identifier);
          }
        });
      }
    }
  }, [websocketClient]);

  // Message handler
  const handleMessage = useCallback((message: WebSocketMessage) => {
    setLastMessage({
      ...message,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Error handler
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setConnectionState('error');
  }, []);

  // Connect function
  const connect = useCallback(() => {
    const readyState = websocketClient.ws?.readyState;
    const isClientConnecting = readyState === WebSocket.CONNECTING;
    const isClientOpen = readyState === WebSocket.OPEN;
    if (!isConnected && connectionState !== 'connecting' && !isClientConnecting && !isClientOpen) {
      setConnectionState('connecting');
      setError(null);
      websocketClient.connect();
    }
  }, [isConnected, connectionState, websocketClient]);

  // Disconnect function
  const disconnect = useCallback(() => {
    websocketClient.close();
    setConnectionState('disconnected');
  }, [websocketClient]);

  // Subscribe function
  const subscribe = useCallback((topics: string[]) => {
    topics.forEach(topic => subscriptionsRef.current.add(topic));
    
    if (isConnected) {
      // WebSocket client expects individual subscribe calls with type and identifier
      topics.forEach(topic => {
        const [type, identifier] = topic.split(':');
        if (type && identifier) {
          websocketClient.subscribe(type, identifier);
        }
      });
    }
  }, [isConnected, websocketClient]);

  // Unsubscribe function
  const unsubscribe = useCallback((topics: string[]) => {
    topics.forEach(topic => subscriptionsRef.current.delete(topic));
    
    if (isConnected) {
      // WebSocket client expects individual unsubscribe calls with type and identifier
      topics.forEach(topic => {
        const [type, identifier] = topic.split(':');
        if (type && identifier) {
          websocketClient.unsubscribe(type, identifier);
        }
      });
    }
  }, [isConnected, websocketClient]);

  // Send message function
  const sendMessage = useCallback((message: any) => {
    if (isConnected) {
      websocketClient.send(message);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [isConnected, websocketClient]);

  // Set up WebSocket event handlers with proper cleanup
  useEffect(() => {
    const client = websocketClient;
    
    // Set up handlers and get unsubscribe functions
    const unsubscribeMessage = client.setMessageHandler((message: WebSocketMessage) => {
      handleMessage(message);
    });

    const unsubscribeConnection = client.setConnectionHandler((connected: boolean) => {
      handleConnectionChange(connected);
    });

    const unsubscribeError = client.setErrorHandler((err: string) => {
      handleError(err);
    });

    // Sync initial state and auto-connect if needed
    handleConnectionChange(websocketClient.isConnected());
    if (resolvedAutoConnect && !websocketClient.isConnected()) {
      connect();
    }

    // Cleanup function with proper unsubscribe
    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
      unsubscribeError();
    };
  }, [resolvedAutoConnect, connect, handleConnectionChange, handleMessage, handleError, websocketClient]);

  // Handle initial subscriptions
  useEffect(() => {
    if (isConnected && resolvedSubscriptions.length > 0) {
      subscribe(resolvedSubscriptions);
    }
  }, [isConnected, subscribe, resolvedSubscriptions]);

  // Health status state
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);

  // Health monitoring effect
  useEffect(() => {
    const updateHealth = () => {
      if (websocketClient.getHealthStatus) {
        setHealthStatus(websocketClient.getHealthStatus());
      }
      if (websocketClient.getHealthMetrics) {
        setHealthMetrics(websocketClient.getHealthMetrics());
      }
    };

    // Update health immediately
    updateHealth();

    // Set up periodic health updates
    const healthInterval = setInterval(updateHealth, 5000); // Every 5 seconds

    // Listen for health events
    const handleHealthUpdate = (event: CustomEvent) => {
      setHealthStatus(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('websocket-health-update', handleHealthUpdate as EventListener);
    }

    return () => {
      clearInterval(healthInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('websocket-health-update', handleHealthUpdate as EventListener);
      }
    };
  }, [isConnected, websocketClient]);

  const refreshHealth = useCallback(() => {
    if (websocketClient.getHealthStatus) {
      setHealthStatus(websocketClient.getHealthStatus());
    }
    if (websocketClient.getHealthMetrics) {
      setHealthMetrics(websocketClient.getHealthMetrics());
    }
  }, [websocketClient]);

  return {
    isConnected,
    connectionState,
    lastMessage,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    healthStatus,
    healthMetrics,
    refreshHealth,
  };
};
