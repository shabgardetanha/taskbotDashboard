'use client'

import React, { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showErrorDetails?: boolean
  enableReporting?: boolean
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo?: React.ErrorInfo
  resetError: () => void
  errorId?: string
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  errorId
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900 dark:text-red-100">
            خطایی رخ داده است
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              متاسفانه خطایی غیرمنتظره رخ داده است. تیم فنی ما در حال بررسی مشکل می‌باشد.
            </p>

            {errorId && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  کد خطا: <code className="font-mono text-red-600 dark:text-red-400">{errorId}</code>
                </p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && (
              <details className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-left">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                  جزئیات فنی (برای توسعه‌دهندگان)
                </summary>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold text-red-700 dark:text-red-300">Error:</h4>
                    <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-2 rounded border overflow-auto">
                      {error.message}
                    </pre>
                  </div>
                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="font-semibold text-red-700 dark:text-red-300">Component Stack:</h4>
                      <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-2 rounded border overflow-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={resetError}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              صفحه اصلی
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const subject = `Bug Report - Error ID: ${errorId || 'Unknown'}`
                const body = `Error Details:
- Error ID: ${errorId}
- Message: ${error.message}
- URL: ${window.location.href}
- UserAgent: ${navigator.userAgent}
- Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred...`

                window.location.href = `mailto:support@taskbot.ir?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
              }}
              className="flex items-center gap-2"
            >
              <Bug className="w-4 h-4" />
              گزارش خطا
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId,
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Report error if enabled
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo)
    }

    // Show error toast
    toast({
      title: 'خطا',
      description: 'خطایی رخ داده است. لطفا صفحه را مجددا بارگذاری کنید.',
      variant: 'destructive',
    })
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: 'anonymous', // In real app, get from auth context
        additionalData: {
          reactVersion: React.version,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          online: navigator.onLine,
        },
      }

      // In production, send to error reporting service
      if (process.env.NODE_ENV === 'production') {
        // Example: send to Sentry, LogRocket, etc.
        console.log('Reporting error to monitoring service:', errorReport)

        // You can integrate with services like:
        // - Sentry: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
        // - LogRocket: LogRocket.captureException(error, { extra: errorReport })
        // - Custom API endpoint
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })

    // Clear any pending reset timeout
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }
  }

  private resetErrorAfterDelay = (delay: number = 100) => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError()
      this.resetTimeoutId = null
    }, delay)
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo || undefined}
          resetError={this.resetError}
          errorId={this.state.errorId || undefined}
        />
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Hook for imperative error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Handled error:', error, errorInfo)

    toast({
      title: 'خطا',
      description: error.message || 'خطایی رخ داده است',
      variant: 'destructive',
    })
  }
}

// Async error boundary for handling async operations
export class AsyncErrorBoundary extends Component<
  ErrorBoundaryProps & { promise?: Promise<any> },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { promise?: Promise<any> }) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  override componentDidMount() {
    if (this.props.promise) {
      this.props.promise.catch((error) => {
        this.setState({
          hasError: true,
          error,
          errorId: `ASYNC_ERR_${Date.now()}`,
        })
      })
    }
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={() => this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
          })}
          errorId={this.state.errorId || undefined}
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
