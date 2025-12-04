'use client'

import { cn } from '@/lib/utils'
import { Loader2, Zap } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary'
  className?: string
}

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }

  const variants = {
    default: 'text-gray-600 dark:text-gray-400',
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-purple-600 dark:text-purple-400'
  }

  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizes[size],
        variants[variant],
        className
      )}
    />
  )
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  }

  return (
    <div className={cn('flex space-x-1', className)}>
      <div className={cn('bg-current rounded-full animate-bounce', sizes[size])} style={{ animationDelay: '0ms' }} />
      <div className={cn('bg-current rounded-full animate-bounce', sizes[size])} style={{ animationDelay: '150ms' }} />
      <div className={cn('bg-current rounded-full animate-bounce', sizes[size])} style={{ animationDelay: '300ms' }} />
    </div>
  )
}

interface LoadingPulseProps {
  className?: string
}

export function LoadingPulse({ className }: LoadingPulseProps) {
  return (
    <div className={cn('animate-pulse bg-gray-200 dark:bg-gray-700 rounded', className)} />
  )
}

interface LoadingSkeletonProps {
  className?: string
  variant?: 'default' | 'circular'
}

export function LoadingSkeleton({ className, variant = 'default' }: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700'

  if (variant === 'circular') {
    return <div className={cn('rounded-full', baseClasses, className)} />
  }

  return <div className={cn('rounded', baseClasses, className)} />
}

interface TaskSkeletonProps {
  className?: string
}

export function TaskSkeleton({ className }: TaskSkeletonProps) {
  return (
    <div className={cn('p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <LoadingSkeleton className="h-5 w-3/4 mb-2" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
        <LoadingSkeleton className="w-16 h-6 rounded-full" />
      </div>

      <div className="flex items-center gap-4">
        <LoadingSkeleton className="w-20 h-4" />
        <LoadingSkeleton className="w-16 h-4" />
        <div className="flex gap-1 ml-auto">
          <LoadingSkeleton className="w-6 h-6 rounded" />
          <LoadingSkeleton className="w-6 h-6 rounded" />
          <LoadingSkeleton className="w-6 h-6 rounded" />
        </div>
      </div>
    </div>
  )
}

interface KanbanColumnSkeletonProps {
  title?: string
  className?: string
}

export function KanbanColumnSkeleton({ className }: KanbanColumnSkeletonProps) {
  return (
    <div className={cn('bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6', className)}>
      <div className="flex items-center gap-3 mb-6">
        <LoadingSkeleton className="w-10 h-10 rounded-xl" />
        <div>
          <LoadingSkeleton className="h-6 w-24 mb-1" />
          <LoadingSkeleton className="h-4 w-12" />
        </div>
        <LoadingSkeleton className="w-8 h-6 rounded-full ml-auto" />
      </div>

      <div className="space-y-4">
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </div>
    </div>
  )
}

interface PageLoadingProps {
  message?: string
  className?: string
}

export function PageLoading({ message = 'در حال بارگذاری...', className }: PageLoadingProps) {
  return (
    <div className={cn('min-h-[400px] flex flex-col items-center justify-center', className)}>
      <div className="relative mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-gentle">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -top-1 -right-1">
          <LoadingSpinner size="sm" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {message}
      </h3>

      <LoadingDots className="text-gray-500" />
    </div>
  )
}

interface InlineLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InlineLoading({ message, size = 'md', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-3 text-gray-600 dark:text-gray-400', className)}>
      <LoadingSpinner size={size} />
      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}

interface ButtonLoadingProps {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  className?: string
}

export function ButtonLoading({ loading, children, className }: ButtonLoadingProps) {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded">
          <LoadingSpinner size="sm" className="text-current" />
        </div>
      )}
      <div className={loading ? 'invisible' : ''}>
        {children}
      </div>
    </div>
  )
}
