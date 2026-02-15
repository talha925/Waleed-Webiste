'use client';

import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge, Button } from '@/components/common/UnifiedComponents';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Activity,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebSocketStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function WebSocketStatus({ className, showDetails = false }: WebSocketStatusProps) {
  const { 
    isConnected, 
    connectionState, 
    connect, 
    disconnect,
    healthStatus,
    healthMetrics,
    refreshHealth
  } = useWebSocket();

  const getStatusIcon = () => {
    if (connectionState === 'connecting') {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    if (isConnected) {
      if (healthStatus?.status === 'healthy') {
        return <Wifi className="w-4 h-4" />;
      } else if (healthStatus?.status === 'degraded') {
        return <AlertTriangle className="w-4 h-4" />;
      } else {
        return <Activity className="w-4 h-4" />;
      }
    }
    
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (connectionState === 'connecting') {
      return 'bg-yellow-500';
    }
    
    if (isConnected) {
      if (healthStatus?.status === 'healthy') {
        return 'bg-green-500';
      } else if (healthStatus?.status === 'degraded') {
        return 'bg-yellow-500';
      } else {
        return 'bg-orange-500';
      }
    }
    
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (connectionState === 'connecting') return 'Connecting...';
    if (isConnected) {
      if (healthStatus?.status === 'healthy') return 'Connected';
      if (healthStatus?.status === 'degraded') return 'Degraded';
      if (healthStatus?.status === 'unhealthy') return 'Unhealthy';
      return 'Connected';
    }
    if (connectionState === 'error') return 'Error';
    return 'Disconnected';
  };

  if (!showDetails) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Badge 
          variant="outline" 
          className={cn("text-white border-0", getStatusColor())}
        >
          {getStatusIcon()}
          <span className="ml-1 text-xs">{getStatusText()}</span>
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={cn("text-white border-0", getStatusColor())}
          >
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
          
          {healthStatus && (
            <Badge variant="outline">
              Score: {healthStatus.score}/100
            </Badge>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={refreshHealth}
            variant="outline"
            size="sm"
          >
            <Activity className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          
          {isConnected ? (
            <Button
              onClick={disconnect}
              variant="outline"
              size="sm"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={connect}
              variant="outline"
              size="sm"
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      {healthStatus && healthStatus.issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-destructive">Issues:</h4>
          <ul className="text-xs space-y-1">
            {healthStatus.issues.map((issue, index) => (
              <li key={index} className="flex items-start space-x-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 text-destructive flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {healthStatus && healthStatus.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-600">Recommendations:</h4>
          <ul className="text-xs space-y-1">
            {healthStatus.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <Activity className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {healthMetrics && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Messages:</span>
            <div>↑ {healthMetrics.messagesSent} ↓ {healthMetrics.messagesReceived}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Latency:</span>
            <div>{healthMetrics.averageLatency.toFixed(0)}ms</div>
          </div>
          <div>
            <span className="text-muted-foreground">Connections:</span>
            <div>{healthMetrics.successfulConnections}/{healthMetrics.connectionAttempts}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Reconnects:</span>
            <div>{healthMetrics.reconnectionAttempts}</div>
          </div>
        </div>
      )}
    </div>
  );
};