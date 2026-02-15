'use client';

import React, { createContext, useContext, useState, useCallback, useReducer, useEffect } from 'react';
import { generateNotificationId } from '@/lib/utils/idGenerator';

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// User preferences
export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    allowAnalytics: boolean;
    allowMarketing: boolean;
  };
}

// App state interface
interface AppState {
  notifications: Notification[];
  isLoading: boolean;
  sidebarOpen: boolean;
  preferences: UserPreferences;
  searchQuery: string;
  filters: Record<string, any>;
}

// Action types
type AppAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Record<string, any> }
  | { type: 'CLEAR_FILTERS' };

// Initial state
const initialState: AppState = {
  notifications: [],
  isLoading: false,
  sidebarOpen: false,
  preferences: {
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      profileVisibility: 'public',
      allowAnalytics: true,
      allowMarketing: false,
    },
  },
  searchQuery: '',
  filters: {},
};

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };
    case 'SET_SIDEBAR_OPEN':
      return {
        ...state,
        sidebarOpen: action.payload,
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {},
      };
    default:
      return state;
  }
};

// Context interface
interface AppContextType {
  state: AppState;
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  // Loading actions
  setLoading: (loading: boolean) => void;
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  // Preferences actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  // Search and filter actions
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    try {
      const storedPreferences = localStorage.getItem('userPreferences');
      if (storedPreferences) {
        const preferences = JSON.parse(storedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  // Save preferences to localStorage when they change
  React.useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [state.preferences]);

  // Notification actions
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateNotificationId();
    const newNotification = { ...notification, id };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Auto-remove notification after duration (only on client)
    if (typeof window !== 'undefined' && notification.duration !== 0) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      }, notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  }, []);

  // Loading actions
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  // Sidebar actions
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  }, []);

  // Preferences actions
  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  }, []);

  // Search and filter actions
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setFilters = useCallback((filters: Record<string, any>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const contextValue: AppContextType = {
    state,
    addNotification,
    removeNotification,
    clearNotifications,
    setLoading,
    toggleSidebar,
    setSidebarOpen,
    updatePreferences,
    setSearchQuery,
    setFilters,
    clearFilters,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;