import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { generateNotificationId } from '@/lib/utils/idGenerator';

// Types
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

interface AppState {
  // State
  notifications: Notification[];
  isLoading: boolean;
  sidebarOpen: boolean;
  preferences: UserPreferences;
  searchQuery: string;
  filters: Record<string, any>;

  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
}

const initialState = {
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
      profileVisibility: 'public' as const,
      allowAnalytics: true,
      allowMarketing: false,
    },
  },
  searchQuery: '',
  filters: {},
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Notification actions
        addNotification: (notification) => {
          const id = generateNotificationId();
          const newNotification = { ...notification, id };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }));

          // Auto-remove notification after duration (only on client)
          if (typeof window !== 'undefined' && notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },

        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // Loading actions
        setLoading: (loading) => {
          set({ isLoading: loading });
        },

        // Sidebar actions
        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }));
        },

        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },

        // Preferences actions
        updatePreferences: (preferences) => {
          set((state) => ({
            preferences: { ...state.preferences, ...preferences },
          }));
        },

        // Search and filter actions
        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },

        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters },
          }));
        },

        clearFilters: () => {
          set({ filters: {} });
        },
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          preferences: state.preferences,
          searchQuery: state.searchQuery,
          filters: state.filters,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);

// Selectors for better performance
export const useNotifications = () => useAppStore((state) => state.notifications);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useSidebarOpen = () => useAppStore((state) => state.sidebarOpen);
export const usePreferences = () => useAppStore((state) => state.preferences);
export const useSearchQuery = () => useAppStore((state) => state.searchQuery);
export const useFilters = () => useAppStore((state) => state.filters);

// Action selectors
export const useNotificationActions = () => useAppStore((state) => ({
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  clearNotifications: state.clearNotifications,
}));

export const useLoadingActions = () => useAppStore((state) => ({
  setLoading: state.setLoading,
}));

export const useSidebarActions = () => useAppStore((state) => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
}));

export const usePreferenceActions = () => useAppStore((state) => ({
  updatePreferences: state.updatePreferences,
}));

export const useSearchActions = () => useAppStore((state) => ({
  setSearchQuery: state.setSearchQuery,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
}));