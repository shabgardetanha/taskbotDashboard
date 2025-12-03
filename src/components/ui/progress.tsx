// src/components/ui/progress.tsx
'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'success' | 'warning' | 'error'
  showValue?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'default', showValue = false, ...props }, ref) => {
  const getIndicatorColor = () => {
    switch (variant) {
      case 'success': return 'bg-gradient-to-r from-green-400 to-green-600'
      case 'warning': return 'bg-gradient-to-r from-yellow-400 to-orange-500'
      case 'error': return 'bg-gradient-to-r from-red-400 to-red-600'
      default: return 'bg-gradient-to-r from-blue-400 to-blue-600'
    }
  }

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          'relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 shadow-inner',
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            'h-full w-full flex-1 transition-all duration-500 ease-out rounded-full shadow-sm',
            getIndicatorColor()
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {Math.round(value || 0)}%
          </span>
        </div>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
