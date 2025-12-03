'use client'

import { useEffect, useCallback, useState } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useUserStore } from '@/stores/user-store'

interface AccessibilityOptions {
  announcePageChanges?: boolean
  manageFocus?: boolean
  handleKeyboardNavigation?: boolean
  announceDynamicContent?: boolean
}

// Screen reader announcements
export function useScreenReader() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.setAttribute('class', 'sr-only')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'

    document.body.appendChild(announcement)
    announcement.textContent = message

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  const announcePageChange = useCallback((pageTitle: string) => {
    announce(`صفحه ${pageTitle} بارگذاری شد`, 'assertive')
  }, [announce])

  const announceLoading = useCallback((isLoading: boolean) => {
    if (isLoading) {
      announce('در حال بارگذاری...', 'polite')
    } else {
      announce('بارگذاری کامل شد', 'polite')
    }
  }, [announce])

  const announceError = useCallback((message: string) => {
    announce(`خطا: ${message}`, 'assertive')
  }, [announce])

  return {
    announce,
    announcePageChange,
    announceLoading,
    announceError,
  }
}

// Focus management
export function useFocusManagement() {
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([])

  const updateFocusableElements = useCallback((container?: HTMLElement) => {
    const containerElement = container || document
    const focusable = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    setFocusableElements(Array.from(focusable) as HTMLElement[])
  }, [])

  const focusFirstElement = useCallback((container?: HTMLElement) => {
    updateFocusableElements(container)
    if (focusableElements.length > 0 && focusableElements[0]) {
      focusableElements[0].focus()
    }
  }, [focusableElements, updateFocusableElements])

  const focusLastElement = useCallback((container?: HTMLElement) => {
    updateFocusableElements(container)
    if (focusableElements.length > 0 && focusableElements[focusableElements.length - 1]) {
      focusableElements[focusableElements.length - 1].focus()
    }
  }, [focusableElements, updateFocusableElements])

  const trapFocus = useCallback((container: HTMLElement) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        updateFocusableElements(container)
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }

      if (event.key === 'Escape') {
        // Allow escape to close modals/etc
        const closeButton = container.querySelector('[data-close]') as HTMLElement
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [focusableElements, updateFocusableElements])

  return {
    focusFirstElement,
    focusLastElement,
    trapFocus,
    updateFocusableElements,
  }
}

// Keyboard navigation
export function useKeyboardNavigation() {
  const { setBreakpoint } = useUIStore()

  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    // Skip if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return
    }

    // Global keyboard shortcuts
    switch (event.key) {
      case 'h':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          // Toggle help modal
          console.log('Help modal toggle')
        }
        break

      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          // Toggle sidebar (already handled in layout)
        }
        break

      case '1':
      case '2':
      case '3':
      case '4':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          // Navigation shortcuts (already handled in layout)
        }
        break
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts)
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [handleKeyboardShortcuts])

  return { handleKeyboardShortcuts }
}

// High contrast mode
export function useHighContrast() {
  const { updatePreferences, preferences } = useUserStore()

  const toggleHighContrast = useCallback(() => {
    const isHighContrast = document.documentElement.classList.contains('high-contrast')

    if (isHighContrast) {
      document.documentElement.classList.remove('high-contrast')
      updatePreferences({
        accessibility: {
          ...preferences.accessibility,
          highContrast: false
        }
      })
    } else {
      document.documentElement.classList.add('high-contrast')
      updatePreferences({
        accessibility: {
          ...preferences.accessibility,
          highContrast: true
        }
      })
    }
  }, [updatePreferences, preferences.accessibility])

  const setHighContrast = useCallback((enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
    updatePreferences({
      accessibility: {
        ...preferences.accessibility,
        highContrast: enabled
      }
    })
  }, [updatePreferences, preferences.accessibility])

  return { toggleHighContrast, setHighContrast }
}

// Reduced motion preferences
export function useReducedMotion() {
  const { setReducedMotion: setStoreReducedMotion } = useUIStore()

  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const setReducedMotion = useCallback((enabled: boolean) => {
    setStoreReducedMotion(enabled)

    if (enabled) {
      document.documentElement.style.setProperty('--animation-duration', '0s')
      document.documentElement.style.setProperty('--transition-duration', '0s')
    } else {
      document.documentElement.style.removeProperty('--animation-duration')
      document.documentElement.style.removeProperty('--transition-duration')
    }
  }, [setStoreReducedMotion])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
    }

    // Set initial value
    setReducedMotion(prefersReducedMotion())

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [prefersReducedMotion, setReducedMotion])

  return { setReducedMotion, prefersReducedMotion: prefersReducedMotion() }
}

// Skip links for navigation
export function useSkipLinks() {
  useEffect(() => {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'رفتن به محتوای اصلی'
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded'
    skipLink.setAttribute('aria-label', 'رفتن به محتوای اصلی صفحه')

    document.body.insertBefore(skipLink, document.body.firstChild)

    return () => {
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink)
      }
    }
  }, [])
}

// Main accessibility hook
export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announcePageChanges = true,
    manageFocus = true,
    handleKeyboardNavigation = true,
    announceDynamicContent = true,
  } = options

  const screenReader = useScreenReader()
  const focusManagement = useFocusManagement()
  const keyboardNavigation = useKeyboardNavigation()
  const highContrast = useHighContrast()
  const reducedMotion = useReducedMotion()

  // Initialize skip links
  useSkipLinks()

  // Announce page changes
  useEffect(() => {
    if (announcePageChanges) {
      screenReader.announcePageChange(document.title)
    }
  }, [announcePageChanges, screenReader])

  return {
    screenReader,
    focusManagement,
    keyboardNavigation,
    highContrast,
    reducedMotion,
    skipLinks: useSkipLinks,
  }
}

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // ARIA live region for dynamic content
  announceToScreenReader: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement)
      }
    }, 1000)
  },

  // Focus trap utility
  createFocusTrap: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  },
}
