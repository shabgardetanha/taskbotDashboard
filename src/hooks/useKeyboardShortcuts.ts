'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey
      const altMatches = !!shortcut.altKey === event.altKey
      const metaMatches = !!shortcut.metaKey === event.metaKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

export function useDashboardShortcuts(options: {
  onCreateTask?: () => void
  onSearch?: () => void
  onToggleSidebar?: () => void
  onRefresh?: () => void
  onNavigateHome?: () => void
  onNavigateKanban?: () => void
  onNavigateCalendar?: () => void
  onNavigateAnalytics?: () => void
}) {
  const { onCreateTask, onSearch, onToggleSidebar, onRefresh, onNavigateHome, onNavigateKanban, onNavigateCalendar, onNavigateAnalytics } = options

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => onCreateTask?.(),
      description: 'ایجاد وظیفه جدید',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => onSearch?.(),
      description: 'جستجو',
    },
    {
      key: 'b',
      ctrlKey: true,
      action: () => onToggleSidebar?.(),
      description: 'تغییر وضعیت سایدبار',
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => onRefresh?.(),
      description: 'بروزرسانی صفحه',
    },
    {
      key: '1',
      ctrlKey: true,
      action: () => onNavigateHome?.(),
      description: 'رفتن به خانه',
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => onNavigateKanban?.(),
      description: 'رفتن به کانبان',
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => onNavigateCalendar?.(),
      description: 'رفتن به تقویم',
    },
    {
      key: '4',
      ctrlKey: true,
      action: () => onNavigateAnalytics?.(),
      description: 'رفتن به تحلیل‌ها',
    },
    {
      key: '/',
      action: () => onSearch?.(),
      description: 'جستجو سریع',
    },
  ]

  useKeyboardShortcuts(shortcuts)

  return shortcuts
}
