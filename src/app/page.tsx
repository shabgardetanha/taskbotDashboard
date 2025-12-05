import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            TaskBot Persian
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            پلتفرم مدیریت وظایف هوشمند با ربات تلگرام و کانبان حرفه‌ای.
          </p>
          <Link href="/dashboard/kanban">
            <Button size="xl" className="text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300">
              شروع کار رایگان
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
