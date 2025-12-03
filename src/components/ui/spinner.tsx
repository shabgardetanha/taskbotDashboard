import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'secondary'
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'default', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-12 h-12'
    }

    const colorClasses = {
      default: 'text-gray-400',
      primary: 'text-blue-500',
      secondary: 'text-gray-600'
    }

    return (
      <div
        ref={ref}
        className={cn('animate-spin rounded-full border-2 border-transparent border-t-current', sizeClasses[size], colorClasses[variant], className)}
        {...props}
      >
        <span className="sr-only">در حال بارگذاری...</span>
      </div>
    )
  }
)
Spinner.displayName = 'Spinner'

export { Spinner }
