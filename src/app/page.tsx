import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  Zap,
  CheckSquare,
  Calendar,
  BarChart3,
  Bot,
  ArrowRight,
  Star,
  Users,
  Clock,
  Smartphone
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'TaskBot Persian - مدیریت وظایف هوشمند',
  description: 'پلتفرم مدیریت وظایف هوشمند با ربات تلگرام و سیستم کانبان پیشرفته. تجربه‌ای بی‌نظیر از بهره‌وری و سازماندهی کارها.',
  keywords: ['مدیریت وظایف', 'کانبان', 'تلگرام', 'TaskBot', 'برنامه‌ریزی', 'بهره‌وری'],
  openGraph: {
    title: 'TaskBot Persian - مدیریت وظایف هوشمند',
    description: 'پلتفرم مدیریت وظایف با ربات تلگرام و کانبان حرفه‌ای',
    type: 'website',
  },
}

export default function Home() {
  const features = [
    {
      icon: Bot,
      title: 'ربات تلگرام هوشمند',
      description: 'مدیریت وظایف از طریق ربات تلگرام با ۱۵+ دستور پیشرفته',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: CheckSquare,
      title: 'کانبان حرفه‌ای',
      description: 'سیستم drag & drop پیشرفته با رابط کاربری مدرن',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      icon: Calendar,
      title: 'مدیریت زمان',
      description: 'یادآوری‌های هوشمند و پیگیری مهلت‌های زمانی',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: BarChart3,
      title: 'گزارش‌های پیشرفته',
      description: 'آمار و تحلیل‌های کامل عملکرد و پیشرفت',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ]

  const stats = [
    { label: 'کاربر فعال', value: '۱۰۰۰+', icon: Users },
    { label: 'وظیفه تکمیل شده', value: '۱۰,۰۰۰+', icon: CheckSquare },
    { label: 'زمان صرفه‌جویی', value: '۸۰%', icon: Clock },
    { label: 'دستگاه سازگار', value: 'همه', icon: Smartphone }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/5 dark:to-purple-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl shadow-purple-500/25 animate-bounce-gentle">
                <Zap className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              TaskBot Persian
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              پلتفرم مدیریت وظایف هوشمند با ربات تلگرام و کانبان حرفه‌ای.
              تجربه‌ای بی‌نظیر از بهره‌وری و سازماندهی کارها.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/kanban">
                <Button size="xl" className="text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300">
                  شروع کار رایگان
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="text-lg px-8 py-4" asChild>
                <a href="https://t.me/PersianTaskBot2025" target="_blank">
                  <Bot className="w-5 h-5 ml-2" />
                  ربات تلگرام
                </a>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center">
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ویژگی‌های قدرتمند
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            همه ابزارهای مورد نیاز برای مدیریت حرفه‌ای وظایف در یک پلتفرم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-current/20">
              <CardHeader>
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              تجربه کنید!
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              از ربات تلگرام شروع کنید یا مستقیماً وارد کانبان شوید
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">۱. ربات تلگرام</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                وظایف را از طریق چت اضافه کنید
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://t.me/PersianTaskBot2025" target="_blank">
                  شروع چت
                </a>
              </Button>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckSquare className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">۲. کانبان</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                وظایف را سازماندهی و مدیریت کنید
              </p>
              <Link href="/dashboard/kanban">
                <Button size="sm">
                  باز کردن کانبان
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">۳. تحلیل‌ها</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                پیشرفت خود را پیگیری کنید
              </p>
              <Link href="/dashboard/analytics">
                <Button variant="success" size="sm">
                  مشاهده آمار
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl text-white">
            <h3 className="text-3xl font-bold mb-4">
              آماده شروع هستید؟
            </h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              همین امروز مدیریت وظایف خود را متحول کنید و بهره‌وری را افزایش دهید
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/kanban">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg">
                  شروع رایگان
                  <Star className="w-5 h-5 mr-2" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10" asChild>
                <a href="https://t.me/PersianTaskBot2025" target="_blank">
                  <Bot className="w-5 h-5 ml-2" />
                  ربات تلگرام
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
