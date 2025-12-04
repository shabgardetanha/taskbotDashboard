'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileX, Plus, Search, Zap } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'minimal' | 'card'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className
}: EmptyStateProps) {
  const variants = {
    default: 'min-h-[300px] py-12',
    minimal: 'py-8',
    card: 'min-h-[200px] py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
  }

  const defaultIcons = {
    tasks: <FileX className="w-12 h-12 text-gray-400" />,
    search: <Search className="w-12 h-12 text-gray-400" />,
    general: <Zap className="w-12 h-12 text-gray-400" />
  }

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', variants[variant], className)}>
      <div className="mb-6">
        {icon || defaultIcons.general}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button onClick={action.onClick} className="flex items-center gap-2">
            {action.icon || <Plus className="w-4 h-4" />}
            {action.label}
          </Button>
        )}

        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// Predefined empty states for common use cases
interface TaskEmptyStateProps {
  onCreateTask?: () => void
  variant?: 'kanban-column' | 'search' | 'all-tasks'
  className?: string
}

export function TaskEmptyState({ onCreateTask, variant = 'all-tasks', className }: TaskEmptyStateProps) {
  const configs = {
    'kanban-column': {
      icon: <FileX className="w-12 h-12 text-gray-400" />,
      title: 'هیچ وظیفه‌ای در این ستون وجود ندارد',
      description: 'وظایف جدید را اینجا اضافه کنید یا از ستون‌های دیگر انتقال دهید.',
      action: onCreateTask ? {
        label: 'ایجاد وظیفه',
        onClick: onCreateTask,
        icon: <Plus className="w-4 h-4" />
      } : undefined
    },
    search: {
      icon: <Search className="w-12 h-12 text-gray-400" />,
      title: 'نتیجه‌ای یافت نشد',
      description: 'با کلمات کلیدی دیگر جستجو کنید یا فیلترها را تغییر دهید.',
      action: {
        label: 'پاک کردن فیلترها',
        onClick: () => window.location.reload(),
        icon: <Search className="w-4 h-4" />
      }
    },
    'all-tasks': {
      icon: <FileX className="w-12 h-12 text-gray-400" />,
      title: 'هنوز وظیفه‌ای ایجاد نشده',
      description: 'اولین وظیفه خود را ایجاد کنید و شروع به سازماندهی کارها کنید.',
      action: onCreateTask ? {
        label: 'ایجاد اولین وظیفه',
        onClick: onCreateTask,
        icon: <Plus className="w-4 h-4" />
      } : undefined
    }
  }

  const config = configs[variant]

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      {...(config.action && { action: config.action })}
      {...(className && { className })}
    />
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'خطایی رخ داد',
  description = 'متاسفانه در بارگذاری داده‌ها خطایی رخ داد. لطفا دوباره تلاش کنید.',
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={<div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
        <FileX className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>}
      title={title}
      description={description}
      {...(onRetry && { action: { label: 'تلاش دوباره', onClick: onRetry } })}
      {...(className && { className })}
    />
  )
}

interface NoDataStateProps {
  title?: string
  description?: string
  className?: string
}

export function NoDataState({
  title = 'داده‌ای برای نمایش وجود ندارد',
  description = 'در حال حاضر اطلاعاتی برای نمایش وجود ندارد.',
  className
}: NoDataStateProps) {
  return (
    <EmptyState
      icon={<div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <FileX className="w-6 h-6 text-gray-400" />
      </div>}
      title={title}
      description={description}
      {...(className && { className })}
    />
  )
}
