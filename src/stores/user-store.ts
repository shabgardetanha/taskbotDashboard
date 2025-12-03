import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  fullName: string
  avatar?: string
  role: 'admin' | 'manager' | 'user'
  preferences: UserPreferences
  lastLogin: Date
  isActive: boolean
}

interface UserPreferences {
  language: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  currency: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    marketing: boolean
  }
  dashboard: {
    defaultView: 'kanban' | 'calendar' | 'analytics'
    itemsPerPage: number
    autoRefresh: boolean
    refreshInterval: number
  }
  accessibility: {
    highContrast: boolean
    largeText: boolean
    screenReader: boolean
  }
}

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  preferences: UserPreferences
  recentWorkspaces: string[]
  favoriteTasks: string[]
  lastActivity: Date | null
}

interface UserActions {
  // Authentication
  setUser: (user: User | null) => void
  setAuthenticated: (authenticated: boolean) => void
  logout: () => void

  // Loading state
  setLoading: (loading: boolean) => void

  // Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  resetPreferences: () => void

  // Recent workspaces
  addRecentWorkspace: (workspaceId: string) => void
  removeRecentWorkspace: (workspaceId: string) => void
  clearRecentWorkspaces: () => void

  // Favorite tasks
  addFavoriteTask: (taskId: string) => void
  removeFavoriteTask: (taskId: string) => void
  clearFavoriteTasks: () => void

  // Activity tracking
  updateLastActivity: () => void

  // Utility
  hydrate: () => void
}

const defaultPreferences: UserPreferences = {
  language: 'fa',
  timezone: 'Asia/Tehran',
  dateFormat: 'YYYY/MM/DD',
  timeFormat: '24h',
  currency: 'IRR',
  notifications: {
    email: true,
    push: true,
    sms: false,
    marketing: false,
  },
  dashboard: {
    defaultView: 'kanban',
    itemsPerPage: 20,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    screenReader: false,
  },
}

const defaultState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  preferences: defaultPreferences,
  recentWorkspaces: [],
  favoriteTasks: [],
  lastActivity: null,
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Authentication
      setUser: (user) => set({
        currentUser: user,
        isAuthenticated: !!user,
        preferences: user?.preferences || defaultPreferences,
      }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      logout: () => set({
        currentUser: null,
        isAuthenticated: false,
        recentWorkspaces: [],
        favoriteTasks: [],
        lastActivity: null,
      }),

      // Loading state
      setLoading: (loading) => set({ isLoading: loading }),

      // Preferences
      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
          currentUser: state.currentUser ? {
            ...state.currentUser,
            preferences: { ...state.preferences, ...newPreferences },
          } : null,
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),

      // Recent workspaces
      addRecentWorkspace: (workspaceId) =>
        set((state) => ({
          recentWorkspaces: [
            workspaceId,
            ...state.recentWorkspaces.filter(id => id !== workspaceId),
          ].slice(0, 10), // Keep only last 10
        })),
      removeRecentWorkspace: (workspaceId) =>
        set((state) => ({
          recentWorkspaces: state.recentWorkspaces.filter(id => id !== workspaceId),
        })),
      clearRecentWorkspaces: () => set({ recentWorkspaces: [] }),

      // Favorite tasks
      addFavoriteTask: (taskId) =>
        set((state) => ({
          favoriteTasks: [
            taskId,
            ...state.favoriteTasks.filter(id => id !== taskId),
          ].slice(0, 50), // Keep only last 50
        })),
      removeFavoriteTask: (taskId) =>
        set((state) => ({
          favoriteTasks: state.favoriteTasks.filter(id => id !== taskId),
        })),
      clearFavoriteTasks: () => set({ favoriteTasks: [] }),

      // Activity tracking
      updateLastActivity: () => set({ lastActivity: new Date() }),

      // Utility
      hydrate: () => {
        // Rehydrate complex objects that might not serialize properly
        const state = get()
        if (state.currentUser?.lastLogin && typeof state.currentUser.lastLogin === 'string') {
          set((state) => ({
            currentUser: state.currentUser ? {
              ...state.currentUser,
              lastLogin: new Date(state.currentUser.lastLogin),
            } : null,
          }))
        }
        if (state.lastActivity && typeof state.lastActivity === 'string') {
          set({ lastActivity: new Date(state.lastActivity) })
        }
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        preferences: state.preferences,
        recentWorkspaces: state.recentWorkspaces,
        favoriteTasks: state.favoriteTasks,
        lastActivity: state.lastActivity,
      }),
    }
  )
)

// Selectors
export const useCurrentUser = () => useUserStore((state) => state.currentUser)
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated)
export const useUserPreferences = () => useUserStore((state) => state.preferences)
export const useUserLoading = () => useUserStore((state) => state.isLoading)
export const useRecentWorkspaces = () => useUserStore((state) => state.recentWorkspaces)
export const useFavoriteTasks = () => useUserStore((state) => state.favoriteTasks)
export const useLastActivity = () => useUserStore((state) => state.lastActivity)

// Computed selectors
export const useIsAdmin = () => useUserStore((state) => state.currentUser?.role === 'admin')
export const useIsManager = () => useUserStore((state) => state.currentUser?.role === 'manager')
export const useHasPermission = (permission: string) => {
  const user = useUserStore((state) => state.currentUser)
  if (!user) return false

  // Simple permission check - in real app, this would be more complex
  if (user.role === 'admin') return true
  if (user.role === 'manager' && ['read', 'write', 'manage'].includes(permission)) return true
  if (user.role === 'user' && ['read', 'write'].includes(permission)) return true

  return false
}

// Actions selectors
export const useUserActions = () => useUserStore((state) => ({
  setUser: state.setUser,
  setAuthenticated: state.setAuthenticated,
  logout: state.logout,
  setLoading: state.setLoading,
}))

export const useUserPreferenceActions = () => useUserStore((state) => ({
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
}))

export const useWorkspaceActions = () => useUserStore((state) => ({
  addRecentWorkspace: state.addRecentWorkspace,
  removeRecentWorkspace: state.removeRecentWorkspace,
  clearRecentWorkspaces: state.clearRecentWorkspaces,
}))

export const useTaskActions = () => useUserStore((state) => ({
  addFavoriteTask: state.addFavoriteTask,
  removeFavoriteTask: state.removeFavoriteTask,
  clearFavoriteTasks: state.clearFavoriteTasks,
}))
