'use client'

import { NotificationsDropdown } from '@/components/NotificationsDropdown'
import { WorkspaceSelector } from '@/components/WorkspaceSelector'
import { useAccessibility } from '@/hooks/useAccessibility'
import { useDashboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Kanban,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
  X,
  Zap,
  Clock,
  Activity,
  TrendingUp,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useMemo, memo, Suspense } from 'react'

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

// Performance Dashboard Component
const PerformanceDashboard = memo(() => {
  const [metrics, setMetrics] = useState({
    tasksToday: 0,
    completionRate: 0,
    activeTime: '0h 0m',
    streak: 0
  })

  useEffect(() => {
    // Simulate fetching performance metrics
    const fetchMetrics = () => {
      setMetrics({
        tasksToday: Math.floor(Math.random() * 10) + 1,
        completionRate: Math.floor(Math.random() * 40) + 60,
        activeTime: `${Math.floor(Math.random() * 8) + 1}h ${Math.floor(Math.random() * 60)}m`,
        streak: Math.floor(Math.random() * 15) + 1
      })
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        عملکرد امروز
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">وظایف</span>
          </div>
          <span className="text-xs font-medium text-gray-900 dark:text-white">{metrics.tasksToday}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">نرخ تکمیل</span>
          </div>
          <span className="text-xs font-medium text-green-600">{metrics.completionRate}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">زمان فعالیت</span>
          </div>
          <span className="text-xs font-medium text-gray-900 dark:text-white">{metrics.activeTime}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-purple-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">پی در پی</span>
          </div>
          <span className="text-xs font-medium text-purple-600">{metrics.streak} روز</span>
        </div>
      </div>
    </div>
  )
})

PerformanceDashboard.displayName = 'PerformanceDashboard'

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

  // Activate global accessibility helpers (screen reader, skip links, reduced motion, etc.)
  useAccessibility()

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

  // Memoized mobile detection with debounced resize handling
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth)
      }, 100) // Debounce resize events
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const isMobile = useMemo(() => windowWidth < 1024, [windowWidth])
  const sidebarWidth = useMemo(() => sidebarCollapsed ? 'w-16' : 'w-72', [sidebarCollapsed])

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
        <div className={`fixed inset-y-0 right-0 z-40 transition-all duration-300 ease-in-out ${sidebarWidth}`}>
          <div className="flex flex-col h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
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
      <div className={`transition-all duration-300 ease-in-out ${isMobile ? 'pr-0' : sidebarCollapsed ? 'pr-16' : 'pr-72'}`}>
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
                <NotificationsDropdown />
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

        {/* Desktop topbar (notifications + theme) */}
        {!isMobile && (
          <div className="flex items-center justify-end gap-3 p-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <NotificationsDropdown />
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
        )}

        {/* Page Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>

        {/* Floating Action Button for Quick Task Creation - Desktop Only */}
        {!isMobile && (
          <div className="fixed bottom-6 left-6 z-30">
            <Link
              href="/dashboard/kanban"
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 hover:rotate-12"
              aria-label="ایجاد وظیفه سریع"
            >
              <Plus className="w-6 h-6" />
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                ایجاد وظیفه جدید
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </Link>
          </div>
        )}

        {/* Quick Action Bar - Desktop Only */}
        {!isMobile && (
          <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
            {/* Search Quick Action */}
            <Link
              href="/dashboard/search"
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200/50 dark:border-gray-700/50"
              aria-label="جستجوی سریع"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors" />
            </Link>

            {/* Calendar Quick Action */}
            <Link
              href="/dashboard/calendar"
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200/50 dark:border-gray-700/50"
              aria-label="تقویم"
            >
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-green-500 transition-colors" />
            </Link>

            {/* Analytics Quick Action */}
            <Link
              href="/dashboard/analytics"
              className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200/50 dark:border-gray-700/50"
              aria-label="تحلیل‌ها"
            >
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-pink-500 transition-colors" />
            </Link>
          </div>
        )}
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

      {/* Performance Dashboard */}
      {!isCollapsed && !isMobile && (
        <Suspense fallback={<div className="px-4 py-3 text-xs text-gray-500">در حال بارگذاری...</div>}>
          <PerformanceDashboard />
        </Suspense>
      )}

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
