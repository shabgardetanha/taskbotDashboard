// Service Worker for TaskBot - Advanced Caching and Offline Support
const CACHE_NAME = 'taskbot-v1'
const STATIC_CACHE = 'taskbot-static-v1'
const DYNAMIC_CACHE = 'taskbot-dynamic-v1'
const API_CACHE = 'taskbot-api-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  // Add your static assets here
]

// API endpoints that should be cached
const CACHEABLE_API_ENDPOINTS = [
  '/api/labels',
  '/api/task-templates',
  '/api/workspaces', // Only list, not details
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing')

  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      console.log('Service Worker: Caching static assets')

      try {
        await cache.addAll(STATIC_ASSETS)
        console.log('Service Worker: Static assets cached successfully')
      } catch (error) {
        console.error('Service Worker: Failed to cache static assets:', error)
      }
    })()
  )

  // Force activation
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating')

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      const validCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE]

      await Promise.all(
        cacheNames
          .filter(cacheName => !validCaches.includes(cacheName))
          .map(cacheName => {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )

      // Take control of all clients
      await self.clients.claim()
      console.log('Service Worker: Activated and claimed all clients')
    })()
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests
  if (!url.origin.includes(self.location.origin) && !url.pathname.startsWith('/api/')) return

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Default strategy
  event.respondWith(handleDynamicRequest(request))
})

// Handle API requests - Network First with Cache Fallback
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const isCacheable = CACHEABLE_API_ENDPOINTS.some(endpoint =>
    url.pathname.startsWith(endpoint)
  )

  if (!isCacheable) {
    // Network only for non-cacheable API requests
    try {
      return await fetch(request)
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Network error' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  try {
    // Try network first
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url)
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Return offline response
  return new Response(JSON.stringify({
    error: 'Offline',
    message: 'این عملیات نیازمند اتصال اینترنت است'
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Handle static assets - Cache First
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Failed to fetch static asset:', error)
    return new Response('Asset not available', { status: 404 })
  }
}

// Handle navigation requests - Network First with App Shell Fallback
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      return networkResponse
    }
  } catch (error) {
    console.log('Navigation failed, serving app shell')
  }

  // Serve app shell from cache
  const cachedResponse = await caches.match('/')
  if (cachedResponse) {
    return cachedResponse
  }

  // Return offline page
  return new Response(`
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TaskBot - Offline</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; direction: rtl; }
        .offline-message { max-width: 400px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="offline-message">
        <h1>📴 اتصال اینترنت قطع است</h1>
        <p>برنامه TaskBot در حالت آفلاین قرار دارد. لطفا اتصال اینترنت خود را بررسی کنید.</p>
        <button onclick="window.location.reload()">تلاش مجدد</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}

// Handle dynamic content - Stale While Revalidate
async function handleDynamicRequest(request) {
  const cachedResponse = await caches.match(request)

  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  }).catch(() => {
    // Return cached version if network fails
    return cachedResponse || new Response('Content not available', { status: 404 })
  })

  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered')

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Get pending offline actions from IndexedDB
    const pendingActions = await getPendingOfflineActions()

    for (const action of pendingActions) {
      try {
        await syncAction(action)
        await removePendingAction(action.id)
      } catch (error) {
        console.error('Failed to sync action:', action, error)
      }
    }

    // Notify clients that sync is complete
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE' })
    })

  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received')

  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: data.url,
    actions: [
      {
        action: 'view',
        title: 'مشاهده',
      },
      {
        action: 'dismiss',
        title: 'رد کردن',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')

  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data

  event.waitUntil(
    self.clients.openWindow(url || '/')
  )
})

// Utility functions
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/.test(pathname)
}

// IndexedDB helpers for offline actions
async function getPendingOfflineActions() {
  // Implementation for getting pending actions from IndexedDB
  return []
}

async function syncAction(action) {
  // Implementation for syncing individual actions
  console.log('Syncing action:', action)
}

async function removePendingAction(actionId) {
  // Implementation for removing synced actions
  console.log('Removing action:', actionId)
}

// Periodic background sync (experimental)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent())
  }
})

async function syncContent() {
  console.log('Service Worker: Periodic content sync')

  try {
    // Refresh cached content
    const cache = await caches.open(API_CACHE)
    const keys = await cache.keys()

    for (const request of keys) {
      try {
        const networkResponse = await fetch(request)
        if (networkResponse.ok) {
          await cache.put(request, networkResponse)
        }
      } catch (error) {
        console.log('Failed to refresh cache for:', request.url)
      }
    }

    console.log('Content sync completed')
  } catch (error) {
    console.error('Content sync failed:', error)
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'CACHE_CLEAR':
      clearAllCaches()
      break

    case 'UPDATE_CACHE':
      updateCache(payload)
      break

    default:
      console.log('Unknown message type:', type)
  }
})

async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )
  console.log('All caches cleared')
}

async function updateCache({ url, response }) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    await cache.put(url, response)
    console.log('Cache updated for:', url)
  } catch (error) {
    console.error('Cache update failed:', error)
  }
}
