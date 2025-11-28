'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TaskBot Persian
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            مدیریت وظایف با تلگرام + کانبان حرفه‌ای
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4">
            <Link href="/dashboard/kanban">
              <Button className="w-full text-lg h-12" size="lg">
                باز کردن کانبان
              </Button>
            </Link>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://t.me/PersianTaskBot2025" target="_blank">
                ربات تلگرام
              </a>
            </Button>
          </div>
          <div className="text-center text-sm text-gray-500">
            <p>وظایف رو با ربات اضافه کن، اینجا ببین و جابجا کن!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}