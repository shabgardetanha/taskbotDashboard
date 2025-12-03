import { QueryClient } from '@tanstack/react-query'

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// WebSocket message types
export enum MessageType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',

  // Authentication
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',

  // Tasks
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMMENTED = 'task_commented',

  // Workspaces
  WORKSPACE_JOINED = 'workspace_joined',
  WORKSPACE_LEFT = 'workspace_left',
  WORKSPACE_UPDATED = 'workspace_updated',

  // Real-time collaboration
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_TYPING = 'user_typing',
  CURSOR_POSITION = 'cursor_position',

  // Notifications
  NOTIFICATION = 'notification',
  TASK_REMINDER = 'task_reminder',
  DEADLINE_WARNING = 'deadline_warning',

  // Presence
  PRESENCE_UPDATE = 'presence_update',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
}

// WebSocket message interface
export interface WSMessage {
  type: MessageType
  payload: any
  timestamp: string
  userId?: string
  requestId?: string
}

// WebSocket event handlers
export interface WSEventHandlers {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WSMessage) => void
  onTaskUpdate?: (taskId: string, data: any) => void
  onWorkspaceUpdate?: (workspaceId: string, data: any) => void
  onUserPresence?: (userId: string, status: 'online' | 'offline') => void
  onNotification?: (notification: any) => void
}

// WebSocket client class
export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private protocols?: string | string[]
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private heartbeatInterval: number | null = null
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED
  private eventHandlers: WSEventHandlers = {}
  private pendingMessages: WSMessage[] = []
  private isAuthenticated = false

  constructor(
    url: string,
    protocols?: string | string[],
    options: {
      maxReconnectAttempts?: number
      reconnectInterval?: number
    } = {}
  ) {
    this.url = url
    this.protocols = protocols

    if (options.maxReconnectAttempts) {
      this.maxReconnectAttempts = options.maxReconnectAttempts
    }
    if (options.reconnectInterval) {
      this.reconnectInterval = options.reconnectInterval
    }
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.connectionState = ConnectionState.CONNECTING

      try {
        this.ws = new WebSocket(this.url, this.protocols as string | string[] | undefined)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.connectionState = ConnectionState.CONNECTED
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.eventHandlers.onConnect?.()
          this.flushPendingMessages()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.connectionState = ConnectionState.DISCONNECTED
          this.stopHeartbeat()
          this.eventHandlers.onDisconnect?.()

          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.connectionState = ConnectionState.ERROR
          this.eventHandlers.onError?.(error)
        }

      } catch (error) {
        this.connectionState = ConnectionState.ERROR
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat()
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.connectionState = ConnectionState.DISCONNECTED
    this.isAuthenticated = false
  }

  // Message handling
  send(message: Omit<WSMessage, 'timestamp'>): void {
    const fullMessage: WSMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMessage))
    } else {
      // Queue message for later sending
      this.pendingMessages.push(fullMessage)
    }
  }

  private handleMessage(message: WSMessage): void {
    // Handle authentication
    if (message.type === MessageType.AUTHENTICATED) {
      this.isAuthenticated = true
    }

    // Route message to appropriate handler
    switch (message.type) {
      case MessageType.TASK_CREATED:
      case MessageType.TASK_UPDATED:
      case MessageType.TASK_DELETED:
        this.eventHandlers.onTaskUpdate?.(message.payload.taskId, message.payload)
        break

      case MessageType.WORKSPACE_UPDATED:
        this.eventHandlers.onWorkspaceUpdate?.(message.payload.workspaceId, message.payload)
        break

      case MessageType.USER_ONLINE:
        this.eventHandlers.onUserPresence?.(message.payload.userId, 'online')
        break

      case MessageType.USER_OFFLINE:
        this.eventHandlers.onUserPresence?.(message.payload.userId, 'offline')
        break

      case MessageType.NOTIFICATION:
        this.eventHandlers.onNotification?.(message.payload)
        break
    }

    // Call general message handler
    this.eventHandlers.onMessage?.(message)
  }

  // Authentication
  authenticate(token: string): void {
    this.send({
      type: MessageType.AUTHENTICATE,
      payload: { token },
    })
  }

  // Subscription management
  subscribeToTask(taskId: string): void {
    this.send({
      type: MessageType.TASK_UPDATED,
      payload: { taskId, action: 'subscribe' },
    })
  }

  subscribeToWorkspace(workspaceId: string): void {
    this.send({
      type: MessageType.WORKSPACE_UPDATED,
      payload: { workspaceId, action: 'subscribe' },
    })
  }

  unsubscribeFromTask(taskId: string): void {
    this.send({
      type: MessageType.TASK_UPDATED,
      payload: { taskId, action: 'unsubscribe' },
    })
  }

  unsubscribeFromWorkspace(workspaceId: string): void {
    this.send({
      type: MessageType.WORKSPACE_UPDATED,
      payload: { workspaceId, action: 'unsubscribe' },
    })
  }

  // Real-time collaboration
  sendTypingIndicator(taskId: string, isTyping: boolean): void {
    this.send({
      type: MessageType.USER_TYPING,
      payload: { taskId, isTyping },
    })
  }

  sendCursorPosition(taskId: string, position: { x: number; y: number }): void {
    this.send({
      type: MessageType.CURSOR_POSITION,
      payload: { taskId, position },
    })
  }

  // Heartbeat for connection monitoring
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: MessageType.PING, payload: {} })
      }
    }, 30000) // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // Reconnection logic
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.connectionState = ConnectionState.RECONNECTING
    this.reconnectAttempts++

    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connect().catch(() => {
        // Reconnection failed, will be retried
      })
    }, delay)
  }

  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.pendingMessages.shift()
      if (message) {
        this.ws.send(JSON.stringify(message))
      }
    }
  }

  // Event handlers
  setEventHandlers(handlers: WSEventHandlers): void {
    this.eventHandlers = handlers
  }

  // Getters
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN
  }

  isAuthenticatedWS(): boolean {
    return this.isAuthenticated
  }
}

// WebSocket manager for React Query integration
export class WebSocketManager {
  private client: WebSocketClient | null = null
  private queryClient: QueryClient
  private subscriptions = new Set<string>()

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient
  }

  async connect(url: string, token?: string): Promise<void> {
    this.client = new WebSocketClient(url)

    this.client.setEventHandlers({
      onConnect: () => {
        console.log('WebSocket connected, authenticating...')
        if (token) {
          this.client?.authenticate(token)
        }
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected')
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
      },
      onTaskUpdate: (taskId, data) => {
        // Invalidate task queries
        this.queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] })
        this.queryClient.invalidateQueries({ queryKey: ['tasks'] })
      },
      onWorkspaceUpdate: (workspaceId, data) => {
        // Invalidate workspace queries
        this.queryClient.invalidateQueries({ queryKey: ['workspaces', 'detail', workspaceId] })
        this.queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      },
      onUserPresence: (userId, status) => {
        // Update presence in user queries
        this.queryClient.invalidateQueries({ queryKey: ['users', 'presence'] })
      },
      onNotification: (notification) => {
        // Handle real-time notifications
        console.log('Real-time notification:', notification)
      },
    })

    await this.client.connect()
  }

  disconnect(): void {
    this.client?.disconnect()
    this.subscriptions.clear()
  }

  subscribeToTask(taskId: string): void {
    if (this.subscriptions.has(`task:${taskId}`)) return

    this.client?.subscribeToTask(taskId)
    this.subscriptions.add(`task:${taskId}`)
  }

  subscribeToWorkspace(workspaceId: string): void {
    if (this.subscriptions.has(`workspace:${workspaceId}`)) return

    this.client?.subscribeToWorkspace(workspaceId)
    this.subscriptions.add(`workspace:${workspaceId}`)
  }

  unsubscribeFromTask(taskId: string): void {
    if (!this.subscriptions.has(`task:${taskId}`)) return

    this.client?.unsubscribeFromTask(taskId)
    this.subscriptions.delete(`task:${taskId}`)
  }

  unsubscribeFromWorkspace(workspaceId: string): void {
    if (!this.subscriptions.has(`workspace:${workspaceId}`)) return

    this.client?.unsubscribeFromWorkspace(workspaceId)
    this.subscriptions.delete(`workspace:${workspaceId}`)
  }

  sendTypingIndicator(taskId: string, isTyping: boolean): void {
    this.client?.sendTypingIndicator(taskId, isTyping)
  }

  sendCursorPosition(taskId: string, position: { x: number; y: number }): void {
    this.client?.sendCursorPosition(taskId, position)
  }

  getConnectionState(): ConnectionState {
    return this.client?.getConnectionState() || ConnectionState.DISCONNECTED
  }

  isConnected(): boolean {
    return this.client?.isConnected() || false
  }
}
