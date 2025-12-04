'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Calendar,
  Kanban,
  Search,
  BarChart3,
  Home,
  Menu,
  X,
  FileText,
  Settings,
  User,
  Moon,
  Sun,
  Plus,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { WorkspaceSelector } from '@/components/WorkspaceSelector'
import { useDashboardShortcuts } from '@/hooks/useKeyboardShortcuts'

interface NavigationItem {
  name: string
  href: string
  icon: any
  color: string
  bgColor: string
  description?: string
}

const navigation: NavigationItem[] = [
  {
    name: 'خانه',
    href: '/',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'صفحه اصلی'
  },
  {
    name: 'کانبان',
    href: '/dashboard/kanban',
    icon: Kanban,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    description: 'مدیریت وظایف بصری'
  },
  {
    name: 'تقویم',
    href: '/dashboard/calendar',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    description: 'برنامه‌ریزی زمانی'
  },
  {
    name: 'جستجو',
    href: '/dashboard/search',
    icon: Search,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    description: 'جستجوی پیشرفته'
  },
  {
    name: 'تحلیل‌ها',
    href: '/dashboard/analytics',
    icon: BarChart3,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    description: 'گزارش‌ها و آمار'
  },
  {
    name: 'قالب‌ها',
    href: '/dashboard/templates',
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    description: 'قالب‌های آماده'
  },
]

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Initialize theme and sidebar state
  useEffect(() => {
    const initializeApp = () => {
      // Theme initialization
      const savedTheme = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)

      setDarkMode(shouldBeDark)
      document.documentElement.classList.toggle('dark', shouldBeDark)

      // Sidebar collapse state for desktop
      const savedCollapsed = localStorage.getItem('sidebar-collapsed')
      if (savedCollapsed) {
        setSidebarCollapsed(JSON.parse(savedCollapsed))
      }
    }

    initializeApp()
  }, [])

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    document.documentElement.classList.toggle('dark', newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const toggleSidebarCollapse = useCallback(() => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed))
  }, [sidebarCollapsed])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  // Keyboard shortcuts - simplified to avoid toast import issues
  useDashboardShortcuts({
    onCreateTask: () => {
      // Simplified - no toast
      router.push('/dashboard/kanban')
    },
    onSearch: () => {
      router.push('/dashboard/search')
    },
    onToggleSidebar: toggleSidebarCollapse,
    onRefresh: () => window.location.reload(),
    onNavigateHome: () => router.push('/'),
    onNavigateKanban: () => router.push('/dashboard/kanban'),
    onNavigateCalendar: () => router.push('/dashboard/calendar'),
    onNavigateAnalytics: () => router.push('/dashboard/analytics'),
  })

  // Determine if we're on mobile/desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-72'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile Sidebar Overlay - Only show on mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 animate-in fade-in-0 duration-300">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSidebar} />
          <div className="relative flex w-full max-w-xs flex-col bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
            <SidebarContent
              navigation={navigation}
              pathname={pathname}
              onNavigate={closeSidebar}
              isCollapsed={false}
              isMobile={true}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Always visible on desktop, collapsible */}
      {!isMobile && (
        <div className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${sidebarWidth}`}>
          <div className="flex flex-col h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
            <SidebarContent
              navigation={navigation}
              pathname={pathname}
              onNavigate={() => {}}
              isCollapsed={sidebarCollapsed}
              isMobile={false}
              onToggleCollapse={toggleSidebarCollapse}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${isMobile ? 'pl-0' : sidebarCollapsed ? 'pl-16' : 'pl-72'}`}>
        {/* Mobile Header - Only on mobile */}
        {isMobile && (
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
                aria-label="باز کردن منو"
              >
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>

              <div className="flex items-center gap-3">
                <WorkspaceSelector compact />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
                  aria-label={darkMode ? "حالت روز" : "حالت شب"}
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-blue-500" />
                  )}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

// Separate Sidebar Content Component for reusability
function SidebarContent({
  navigation,
  pathname,
  onNavigate,
  isCollapsed,
  isMobile,
  onToggleCollapse
}: {
  navigation: NavigationItem[]
  pathname: string
  onNavigate: () => void
  isCollapsed: boolean
  isMobile: boolean
  onToggleCollapse?: () => void
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                TaskBot
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">پلتفرم هوشمند</p>
            </div>
          </div>
        )}

        {isMobile ? (
          <button
            onClick={onNavigate}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110"
            aria-label="بستن منو"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
          </button>
        ) : (
          !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
              aria-label="جمع کردن منو"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )
        )}

        {isCollapsed && !isMobile && (
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
            aria-label="باز کردن منو"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <Link
            href="/dashboard/kanban"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            وظیفه جدید
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'} text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                isActive
                  ? `${item.bgColor} ${item.color} shadow-lg shadow-current/25 border border-current/20`
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
              }`}
              onClick={onNavigate}
              title={isCollapsed ? item.name : undefined}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? `${item.color} bg-white/50 shadow-sm`
                  : 'text-gray-500 group-hover:text-current'
              }`}>
                <item.icon className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  {isActive && (
                    <div className="text-xs opacity-75 mt-0.5 truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              )}

              {isActive && !isCollapsed && (
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  کاربر TaskBot
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  آنلاین
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              <Link
                href="/dashboard/settings"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
                title="تنظیمات"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
