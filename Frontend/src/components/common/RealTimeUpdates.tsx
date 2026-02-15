'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';

interface UpdateNotification {
  id: string;
  type: 'store' | 'coupon' | 'category' | 'blog';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  message: string;
  timestamp: Date;
}

interface RealTimeUpdatesProps {
  className?: string;
  maxNotifications?: number;
  autoHide?: boolean;
  hideDelay?: number;
}

/**
 * Real-time updates component
 * Displays notifications for WebSocket-received updates
 */
export const RealTimeUpdates: React.FC<RealTimeUpdatesProps> = ({
  className,
  maxNotifications = 5,
  autoHide = true,
  hideDelay = 5000,
}) => {
  const [notifications, setNotifications] = useState<UpdateNotification[]>([]);
  const { lastMessage, isConnected } = useWebSocket({
    autoConnect: true,
    subscriptions: ['stores', 'coupons', 'categories', 'blogs']
  });

  const addNotification = useCallback((notification: UpdateNotification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    if (autoHide) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, hideDelay);
    }
  }, [maxNotifications, autoHide, hideDelay]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getNotificationContent = useCallback((message: any) => {
    const { type, data } = message;

    switch (type) {
      case 'store_updated':
        return {
          type: 'store' as const,
          action: 'updated' as const,
          title: 'Store Updated',
          message: `${data.name || 'A store'} has been updated`,
        };

      case 'coupon_created':
        return {
          type: 'coupon' as const,
          action: 'created' as const,
          title: 'New Coupon',
          message: `New coupon available${data.store ? ` at ${data.store}` : ''}`,
        };

      case 'coupon_updated':
        return {
          type: 'coupon' as const,
          action: 'updated' as const,
          title: 'Coupon Updated',
          message: `A coupon has been updated${data.store ? ` at ${data.store}` : ''}`,
        };

      case 'coupon_deleted':
        return {
          type: 'coupon' as const,
          action: 'deleted' as const,
          title: 'Coupon Removed',
          message: `A coupon has been removed${data.store ? ` from ${data.store}` : ''}`,
        };

      case 'category_updated':
        return {
          type: 'category' as const,
          action: 'updated' as const,
          title: 'Category Updated',
          message: `${data.name || 'A category'} has been updated`,
        };

      case 'blog_created':
        return {
          type: 'blog' as const,
          action: 'created' as const,
          title: 'New Blog Post',
          message: `New blog post: ${data.title || 'Untitled'}`,
        };

      case 'blog_updated':
        return {
          type: 'blog' as const,
          action: 'updated' as const,
          title: 'Blog Updated',
          message: `Blog post updated: ${data.title || 'Untitled'}`,
        };

      case 'blog_deleted':
        return {
          type: 'blog' as const,
          action: 'deleted' as const,
          title: 'Blog Removed',
          message: `A blog post has been removed`,
        };

      case 'bulk_update':
        return {
          type: 'store' as const,
          action: 'updated' as const,
          title: 'Bulk Update',
          message: `Multiple items have been updated`,
        };

      default:
        return null;
    }
  }, []);

  // Handle new WebSocket messages
  useEffect(() => {
    if (lastMessage && isConnected) {
      const content = getNotificationContent(lastMessage);
      
      if (content) {
        const notification: UpdateNotification = {
          id: `${Date.now()}-${Math.random()}`,
          ...content,
          timestamp: new Date(),
        };

        addNotification(notification);
      }
    }
  }, [lastMessage, isConnected, getNotificationContent, addNotification]);

  const getNotificationIcon = (type: string, action: string) => {
    if (action === 'created') return '✨';
    if (action === 'deleted') return '🗑️';
    
    switch (type) {
      case 'store': return '🏪';
      case 'coupon': return '🎫';
      case 'category': return '📁';
      case 'blog': return '📝';
      default: return '📢';
    }
  };

  const getNotificationColor = (action: string) => {
    switch (action) {
      case 'created': return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'deleted': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'updated': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={cn('fixed top-4 right-4 z-50 space-y-2', className)}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
            'animate-in slide-in-from-right-full duration-300',
            'max-w-sm',
            getNotificationColor(notification.action)
          )}
        >
          <div className="text-lg">
            {getNotificationIcon(notification.type, notification.action)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {notification.title}
              </h4>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {notification.message}
            </p>
            
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};