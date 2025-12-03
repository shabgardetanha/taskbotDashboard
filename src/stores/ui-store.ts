import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean
  sidebarOpen: boolean

  // Theme state
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'

  // Layout state
  layout: 'default' | 'compact' | 'comfortable'

  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>

  // Modal states
  activeModals: Set<string>

  // Notification preferences
  notifications: {
    enabled: boolean
    soundEnabled: boolean
    types: {
      success: boolean
      error: boolean
      warning: boolean
      info: boolean
    }
  }

  // Keyboard shortcuts
  keyboardShortcutsEnabled: boolean

  // Performance settings
  animationsEnabled: boolean
  reducedMotion: boolean

  // Responsive breakpoints
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide'
}

interface UIActions {
  // Sidebar actions
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Theme actions
  setTheme: (theme: UIState['theme']) => void
  setResolvedTheme: (theme: UIState['resolvedTheme']) => void

  // Layout actions
  setLayout: (layout: UIState['layout']) => void

  // Loading actions
  setGlobalLoading: (loading: boolean) => void
  setLoadingState: (key: string, loading: boolean) => void
  clearLoadingStates: () => void

  // Modal actions
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  closeAllModals: () => void
  isModalOpen: (modalId: string) => boolean

  // Notification actions
  setNotificationsEnabled: (enabled: boolean) => void
  setNotificationSound: (enabled: boolean) => void
  setNotificationType: (type: keyof UIState['notifications']['types'], enabled: boolean) => void

  // Keyboard shortcuts
  setKeyboardShortcutsEnabled: (enabled: boolean) => void

  // Performance actions
  setAnimationsEnabled: (enabled: boolean) => void
  setReducedMotion: (reduced: boolean) => void

  // Responsive actions
  setBreakpoint: (breakpoint: UIState['breakpoint']) => void

  // Utility actions
  resetToDefaults: () => void
}

const defaultState: UIState = {
  sidebarCollapsed: false,
  sidebarOpen: false,
  theme: 'system',
  resolvedTheme: 'light',
  layout: 'default',
  globalLoading: false,
  loadingStates: {},
  activeModals: new Set(),
  notifications: {
    enabled: true,
    soundEnabled: false,
    types: {
      success: true,
      error: true,
      warning: true,
      info: true,
    },
  },
  keyboardShortcutsEnabled: true,
  animationsEnabled: true,
  reducedMotion: false,
  breakpoint: 'desktop',
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Sidebar actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Theme actions
      setTheme: (theme) => set({ theme }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),

      // Layout actions
      setLayout: (layout) => set({ layout }),

      // Loading actions
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      setLoadingState: (key, loading) =>
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading,
          },
        })),
      clearLoadingStates: () => set({ loadingStates: {} }),

      // Modal actions
      openModal: (modalId) =>
        set((state) => ({
          activeModals: new Set([...state.activeModals, modalId]),
        })),
      closeModal: (modalId) =>
        set((state) => {
          const newModals = new Set(state.activeModals)
          newModals.delete(modalId)
          return { activeModals: newModals }
        }),
      closeAllModals: () => set({ activeModals: new Set() }),
      isModalOpen: (modalId) => get().activeModals.has(modalId),

      // Notification actions
      setNotificationsEnabled: (enabled) =>
        set((state) => ({
          notifications: { ...state.notifications, enabled },
        })),
      setNotificationSound: (soundEnabled) =>
        set((state) => ({
          notifications: { ...state.notifications, soundEnabled },
        })),
      setNotificationType: (type, enabled) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            types: {
              ...state.notifications.types,
              [type]: enabled,
            },
          },
        })),

      // Keyboard shortcuts
      setKeyboardShortcutsEnabled: (enabled) => set({ keyboardShortcutsEnabled: enabled }),

      // Performance actions
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      setReducedMotion: (reduced) => set({ reducedMotion: reduced }),

      // Responsive actions
      setBreakpoint: (breakpoint) => set({ breakpoint }),

      // Utility actions
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        layout: state.layout,
        notifications: state.notifications,
        keyboardShortcutsEnabled: state.keyboardShortcutsEnabled,
        animationsEnabled: state.animationsEnabled,
        reducedMotion: state.reducedMotion,
      }),
    }
  )
)

// Selectors for common UI state
export const useSidebarState = () => useUIStore((state) => ({
  collapsed: state.sidebarCollapsed,
  open: state.sidebarOpen,
}))

export const useThemeState = () => useUIStore((state) => ({
  theme: state.theme,
  resolvedTheme: state.resolvedTheme,
}))

export const useLoadingState = () => useUIStore((state) => ({
  global: state.globalLoading,
  states: state.loadingStates,
  isLoading: (key?: string) =>
    key ? state.loadingStates[key] || state.globalLoading : state.globalLoading,
}))

export const useNotificationSettings = () => useUIStore((state) => state.notifications)

export const usePerformanceSettings = () => useUIStore((state) => ({
  animationsEnabled: state.animationsEnabled,
  reducedMotion: state.reducedMotion,
}))

// Actions selectors
export const useUISidebarActions = () => useUIStore((state) => ({
  setCollapsed: state.setSidebarCollapsed,
  toggle: state.toggleSidebar,
  setOpen: state.setSidebarOpen,
}))

export const useUIThemeActions = () => useUIStore((state) => ({
  setTheme: state.setTheme,
  setResolvedTheme: state.setResolvedTheme,
}))

export const useUILoadingActions = () => useUIStore((state) => ({
  setGlobal: state.setGlobalLoading,
  setState: state.setLoadingState,
  clear: state.clearLoadingStates,
}))

export const useUIModalActions = () => useUIStore((state) => ({
  open: state.openModal,
  close: state.closeModal,
  closeAll: state.closeAllModals,
  isOpen: state.isModalOpen,
}))
