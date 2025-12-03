import { QueryClient } from '@tanstack/react-query'

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retries: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },

  // Workspaces
  workspaces: '/workspaces',
  workspaceById: (id: string) => `/workspaces/${id}`,
  workspaceMembers: (id: string) => `/workspaces/${id}/members`,

  // Tasks
  tasks: '/tasks',
  taskById: (id: string) => `/tasks/${id}`,
  taskSearch: '/tasks/search',
  taskTime: (id: string) => `/tasks/${id}/time`,

  // Labels
  labels: '/labels',

  // Templates
  templates: '/task-templates',

  // Subtasks
  subtasks: '/subtasks',

  // Telegram
  telegram: '/telegram',
} as const

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const

// API Response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
  success: boolean
  timestamp: string
  requestId: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  message: string
  code: string
  status: number
  details?: Record<string, any>
  timestamp: string
  requestId: string
}

// Request/Response transformers
export class ApiTransformers {
  // Request transformer - add common headers, auth tokens, etc.
  static transformRequest(config: RequestInit): RequestInit {
    const transformedConfig = { ...config }

    // Add default headers
    transformedConfig.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...transformedConfig.headers,
    }

    // Add authorization token if available
    const token = localStorage.getItem('auth-token')
    if (token) {
      ;(transformedConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    // Add request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    ;(transformedConfig.headers as Record<string, string>)['X-Request-ID'] = requestId

    return transformedConfig
  }

  // Response transformer - normalize API responses
  static transformResponse<T>(response: Response, data: any): ApiResponse<T> {
    const requestId = response.headers.get('X-Request-ID') || 'unknown'

    return {
      data: data as T,
      message: data?.message || '',
      status: response.status,
      success: response.ok,
      timestamp: new Date().toISOString(),
      requestId,
    }
  }

  // Error transformer - normalize API errors
  static transformError(error: any, response?: Response): ApiError {
    const requestId = response?.headers.get('X-Request-ID') || 'unknown'

    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || error.message || 'Server Error',
        code: error.response.data?.code || `HTTP_${error.response.status}`,
        status: error.response.status,
        details: error.response.data?.details,
        timestamp: new Date().toISOString(),
        requestId,
      }
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network Error - No response received',
        code: 'NETWORK_ERROR',
        status: 0,
        details: { originalError: error.message },
        timestamp: new Date().toISOString(),
        requestId,
      }
    } else {
      // Something else happened
      return {
        message: error.message || 'Unknown Error',
        code: 'UNKNOWN_ERROR',
        status: 0,
        details: { originalError: error },
        timestamp: new Date().toISOString(),
        requestId,
      }
    }
  }
}

// API Client class
export class ApiClient {
  private baseURL: string
  private defaultConfig: RequestInit

  constructor(baseURL: string = API_CONFIG.baseURL, config: RequestInit = {}) {
    this.baseURL = baseURL
    this.defaultConfig = config
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    const config = ApiTransformers.transformRequest({
      ...this.defaultConfig,
      ...options,
    })

    try {
      const response = await fetch(url, config)

      let data: any = null
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw { response, data }
      }

      return ApiTransformers.transformResponse<T>(response, data)
    } catch (error) {
      throw ApiTransformers.transformError(error)
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    })
  }

  async put<T>(endpoint: string, data?: any, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    })
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    })
  }

  async delete<T>(endpoint: string, config?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  // Utility methods
  setAuthToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth-token', token)
    } else {
      localStorage.removeItem('auth-token')
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth-token')
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }
}

// Create default API client instance
export const apiClient = new ApiClient()

// Query Keys factory for React Query
export const queryKeys = {
  // Auth
  auth: {
    profile: ['auth', 'profile'] as const,
  },

  // Workspaces
  workspaces: {
    all: ['workspaces'] as const,
    lists: () => [...queryKeys.workspaces.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.workspaces.lists(), filters] as const,
    details: () => [...queryKeys.workspaces.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workspaces.details(), id] as const,
    members: (id: string) => [...queryKeys.workspaces.detail(id), 'members'] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    search: (query: string) => [...queryKeys.tasks.all, 'search', query] as const,
    time: (id: string) => [...queryKeys.tasks.detail(id), 'time'] as const,
  },

  // Labels
  labels: {
    all: ['labels'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.labels.all, filters] as const,
  },

  // Templates
  templates: {
    all: ['templates'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.templates.all, filters] as const,
  },

  // Subtasks
  subtasks: {
    all: ['subtasks'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.subtasks.all, filters] as const,
    detail: (id: string) => [...queryKeys.subtasks.all, id] as const,
  },
} as const

// Mutation Keys factory
export const mutationKeys = {
  auth: {
    login: ['auth', 'login'] as const,
    logout: ['auth', 'logout'] as const,
    refresh: ['auth', 'refresh'] as const,
  },

  workspaces: {
    create: ['workspaces', 'create'] as const,
    update: (id: string) => ['workspaces', 'update', id] as const,
    delete: (id: string) => ['workspaces', 'delete', id] as const,
    addMember: (id: string) => ['workspaces', 'addMember', id] as const,
    removeMember: (id: string) => ['workspaces', 'removeMember', id] as const,
  },

  tasks: {
    create: ['tasks', 'create'] as const,
    update: (id: string) => ['tasks', 'update', id] as const,
    delete: (id: string) => ['tasks', 'delete', id] as const,
    updateTime: (id: string) => ['tasks', 'updateTime', id] as const,
  },

  labels: {
    create: ['labels', 'create'] as const,
    update: (id: string) => ['labels', 'update', id] as const,
    delete: (id: string) => ['labels', 'delete', id] as const,
  },

  templates: {
    create: ['templates', 'create'] as const,
    update: (id: string) => ['templates', 'update', id] as const,
    delete: (id: string) => ['templates', 'delete', id] as const,
  },

  subtasks: {
    create: ['subtasks', 'create'] as const,
    update: (id: string) => ['subtasks', 'update', id] as const,
    delete: (id: string) => ['subtasks', 'delete', id] as const,
  },
} as const
