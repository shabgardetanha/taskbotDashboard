import { QueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus in production, but not in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',

      // Don't refetch on reconnect by default
      refetchOnReconnect: false,

      // Don't refetch on mount by default
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,

      // Show error toast on mutation failure
      onError: (error: Error) => {
        toast({
          title: 'خطا',
          description: error.message || 'عملیات با شکست مواجه شد',
          variant: 'destructive',
        })
      },
    },
  },
})

// Query client is configured with global error handling through default options
// Individual queries and mutations can override these defaults as needed
