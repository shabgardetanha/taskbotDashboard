'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase'
import {
  User,
  Settings,
  Bell,
  Moon,
  Sun,
  Shield,
  Palette,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Camera,
  Trash2,
  Download
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  telegram_id: number
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'fa' | 'en'
  notifications: {
    email: boolean
    push: boolean
    telegram: boolean
  }
  timezone: string
  dateFormat: 'fa' | 'en'
  timeFormat: '12h' | '24h'
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    language: 'fa',
    notifications: {
      email: true,
      push: true,
      telegram: true
    },
    timezone: 'Asia/Tehran',
    dateFormat: 'fa',
    timeFormat: '24h'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security'>('profile')

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      // Load user profile
      const { data: profileData } = await supabase.auth.getUser()
      if (profileData.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileData.user.id)
          .single()

        if (userProfile) {
          setProfile(userProfile)
        }
      }

      // Load settings from localStorage (in production, this would come from database)
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, ...updates })
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage (in production, save to database)
      localStorage.setItem('userSettings', JSON.stringify(settings))

      // Apply theme immediately
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const exportData = () => {
    // In production, this would export user's data
    const data = {
      profile,
      settings,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'taskbot-data-export.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'profile', label: 'پروفایل', icon: User },
    { id: 'appearance', label: 'ظاهر', icon: Palette },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
    { id: 'security', label: 'امنیت', icon: Shield }
  ]

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری تنظیمات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-500" />
          تنظیمات حساب کاربری
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          تنظیمات و تنظیمات پیشرفته حساب کاربری خود را مدیریت کنید
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportData}
                    className="w-full justify-start"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    خروجی داده‌ها
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadUserData}
                    className="w-full justify-start"
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    بازخوانی
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {(() => {
                  const activeTabData = tabs.find(tab => tab.id === activeTab)
                  return activeTabData ? <activeTabData.icon className="w-6 h-6" /> : null
                })()}
                {tabs.find(tab => tab.id === activeTab)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{profile?.full_name || 'کاربر TaskBot'}</h3>
                      <p className="text-gray-600 dark:text-gray-400">Telegram ID: {profile?.telegram_id}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        عضو از {profile ? new Date(profile.created_at).toLocaleDateString('fa-IR') : ''}
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">نام کامل</label>
                      <Input
                        value={profile?.full_name || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                        placeholder="نام و نام خانوادگی"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ایمیل</label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">برای تغییر ایمیل با پشتیبانی تماس بگیرید</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => profile?.full_name && updateProfile({ full_name: profile.full_name })}>
                      {isSaving ? <LoadingSpinner size="sm" className="ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                      ذخیره تغییرات
                    </Button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium mb-3">تم برنامه</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'روشن', icon: Sun },
                        { value: 'dark', label: 'تیره', icon: Moon },
                        { value: 'system', label: 'سیستم', icon: Smartphone }
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          onClick={() => setSettings(prev => ({ ...prev, theme: theme.value as any }))}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            settings.theme === theme.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <theme.icon className="w-6 h-6 mx-auto mb-2" />
                          <div className="text-sm font-medium">{theme.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium mb-3">زبان</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'fa', label: 'فارسی', flag: '🇮🇷' },
                        { value: 'en', label: 'English', flag: '🇺🇸' }
                      ].map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => setSettings(prev => ({ ...prev, language: lang.value as any }))}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            settings.language === lang.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="text-2xl mb-2">{lang.flag}</div>
                          <div className="text-sm font-medium">{lang.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date/Time Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-3">فرمت تاریخ</label>
                      <div className="space-y-2">
                        {[
                          { value: 'fa', label: 'فارسی (۱۴۰۲/۱۲/۲۵)', example: '۱۴۰۲/۱۲/۲۵' },
                          { value: 'en', label: 'میلادی (2023-12-25)', example: '2023-12-25' }
                        ].map((format) => (
                          <button
                            key={format.value}
                            onClick={() => setSettings(prev => ({ ...prev, dateFormat: format.value as any }))}
                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                              settings.dateFormat === format.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">{format.example}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">فرمت زمان</label>
                      <div className="space-y-2">
                        {[
                          { value: '24h', label: '24 ساعته (14:30)', example: '14:30' },
                          { value: '12h', label: '12 ساعته (2:30 PM)', example: '2:30 PM' }
                        ].map((format) => (
                          <button
                            key={format.value}
                            onClick={() => setSettings(prev => ({ ...prev, timeFormat: format.value as any }))}
                            className={`w-full p-3 rounded-lg border text-left transition-all ${
                              settings.timeFormat === format.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">{format.example}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">تنظیمات اعلان‌ها</h3>

                    {[
                      { key: 'telegram', label: 'ربات تلگرام', description: 'اعلان‌های مهم از طریق ربات' },
                      { key: 'push', label: 'اعلان‌های مرورگر', description: 'اعلان‌های push در مرورگر' },
                      { key: 'email', label: 'ایمیل', description: 'اعلان‌های مهم به ایمیل' }
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium">{notification.label}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{notification.description}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                [notification.key]: e.target.checked
                              }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">نکته مهم</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          تنظیمات اعلان‌ها ممکن است بسته به تنظیمات سیستم عامل و مرورگر شما تغییر کند.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">امنیت حساب</h3>

                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-medium">رمز عبور</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">برای امنیت بیشتر رمز عبور خود را تغییر دهید</div>
                        </div>
                        <Button variant="outline">
                          <Lock className="w-4 h-4 ml-2" />
                          تغییر رمز عبور
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="رمز عبور فعلی"
                          disabled
                        />
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="رمز عبور جدید"
                            disabled
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-red-900 dark:text-red-100">حذف حساب</div>
                          <div className="text-sm text-red-700 dark:text-red-300">این عمل قابل بازگشت نیست</div>
                        </div>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف حساب
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {(activeTab === 'appearance' || activeTab === 'notifications') && (
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={saveSettings} disabled={isSaving}>
                    {isSaving ? <LoadingSpinner size="sm" className="ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                    ذخیره تنظیمات
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
