'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { SupportedLocale } from '@/lib/i18n'
import { localeConfig, getLocaleDirection, t as translate } from '@/lib/i18n'
import { useUserStore } from '@/stores/user-store'

interface I18nContextType {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  direction: 'rtl' | 'ltr'
  t: (key: string) => string
  availableLocales: typeof localeConfig
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
  defaultLocale?: SupportedLocale
}

export function I18nProvider({ children, defaultLocale = 'fa' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(defaultLocale)
  const [isLoading, setIsLoading] = useState(true)
  const { preferences, updatePreferences } = useUserStore()

  // Initialize locale from user preferences
  useEffect(() => {
    const savedLocale = preferences.language as SupportedLocale
    if (savedLocale && localeConfig[savedLocale]) {
      setLocaleState(savedLocale)
    }
    setIsLoading(false)
  }, [preferences.language])

  // Update document direction when locale changes
  useEffect(() => {
    const direction = getLocaleDirection(locale)
    document.documentElement.dir = direction
    document.documentElement.lang = locale
    document.documentElement.setAttribute('data-locale', locale)

    // Update CSS custom property for direction
    document.documentElement.style.setProperty('--direction', direction)
  }, [locale])

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale)
    updatePreferences({ language: newLocale })

    // Store in localStorage for persistence
    localStorage.setItem('taskbot-locale', newLocale)
  }

  const t = (key: string): string => {
    return translate(key as any, locale)
  }

  const value: I18nContextType = {
    locale,
    setLocale,
    direction: getLocaleDirection(locale),
    t,
    availableLocales: localeConfig,
    isLoading,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Higher-order component for i18n support
export function withI18n<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => {
    const i18n = useI18n()
    return <Component {...props} i18n={i18n} />
  }

  WrappedComponent.displayName = `withI18n(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Hook for imperative locale switching
export function useLocaleSwitcher() {
  const { locale, setLocale, availableLocales } = useI18n()

  const switchToFa = () => setLocale('fa')
  const switchToEn = () => setLocale('en')
  const toggleLocale = () => setLocale(locale === 'fa' ? 'en' : 'fa')

  return {
    currentLocale: locale,
    switchToFa,
    switchToEn,
    toggleLocale,
    availableLocales,
  }
}

// Hook for formatted content
export function useFormattedContent() {
  const { locale } = useI18n()
  const { formatDate, formatNumber, getValidationMessage } = require('@/lib/i18n')

  return {
    formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, options, locale),
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(number, options, locale),
    getValidationMessage: (type: string, ...args: any[]) =>
      getValidationMessage(type, locale, ...args),
  }
}

// Component for locale switcher UI
export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, availableLocales } = useI18n()

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Object.entries(availableLocales).map(([key, config]) => (
        <button
          key={key}
          onClick={() => setLocale(key as SupportedLocale)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            locale === key
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
          aria-label={`Switch to ${config.name}`}
        >
          <span className="mr-1">{config.flag}</span>
          {config.name}
        </button>
      ))}
    </div>
  )
}

// Utility component for translated text
interface TranslatedTextProps {
  id: string
  defaultMessage?: string
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function T({
  id,
  defaultMessage,
  className,
  as: Component = 'span'
}: TranslatedTextProps) {
  const { t } = useI18n()
  const text = t(id) || defaultMessage || id

  return React.createElement(Component, { className }, text)
}
