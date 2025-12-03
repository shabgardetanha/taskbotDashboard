// src/app/dashboard/layout.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Bell,
  Moon,
  Sun,
  Plus,
  Zap
} from 'lucide-react'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'خانه', href: '/', icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'کانبان', href: '/dashboard/kanban', icon: Kanban, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: 'تقویم', href: '/dashboard/calendar', icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { name: 'جستجو', href: '/dashboard/search', icon: Search, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  { name: 'تحلیل‌ها', href: '/dashboard/analytics', icon: BarChart3, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-900/20' },
  { name: 'قالب‌ها', href: '/dashboard/templates', icon: FileText, color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in-0 duration-300">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    TaskBot
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">داشبورد هوشمند</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5 text-gray-500 hover:text-red-500" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                      isActive
                        ? `${item.bgColor} ${item.color} shadow-lg shadow-current/25 border border-current/20`
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`p-2 rounded-lg mr-3 transition-all duration-200 ${
                      isActive ? `${item.color} bg-white/50` : 'text-gray-500 group-hover:text-current'
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <div className="mr-auto w-2 h-2 bg-current rounded-full animate-pulse" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile footer */}
            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-500" />
                  )}
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200">
                  <Settings className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200">
                  <User className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/25 animate-bounce-gentle">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  TaskBot
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">پلتفرم مدیریت وظایف</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4">
            <Link
              href="/dashboard/kanban"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              وظیفه جدید
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? `${item.bgColor} ${item.color} shadow-xl shadow-current/20 border-2 border-current/30 backdrop-blur-sm`
                      : 'text-gray-600 hover:bg-white/50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white hover:shadow-lg'
                  }`}
                >
                  <div className={`p-3 rounded-xl mr-4 transition-all duration-300 ${
                    isActive
                      ? `${item.color} bg-white/70 shadow-lg`
                      : 'text-gray-500 group-hover:text-current bg-gray-100/50 dark:bg-gray-700/50 group-hover:bg-white/50 dark:group-hover:bg-gray-600/50'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    {isActive && (
                      <div className="text-xs opacity-75 mt-1">
                        صفحه فعلی
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-3 h-3 bg-current rounded-full animate-pulse shadow-lg" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Desktop footer */}
          <div className="p-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">کاربر TaskBot</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">آنلاین</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
                  title={darkMode ? "حالت روز" : "حالت شب"}
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-500" />
                  )}
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110 relative">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110">
                  <Settings className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 py-4 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TaskBot
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-500" />
                )}
              </button>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
