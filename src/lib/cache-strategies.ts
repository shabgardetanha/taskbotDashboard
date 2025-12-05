import { QueryClient } from '@tanstack/react-query'

// Advanced caching strategies for TaskBot
export class CacheStrategies {
  // HTTP Cache headers for different content types
  static getHttpCacheHeaders(contentType: 'static' | 'dynamic' | 'user' | 'api') {
    const headers = new Headers()

    switch (contentType) {
      case 'static':
        // Static assets: cache aggressively
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
        break

      case 'dynamic':
        // Dynamic content: cache for short time
        headers.set('Cache-Control', 'public, max-age=300, s-maxage=600')
        break

      case 'user':
        // User-specific data: don't cache
        headers.set('Cache-Control', 'private, no-cache, no-store')
        break

      case 'api':
        // API responses: short cache with revalidation
        headers.set('Cache-Control', 'public, max-age=60, s-maxage=120')
        break
    }

    return headers
  }

  // Service Worker cache strategies
  static getServiceWorkerCacheStrategy(route: string) {
    // Static assets
    if (route.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
      return 'cache-first'
    }

    // API routes
    if (route.startsWith('/api/')) {
      return 'network-first'
    }

    // Pages
    if (route.startsWith('/dashboard') || route === '/') {
      return 'network-first'
    }

    // Default
    return 'network-first'
  }

  // React Query cache configuration
  static getQueryCacheConfig(entityType: 'static' | 'dynamic' | 'user' | 'realtime') {
    switch (entityType) {
      case 'static':
        // Static data: cache long-term
        return {
          staleTime: 24 * 60 * 60 * 1000, // 24 hours
          gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        }

      case 'dynamic':
        // Dynamic data: moderate caching
        return {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 30 * 60 * 1000, // 30 minutes
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        }

      case 'user':
        // User data: short cache, refetch often
        return {
          staleTime: 2 * 60 * 1000, // 2 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        }

      case 'realtime':
        // Real-time data: minimal caching
        return {
          staleTime: 30 * 1000, // 30 seconds
          gcTime: 5 * 60 * 1000, // 5 minutes
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
          refetchInterval: 60 * 1000, // 1 minute background refetch
        }
    }
  }

  // Cache invalidation strategies
  static getInvalidationStrategy(operation: 'create' | 'update' | 'delete', entityType: string) {
    const strategies = {
      // Task operations
      task_create: ['tasks', 'workspaces', 'recent-activity'],
      task_update: ['tasks', 'task-analytics', 'recent-activity'],
      task_delete: ['tasks', 'task-analytics', 'recent-activity', 'subtasks'],

      // Workspace operations
      workspace_create: ['workspaces', 'recent-workspaces'],
      workspace_update: ['workspaces', 'workspace-members'],
      workspace_delete: ['workspaces', 'workspace-members', 'tasks'],

      // Label operations
      label_create: ['labels'],
      label_update: ['labels', 'tasks'], // Invalidate tasks that use this label
      label_delete: ['labels', 'tasks'],

      // Subtask operations
      subtask_create: ['subtasks', 'tasks'],
      subtask_update: ['subtasks', 'tasks'],
      subtask_delete: ['subtasks', 'tasks'],
    }

    const key = `${entityType}_${operation}` as keyof typeof strategies
    return strategies[key] || [entityType]
  }

  // Prefetching strategies
  static async prefetchRelatedData(queryClient: QueryClient, entityType: string, entityId: string) {
    const prefetchStrategies = {
      task: async () => {
        // Prefetch task details, subtasks, and related workspace
        const prefetchQueries = [
          ['tasks', 'detail', entityId],
          ['subtasks', 'list', { taskId: entityId }],
          ['tasks', 'time', entityId],
        ]

        await Promise.all(
          prefetchQueries.map(queryKey =>
            queryClient.prefetchQuery({
              queryKey,
              // Add actual query function here
              queryFn: () => Promise.resolve(null),
              staleTime: 5 * 60 * 1000,
            })
          )
        )
      },

      workspace: async () => {
        // Prefetch workspace details and members
        const prefetchQueries = [
          ['workspaces', 'detail', entityId],
          ['workspaces', 'members', entityId],
        ]

        await Promise.all(
          prefetchQueries.map(queryKey =>
            queryClient.prefetchQuery({
              queryKey,
              queryFn: () => Promise.resolve(null),
              staleTime: 5 * 60 * 1000,
            })
          )
        )
      },
    }

    const strategy = prefetchStrategies[entityType as keyof typeof prefetchStrategies]
    if (strategy) {
      await strategy()
    }
  }

  // Cache warming strategies for common data
  static async warmCommonCache(queryClient: QueryClient, userId?: string) {
    const commonQueries = [
      // User preferences
      ['user', 'preferences'],

      // Static data
      ['labels', 'list'],
      ['templates', 'list'],

      // Recent workspaces
      ['workspaces', 'recent'],

      // User-specific data
      ...(userId ? [['tasks', 'recent', userId]] : []),
    ]

    await Promise.all(
      commonQueries.map(queryKey =>
        queryClient.prefetchQuery({
          queryKey,
          queryFn: () => Promise.resolve(null), // Replace with actual query
          staleTime: 10 * 60 * 1000, // 10 minutes
        })
      )
    )
  }

  // Memory management for large datasets
  static getMemoryManagementConfig(datasetSize: 'small' | 'medium' | 'large') {
    switch (datasetSize) {
      case 'small':
        return {
          maxCacheSize: 100, // 100 items
          gcTime: 30 * 60 * 1000, // 30 minutes
        }

      case 'medium':
        return {
          maxCacheSize: 500, // 500 items
          gcTime: 60 * 60 * 1000, // 1 hour
        }

      case 'large':
        return {
          maxCacheSize: 1000, // 1000 items
          gcTime: 2 * 60 * 60 * 1000, // 2 hours
          // Enable compression for large datasets
          compress: true,
        }
    }
  }

  // Offline caching strategy
  static getOfflineCacheStrategy() {
    return {
      // Cache critical data for offline use
      criticalData: {
        userPreferences: true,
        recentTasks: true,
        workspaceList: true,
        labels: true,
      },

      // Sync strategy when back online
      syncStrategy: 'background-sync', // or 'manual-sync'

      // Conflict resolution
      conflictResolution: 'server-wins', // or 'client-wins' or 'manual'

      // Data expiration
      offlineExpiration: 24 * 60 * 60 * 1000, // 24 hours
    }
  }

  // CDN cache optimization
  static getCDNCacheHeaders(contentType: string, region?: string) {
    const headers = new Headers()

    // Basic cache headers
    headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')

    // CDN-specific headers
    if (contentType === 'static') {
      headers.set('CDN-Cache-Control', 'max-age=31536000') // 1 year
    } else if (contentType === 'api') {
      headers.set('CDN-Cache-Control', 'max-age=60') // 1 minute
    }

    // Region-specific caching
    if (region) {
      headers.set('CloudFront-Viewer-Country', region)
    }

    return headers
  }

  // Browser cache optimization
  static optimizeBrowserCache() {
    // Service Worker registration for advanced caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker registered:', registration.scope)
      }).catch(error => {
        console.error('Service Worker registration failed:', error)
      })
    }

    // Cache API for manual cache management
    if ('caches' in window) {
      // Create named caches for different content types
      const cacheNames = {
        static: 'taskbot-static-v1',
        dynamic: 'taskbot-dynamic-v1',
        api: 'taskbot-api-v1',
      }

      // Cache management utilities
      return {
        cacheNames,
        async clearOldCaches() {
          const cacheKeys = await caches.keys()
          const validCacheNames = Object.values(cacheNames)

          return Promise.all(
            cacheKeys
              .filter(key => !validCacheNames.includes(key))
              .map(key => caches.delete(key))
          )
        },

        async cacheResponse(request: Request, response: Response, cacheName: string) {
          const cache = await caches.open(cacheName)
          await cache.put(request, response.clone())
        },

        async getCachedResponse(request: Request, cacheName: string) {
          const cache = await caches.open(cacheName)
          return cache.match(request)
        },
      }
    }

    return null
  }
}

// Cache warming hook
export function useCacheWarming(queryClient: QueryClient, userId?: string) {
  const warmCache = async () => {
    try {
      await CacheStrategies.warmCommonCache(queryClient, userId)
      console.log('Cache warmed successfully')
    } catch (error) {
      console.error('Cache warming failed:', error)
    }
  }

  return { warmCache }
}

// Prefetching hook
export function usePrefetching(queryClient: QueryClient) {
  const prefetchEntity = async (entityType: string, entityId: string) => {
    try {
      await CacheStrategies.prefetchRelatedData(queryClient, entityType, entityId)
    } catch (error) {
      console.error('Prefetching failed:', error)
    }
  }

  return { prefetchEntity }
}

// Cache invalidation hook
export function useCacheInvalidation(queryClient: QueryClient) {
  const invalidateEntity = (operation: 'create' | 'update' | 'delete', entityType: string) => {
    const queriesToInvalidate = CacheStrategies.getInvalidationStrategy(operation, entityType)

    queriesToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
    })
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries()
  }

  const invalidateUserData = () => {
    queryClient.invalidateQueries({ predicate: (query) => {
      const queryKey = query.queryKey as string[]
      return queryKey.includes('user') || queryKey.includes('profile')
    }})
  }

  return {
    invalidateEntity,
    invalidateAll,
    invalidateUserData,
  }
}

// Memory management hook
export function useMemoryManagement(queryClient: QueryClient, datasetSize: 'small' | 'medium' | 'large' = 'medium') {
  const config = CacheStrategies.getMemoryManagementConfig(datasetSize)

  const optimizeMemory = () => {
    // Set garbage collection time
    queryClient.setDefaultOptions({
      queries: {
        gcTime: config.gcTime,
      },
    })

    // Implement cache size limits (React Query v5 has built-in limits)
    console.log('Memory optimization applied:', config)
  }

  return {
    optimizeMemory,
    config,
  }
}

// Offline caching hook
export function useOfflineCaching() {
  const strategy = CacheStrategies.getOfflineCacheStrategy()

  const isOnline = () => navigator.onLine

  const syncOfflineData = async () => {
    if (!isOnline()) {
      throw new Error('Cannot sync while offline')
    }

    // Implement sync logic here
    console.log('Syncing offline data...')
  }

  return {
    isOnline,
    syncOfflineData,
    strategy,
  }
}

export const STALE_TIMES = {
  tasks: 2 * 60 * 1000,
  subtasks: 2 * 60 * 1000,
  labels: 10 * 60 * 1000,
  workspaces: 5 * 60 * 1000,
  userProfile: 15 * 60 * 1000
} as const;
