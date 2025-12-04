'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import {
  queryKeys,
  apiClient,
  API_ENDPOINTS,
} from '@/lib/api-client'
import type {
  ApiResponse,
  ApiError,
} from '@/lib/api-client'
import { useUserStore } from '@/stores/user-store'

// Enhanced query hook with better error handling
export function useApiQuery<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<ApiResponse<TData>>,
  options?: Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn()
        return response.data
      } catch (error) {
        console.error('Query error:', error)
        throw error // Re-throw for React Query to handle
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  })
}

export function useApiMutation<TData = unknown, TVariables = unknown, TError = ApiError>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<TData, TError, TVariables> & {
    successMessage?: string
    errorMessage?: string
    invalidateQueries?: QueryKey[]
    optimisticUpdate?: {
      queryKey: QueryKey
      updater: (oldData: any, variables: TVariables) => any
    }
  }
) {
  const queryClient = useQueryClient()
  const { successMessage, errorMessage, invalidateQueries, optimisticUpdate, ...mutationOptions } = options || {}

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables)
      return response.data
    },
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      if (optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: optimisticUpdate.queryKey })
      }

      // Snapshot previous value
      const previousData = optimisticUpdate
        ? queryClient.getQueryData(optimisticUpdate.queryKey)
        : undefined

      // Optimistically update
      if (optimisticUpdate && previousData !== undefined) {
        queryClient.setQueryData(
          optimisticUpdate.queryKey,
          optimisticUpdate.updater(previousData, variables)
        )
      }

      return { previousData }
    },
    onError: (_error: TError, _variables: TVariables, context: any) => {
      // Revert optimistic update on error
      if (optimisticUpdate && context?.previousData !== undefined) {
        queryClient.setQueryData(optimisticUpdate.queryKey, context.previousData)
      }

      // Show error message
      const message = errorMessage || 'عملیات با شکست مواجه شد'
      toast({
        title: 'خطا',
        description: message,
        variant: 'destructive',
      })
    },
    onSuccess: (_data: TData, _variables: TVariables, _context: any) => {
      // Invalidate related queries
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      }

      // Show success message
      if (successMessage) {
        toast({
          title: 'موفقیت',
          description: successMessage,
          variant: 'default',
        })
      }
    },
    onSettled: () => {
      // Always refetch after mutation settles
      if (optimisticUpdate) {
        queryClient.invalidateQueries({ queryKey: optimisticUpdate.queryKey })
      }
    },
    ...mutationOptions,
  })
}

// Workspace hooks
export function useWorkspaces(filters?: Record<string, any>) {
  return useApiQuery(
    queryKeys.workspaces.list(filters || {}),
    () => apiClient.get(API_ENDPOINTS.workspaces),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useWorkspace(id: string) {
  return useApiQuery(
    queryKeys.workspaces.detail(id),
    () => apiClient.get(API_ENDPOINTS.workspaceById(id)),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  )
}

export function useCreateWorkspace() {
  return useApiMutation(
    (data: any) => apiClient.post(API_ENDPOINTS.workspaces, data),
    {
      successMessage: 'ورک‌اسپیس با موفقیت ایجاد شد',
      invalidateQueries: [queryKeys.workspaces.all],
    }
  )
}

export function useUpdateWorkspace(id: string) {
  return useApiMutation(
    (data: any) => apiClient.put(API_ENDPOINTS.workspaceById(id), data),
    {
      successMessage: 'ورک‌اسپیس با موفقیت بروزرسانی شد',
      invalidateQueries: [queryKeys.workspaces.detail(id)],
    }
  )
}

export function useDeleteWorkspace() {
  return useApiMutation(
    (id: string) => apiClient.delete(API_ENDPOINTS.workspaceById(id)),
    {
      successMessage: 'ورک‌اسپیس با موفقیت حذف شد',
      invalidateQueries: [queryKeys.workspaces.all],
    }
  )
}

// Task hooks
export function useTasks(filters?: Record<string, any>) {
  return useApiQuery(
    queryKeys.tasks.list(filters || {}),
    () => apiClient.get(API_ENDPOINTS.tasks),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes - tasks change more frequently
    }
  )
}

export function useTask(id: string) {
  return useApiQuery(
    queryKeys.tasks.detail(id),
    () => apiClient.get(API_ENDPOINTS.taskById(id)),
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export function useCreateTask() {
  const { addRecentWorkspace } = useUserStore()

  return useApiMutation(
    (data: any) => apiClient.post(API_ENDPOINTS.tasks, data),
    {
      successMessage: 'وظیفه با موفقیت ایجاد شد',
      invalidateQueries: [queryKeys.tasks.all],
      onSuccess: (data: any) => {
        // Update recent workspaces if task has workspace
        if (data.workspaceId) {
          addRecentWorkspace(data.workspaceId)
        }
      },
    }
  )
}

export function useUpdateTask(id: string) {
  return useApiMutation(
    (data: any) => apiClient.put(API_ENDPOINTS.taskById(id), data),
    {
      successMessage: 'وظیفه با موفقیت بروزرسانی شد',
      invalidateQueries: [queryKeys.tasks.detail(id), queryKeys.tasks.all],
      optimisticUpdate: {
        queryKey: queryKeys.tasks.detail(id),
        updater: (oldData: any, variables: any) => ({
          ...oldData,
          ...variables,
        }),
      },
    }
  )
}

export function useDeleteTask() {
  return useApiMutation(
    (id: string) => apiClient.delete(API_ENDPOINTS.taskById(id)),
    {
      successMessage: 'وظیفه با موفقیت حذف شد',
      invalidateQueries: [queryKeys.tasks.all],
    }
  )
}

export function useSearchTasks(query: string) {
  return useApiQuery(
    queryKeys.tasks.search(query),
    () => apiClient.get(`${API_ENDPOINTS.taskSearch}?q=${encodeURIComponent(query)}`),
    {
      enabled: query.length > 2, // Only search when query is meaningful
      staleTime: 30 * 1000, // 30 seconds - search results are temporary
    }
  )
}

export function useTaskTime(id: string) {
  return useApiQuery(
    queryKeys.tasks.time(id),
    () => apiClient.get(API_ENDPOINTS.taskTime(id)),
    {
      enabled: !!id,
      staleTime: 60 * 1000, // 1 minute
    }
  )
}

export function useUpdateTaskTime(id: string) {
  return useApiMutation(
    (data: any) => apiClient.post(API_ENDPOINTS.taskTime(id), data),
    {
      successMessage: 'زمان وظیفه بروزرسانی شد',
      invalidateQueries: [queryKeys.tasks.time(id)],
    }
  )
}

// Label hooks
export function useLabels(filters?: Record<string, any>) {
  return useApiQuery(
    queryKeys.labels.list(filters || {}),
    () => apiClient.get(API_ENDPOINTS.labels),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - labels don't change often
    }
  )
}

export function useCreateLabel() {
  return useApiMutation(
    (data: any) => apiClient.post(API_ENDPOINTS.labels, data),
    {
      successMessage: 'برچسب با موفقیت ایجاد شد',
      invalidateQueries: [queryKeys.labels.all],
    }
  )
}

export function useUpdateLabel(id: string) {
  return useApiMutation(
    (data: any) => apiClient.put(`${API_ENDPOINTS.labels}/${id}`, data),
    {
      successMessage: 'برچسب با موفقیت بروزرسانی شد',
      invalidateQueries: [queryKeys.labels.all],
    }
  )
}

export function useDeleteLabel() {
  return useApiMutation(
    (id: string) => apiClient.delete(`${API_ENDPOINTS.labels}/${id}`),
    {
      successMessage: 'برچسب با موفقیت حذف شد',
      invalidateQueries: [queryKeys.labels.all],
    }
  )
}

// Template hooks
export function useTemplates(filters?: Record<string, any>) {
  return useApiQuery(
    queryKeys.templates.list(filters || {}),
    () => apiClient.get(API_ENDPOINTS.templates),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export function useCreateTemplate() {
  return useApiMutation(
    (data: any) => apiClient.post(API_ENDPOINTS.templates, data),
    {
      successMessage: 'قالب با موفقیت ایجاد شد',
      invalidateQueries: [queryKeys.templates.all],
    }
  )
}

// Subtask hooks
export function useSubtasks(taskId?: string, filters?: Record<string, any>) {
  return useApiQuery(
    queryKeys.subtasks.list({ taskId, ...filters }),
    () => apiClient.get(`${API_ENDPOINTS.subtasks}?taskId=${taskId || ''}`),
    {
      enabled: !!taskId,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export function useCreateSubtask() {
  return useApiMutation(
    (data: any) => apiClient.post(API_ENDPOINTS.subtasks, data),
    {
      successMessage: 'زیروظیفه با موفقیت ایجاد شد',
      invalidateQueries: [queryKeys.subtasks.all],
    }
  )
}

export function useUpdateSubtask(id: string) {
  return useApiMutation(
    (data: any) => apiClient.put(`${API_ENDPOINTS.subtasks}/${id}`, data),
    {
      successMessage: 'زیروظیفه با موفقیت بروزرسانی شد',
      invalidateQueries: [queryKeys.subtasks.all, queryKeys.subtasks.detail(id)],
    }
  )
}

export function useDeleteSubtask() {
  return useApiMutation(
    (id: string) => apiClient.delete(`${API_ENDPOINTS.subtasks}/${id}`),
    {
      successMessage: 'زیروظیفه با موفقیت حذف شد',
      invalidateQueries: [queryKeys.subtasks.all],
    }
  )
}

// Auth hooks
export function useAuthProfile() {
  return useApiQuery(
    queryKeys.auth.profile,
    () => apiClient.get(API_ENDPOINTS.auth.profile),
    {
      staleTime: 5 * 60 * 1000,
      retry: false, // Don't retry auth requests
    }
  )
}

export function useLogin() {
  const { setUser, setAuthenticated } = useUserStore()

  return useApiMutation(
    (credentials: { email: string; password: string }) =>
      apiClient.post(API_ENDPOINTS.auth.login, credentials),
    {
      onSuccess: (data: any) => {
        // Store auth token
        apiClient.setAuthToken(data.token)

        // Update user state
        setUser(data.user)
        setAuthenticated(true)

        toast({
          title: 'خوش آمدید',
          description: 'با موفقیت وارد شدید',
        })
      },
      onError: () => {
        // Clear any existing token on login failure
        apiClient.setAuthToken(null)
        setAuthenticated(false)
      },
    }
  )
}

export function useLogout() {
  const { logout } = useUserStore()

  return useApiMutation(
    () => apiClient.post(API_ENDPOINTS.auth.logout),
    {
      onSuccess: () => {
        // Clear auth token
        apiClient.setAuthToken(null)

        // Clear user state
        logout()

        toast({
          title: 'خداحافظ',
          description: 'با موفقیت خارج شدید',
        })
      },
    }
  )
}

// Telegram integration hooks
export function useTelegramStatus() {
  return useApiQuery(
    ['telegram', 'status'],
    () => apiClient.get(API_ENDPOINTS.telegram),
    {
      staleTime: 5 * 60 * 1000,
      retry: false,
    }
  )
}

export function useConnectTelegram() {
  return useApiMutation(
    (data: any) => apiClient.post(API_ENDPOINTS.telegram, data),
    {
      successMessage: 'ربات تلگرام با موفقیت متصل شد',
      invalidateQueries: [['telegram', 'status']],
    }
  )
}

export function useDisconnectTelegram() {
  return useApiMutation(
    () => apiClient.delete(API_ENDPOINTS.telegram),
    {
      successMessage: 'ربات تلگرام با موفقیت قطع شد',
      invalidateQueries: [['telegram', 'status']],
    }
  )
}

// Utility hooks
export function useApiStatus() {
  // Simple connectivity check
  return useQuery({
    queryKey: ['api', 'status'],
    queryFn: async () => {
      try {
        await apiClient.get('/health')
        return { status: 'online' as const }
      } catch {
        return { status: 'offline' as const }
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  })
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateTasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    invalidateWorkspaces: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all }),
    invalidateLabels: () => queryClient.invalidateQueries({ queryKey: queryKeys.labels.all }),
    invalidateTemplates: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates.all }),
  }
}
