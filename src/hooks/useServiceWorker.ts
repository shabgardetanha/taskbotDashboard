'use client'

import { useEffect, useState, useCallback } from 'react'
import { CacheStrategies } from '@/lib/cache-strategies'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isInstalling: boolean
  isWaiting: boolean
  isActive: boolean
  updateAvailable: boolean
  registration: ServiceWorkerRegistration | null
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isActive: false,
    updateAvailable: false,
    registration: null,
  })

  const [cacheManager, setCacheManager] = useState<any>(null)

  // Initialize service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    const initServiceWorker = async () => {
      try {
        console.log('Registering Service Worker...')

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('Service Worker registered:', registration.scope)

        // Initialize cache manager
        const manager = CacheStrategies.optimizeBrowserCache()
        setCacheManager(manager)

        // Set up event listeners
        setupEventListeners(registration)

        // Update state based on current registration
        updateStateFromRegistration(registration)

        // Check for updates every 30 minutes
        const updateInterval = setInterval(() => {
          registration.update()
        }, 30 * 60 * 1000)

        return () => clearInterval(updateInterval)

      } catch (error) {
        console.error('Service Worker registration failed:', error)
        setState(prev => ({ ...prev, isRegistered: false }))
      }
    }

    initServiceWorker()
  }, [])

  const setupEventListeners = useCallback((registration: ServiceWorkerRegistration) => {
    // Controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed')
      window.location.reload()
    })

    // Message handling
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data

      switch (type) {
        case 'SYNC_COMPLETE':
          console.log('Background sync completed')
          // Handle sync completion
          break

        default:
          console.log('Unknown message from SW:', type)
      }
    })

    // Registration state changes
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing

      if (newWorker) {
        console.log('New Service Worker found')

        setState(prev => ({ ...prev, isInstalling: true }))

        newWorker.addEventListener('statechange', () => {
          console.log('Service Worker state changed:', newWorker.state)

          switch (newWorker.state) {
            case 'installed':
              if (navigator.serviceWorker.controller) {
                // New version available
                setState(prev => ({
                  ...prev,
                  isInstalling: false,
                  updateAvailable: true,
                  isWaiting: true,
                }))
                console.log('New Service Worker version available')
              } else {
                // First install
                setState(prev => ({
                  ...prev,
                  isInstalling: false,
                  isActive: true,
                }))
                console.log('Service Worker installed for the first time')
              }
              break

            case 'activated':
              setState(prev => ({
                ...prev,
                isWaiting: false,
                isActive: true,
                updateAvailable: false,
              }))
              console.log('New Service Worker activated')
              break

            case 'redundant':
              setState(prev => ({
                ...prev,
                isInstalling: false,
                isWaiting: false,
              }))
              console.error('Service Worker failed to install')
              break
          }
        })
      }
    })

    // Periodic sync (if supported)
    if ('periodicSync' in registration) {
      ;(registration as any).periodicSync.register('content-sync', {
        minInterval: 24 * 60 * 60 * 1000, // 24 hours
      }).catch((error: any) => {
        console.log('Periodic sync not supported or denied:', error)
      })
    }

    // Background sync (if supported)
    if ('sync' in registration) {
      // Register for background sync when online
      const handleOnline = () => {
        ;(registration as any).sync.register('background-sync').catch((error: any) => {
          console.log('Background sync failed:', error)
        })
      }

      window.addEventListener('online', handleOnline)
      return () => window.removeEventListener('online', handleOnline)
    }
  }, [])

  const updateStateFromRegistration = useCallback((registration: ServiceWorkerRegistration) => {
    setState(prev => ({
      ...prev,
      isRegistered: true,
      registration,
      isActive: !!registration.active,
      isWaiting: !!registration.waiting,
      isInstalling: !!registration.installing,
    }))
  }, [])

  // Manual update check
  const checkForUpdates = useCallback(async () => {
    if (!state.registration) return

    try {
      await state.registration.update()
      console.log('Checked for Service Worker updates')
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }, [state.registration])

  // Skip waiting and activate new version
  const updateServiceWorker = useCallback(async () => {
    if (!state.registration?.waiting) return

    // Tell the waiting service worker to skip waiting
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    // The controllerchange event will handle the reload
  }, [state.registration])

  // Unregister service worker
  const unregister = useCallback(async () => {
    if (!state.registration) return

    try {
      const result = await state.registration.unregister()
      if (result) {
        console.log('Service Worker unregistered')
        setState(prev => ({
          ...prev,
          isRegistered: false,
          registration: null,
          isActive: false,
          isWaiting: false,
          updateAvailable: false,
        }))
      }
    } catch (error) {
      console.error('Failed to unregister Service Worker:', error)
    }
  }, [state.registration])

  // Clear all caches
  const clearAllCaches = useCallback(async () => {
    if (!state.registration) return

    try {
      // Clear Cache API caches
      if (cacheManager) {
        await cacheManager.clearOldCaches()
      }

      // Tell SW to clear its caches
      state.registration.active?.postMessage({ type: 'CACHE_CLEAR' })

      console.log('All caches cleared')
    } catch (error) {
      console.error('Failed to clear caches:', error)
    }
  }, [state.registration, cacheManager])

  // Cache management
  const cacheResponse = useCallback(async (url: string, response: Response) => {
    if (!cacheManager) return

    try {
      const strategy = CacheStrategies.getServiceWorkerCacheStrategy(url)
      await cacheManager.cacheResponse(new Request(url), response, `${strategy}-cache`)
    } catch (error) {
      console.error('Failed to cache response:', error)
    }
  }, [cacheManager])

  const getCachedResponse = useCallback(async (url: string) => {
    if (!cacheManager) return null

    try {
      const strategy = CacheStrategies.getServiceWorkerCacheStrategy(url)
      return await cacheManager.getCachedResponse(new Request(url), `${strategy}-cache`)
    } catch (error) {
      console.error('Failed to get cached response:', error)
      return null
    }
  }, [cacheManager])

  // Push notification support
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }, [])

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!state.registration) return

    try {
      await state.registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        ...options,
      })
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }, [state.registration])

  return {
    // State
    ...state,

    // Actions
    checkForUpdates,
    updateServiceWorker,
    unregister,
    clearAllCaches,

    // Cache management
    cacheResponse,
    getCachedResponse,

    // Notifications
    requestNotificationPermission,
    sendNotification,

    // Cache manager
    cacheManager,
  }
}

// Hook for offline detection
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        console.log('Back online - syncing data...')
        // Trigger sync here
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      console.log('Gone offline - switching to offline mode')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return {
    isOnline,
    wasOffline,
  }
}

// Hook for background sync
export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      setIsSupported(true)
    }
  }, [])

  const registerSync = useCallback(async (tag: string) => {
    if (!isSupported) return false

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(tag)
      setIsRegistered(true)
      return true
    } catch (error) {
      console.error('Failed to register background sync:', error)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    isRegistered,
    registerSync,
  }
}

// Hook for periodic sync
export function usePeriodicSync() {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
      setIsSupported(true)
    }
  }, [])

  const registerPeriodicSync = useCallback(async (tag: string, minInterval: number) => {
    if (!isSupported) return false

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.periodicSync.register(tag, { minInterval })
      setIsRegistered(true)
      return true
    } catch (error) {
      console.error('Failed to register periodic sync:', error)
      return false
    }
  }, [isSupported])

  return {
    isSupported,
    isRegistered,
    registerPeriodicSync,
  }
}
