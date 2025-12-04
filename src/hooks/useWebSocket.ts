'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { WebSocketManager, ConnectionState, MessageType } from '@/lib/websocket-client'
import type { WSMessage } from '@/lib/websocket-client'
import { useUserStore } from '@/stores/user-store'
import { toast } from '@/components/ui/toast'

interface UseWebSocketOptions {
  url?: string
  enabled?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WSMessage) => void
  onTaskUpdate?: (taskId: string, data: any) => void
  onWorkspaceUpdate?: (workspaceId: string, data: any) => void
  onUserPresence?: (userId: string, status: 'online' | 'offline') => void
  onNotification?: (notification: any) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    enabled = true,
    onConnect,
    onDisconnect,
    onError,
  } = options

  const queryClient = useQueryClient()
  const managerRef = useRef<WebSocketManager | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [isConnected, setIsConnected] = useState(false)
  const { currentUser } = useUserStore()

  // Initialize WebSocket manager
  useEffect(() => {
    if (!enabled) return

    managerRef.current = new WebSocketManager(queryClient)

    return () => {
      managerRef.current?.disconnect()
      managerRef.current = null
    }
  }, [queryClient, enabled])

  // Connection management
  const connect = useCallback(async () => {
    if (!managerRef.current || !currentUser) return

    try {
      // Get auth token (this would come from your auth system)
      const token = localStorage.getItem('auth-token')

      await managerRef.current.connect(url, token || undefined)
      setConnectionState(managerRef.current.getConnectionState())
      setIsConnected(managerRef.current.isConnected())
      onConnect?.()
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      setConnectionState(ConnectionState.ERROR)
      setIsConnected(false)
      onError?.(error as Event)
    }
  }, [url, currentUser, onConnect, onError])

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect()
    setConnectionState(ConnectionState.DISCONNECTED)
    setIsConnected(false)
    onDisconnect?.()
  }, [onDisconnect])

  // Auto-connect when user is authenticated and component mounts
  useEffect(() => {
    if (enabled && currentUser && connectionState === ConnectionState.DISCONNECTED) {
      connect()
    }
  }, [enabled, currentUser, connectionState, connect])

  // Monitor connection state
  useEffect(() => {
    if (!managerRef.current) return

    const interval = setInterval(() => {
      const state = managerRef.current?.getConnectionState()
      const connected = managerRef.current?.isConnected()

      if (state !== connectionState) {
        setConnectionState(state || ConnectionState.DISCONNECTED)
      }

      if (connected !== isConnected) {
        setIsConnected(connected || false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [connectionState, isConnected])

  // Subscription management
  const subscribeToTask = useCallback((taskId: string) => {
    managerRef.current?.subscribeToTask(taskId)
  }, [])

  const subscribeToWorkspace = useCallback((workspaceId: string) => {
    managerRef.current?.subscribeToWorkspace(workspaceId)
  }, [])

  const unsubscribeFromTask = useCallback((taskId: string) => {
    managerRef.current?.unsubscribeFromTask(taskId)
  }, [])

  const unsubscribeFromWorkspace = useCallback((workspaceId: string) => {
    managerRef.current?.unsubscribeFromWorkspace(workspaceId)
  }, [])

  // Real-time collaboration
  const sendTypingIndicator = useCallback((taskId: string, isTyping: boolean) => {
    managerRef.current?.sendTypingIndicator(taskId, isTyping)
  }, [])

  const sendCursorPosition = useCallback((taskId: string, position: { x: number; y: number }) => {
    managerRef.current?.sendCursorPosition(taskId, position)
  }, [])

  return {
    // Connection state
    connectionState,
    isConnected,

    // Connection management
    connect,
    disconnect,

    // Subscriptions
    subscribeToTask,
    subscribeToWorkspace,
    unsubscribeFromTask,
    unsubscribeFromWorkspace,

    // Real-time features
    sendTypingIndicator,
    sendCursorPosition,
  }
}

// Hook for task real-time updates
export function useTaskRealTime(taskId: string, enabled: boolean = true) {
  const { subscribeToTask, unsubscribeFromTask, isConnected } = useWebSocket({
    enabled,
    onTaskUpdate: (updatedTaskId, data) => {
      if (updatedTaskId === taskId) {
        // Handle task-specific updates
        console.log('Task updated:', data)
      }
    },
  })

  useEffect(() => {
    if (enabled && isConnected && taskId) {
      subscribeToTask(taskId)

      return () => {
        unsubscribeFromTask(taskId)
      }
    }
  }, [taskId, enabled, isConnected, subscribeToTask, unsubscribeFromTask])

  return { isConnected }
}

// Hook for workspace real-time updates
export function useWorkspaceRealTime(workspaceId: string, enabled: boolean = true) {
  const { subscribeToWorkspace, unsubscribeFromWorkspace, isConnected } = useWebSocket({
    enabled,
    onWorkspaceUpdate: (updatedWorkspaceId, data) => {
      if (updatedWorkspaceId === workspaceId) {
        // Handle workspace-specific updates
        console.log('Workspace updated:', data)
      }
    },
  })

  useEffect(() => {
    if (enabled && isConnected && workspaceId) {
      subscribeToWorkspace(workspaceId)

      return () => {
        unsubscribeFromWorkspace(workspaceId)
      }
    }
  }, [workspaceId, enabled, isConnected, subscribeToWorkspace, unsubscribeFromWorkspace])

  return { isConnected }
}

// Hook for typing indicators
export function useTypingIndicator(taskId: string) {
  const { sendTypingIndicator } = useWebSocket()
  const [isTyping, setIsTyping] = useState(false)
  const [otherUsersTyping] = useState<Set<string>>(new Set())

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      sendTypingIndicator(taskId, true)
    }
  }, [isTyping, sendTypingIndicator, taskId])

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false)
      sendTypingIndicator(taskId, false)
    }
  }, [isTyping, sendTypingIndicator, taskId])

  // Debounced typing stop
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(stopTyping, 3000) // Stop after 3 seconds of inactivity
      return () => clearTimeout(timer)
    }
  }, [isTyping, stopTyping])

  return {
    isTyping,
    otherUsersTyping: Array.from(otherUsersTyping),
    startTyping,
    stopTyping,
  }
}

// Hook for user presence
export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [lastSeen, setLastSeen] = useState<Map<string, Date>>(new Map())

  useWebSocket({
    onUserPresence: (userId, status) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        if (status === 'online') {
          newSet.add(userId)
        } else {
          newSet.delete(userId)
          setLastSeen(prev => new Map(prev).set(userId, new Date()))
        }
        return newSet
      })
    },
  })

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId)
  }, [onlineUsers])

  const getLastSeen = useCallback((userId: string) => {
    return lastSeen.get(userId)
  }, [lastSeen])

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getLastSeen,
  }
}

// Hook for real-time notifications
export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])

  useWebSocket({
    onNotification: (notification) => {
      setNotifications(prev => [notification, ...prev])

      // Show toast for important notifications
      if (notification.priority === 'high') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default',
        })
      }
    },
  })

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearNotifications,
  }
}

// Hook for collaborative editing
export function useCollaborativeEditing(taskId: string) {
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; userId: string }>>(new Map())
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set())

  const { sendCursorPosition, subscribeToTask, unsubscribeFromTask } = useWebSocket({
    onMessage: (message: WSMessage) => {
      if (message.type === MessageType.CURSOR_POSITION && message.payload.taskId === taskId) {
        setCursors(prev => new Map(prev).set(message.userId!, message.payload.position))
      } else if (message.type === MessageType.USER_JOINED && message.payload.taskId === taskId) {
        setActiveUsers(prev => new Set(prev).add(message.userId!))
      } else if (message.type === MessageType.USER_LEFT && message.payload.taskId === taskId) {
        setActiveUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(message.userId!)
          return newSet
        })
        setCursors(prev => {
          const newMap = new Map(prev)
          newMap.delete(message.userId!)
          return newMap
        })
      }
    },
  })

  useEffect(() => {
    subscribeToTask(taskId)
    return () => unsubscribeFromTask(taskId)
  }, [taskId, subscribeToTask, unsubscribeFromTask])

  const updateCursor = useCallback((position: { x: number; y: number }) => {
    sendCursorPosition(taskId, position)
  }, [taskId, sendCursorPosition])

  return {
    cursors: Array.from(cursors.values()),
    activeUsers: Array.from(activeUsers),
    updateCursor,
  }
}

// Hook for real-time task updates with optimistic updates
export function useTaskUpdates(taskId: string) {
  const queryClient = useQueryClient()
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, any>>(new Map())

  useWebSocket({
    onTaskUpdate: (updatedTaskId, data) => {
      if (updatedTaskId === taskId) {
        // Remove from pending updates if it was optimistically updated
        setPendingUpdates(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.updateId)
          return newMap
        })

        // Invalidate and refetch task data
        queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] })
      }
    },
  })

  const addPendingUpdate = useCallback((updateId: string, update: any) => {
    setPendingUpdates(prev => new Map(prev).set(updateId, update))
  }, [])

  return {
    pendingUpdates: Array.from(pendingUpdates.values()),
    addPendingUpdate,
  }
}
