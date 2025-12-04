'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useWorkspace } from '@/contexts/workspace-context'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
  Activity,
  PieChart
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface AnalyticsData {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  inProgressTasks: number
  todoTasks: number
  completionRate: number
  averageCompletionTime: number
  teamProductivity: number
  tasksByPriority: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  tasksByStatus: {
    todo: number
    inprogress: number
    done: number
  }
  recentActivity: Array<{
    id: string
    action: string
    user_name: string
    task_title: string
    created_at: string
  }>
  topPerformers: Array<{
    user_id: string
    user_name: string
    tasks_completed: number
    total_time: number
  }>
}

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { currentWorkspace } = useWorkspace()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    if (currentWorkspace) {
      loadAnalytics()
    }
  }, [currentWorkspace, timeRange])

  const loadAnalytics = async () => {
    if (!currentWorkspace) return

    setIsLoading(true)
    try {
      // In a real app, you'd have a dedicated analytics API
      // For now, we'll simulate analytics data
      const mockData: AnalyticsData = {
        totalTasks: 145,
        completedTasks: 89,
        overdueTasks: 12,
        inProgressTasks: 23,
        todoTasks: 21,
        completionRate: 61.4,
        averageCompletionTime: 4.2,
        teamProductivity: 78.5,
        tasksByPriority: {
          urgent: 15,
          high: 32,
          medium: 58,
          low: 40
        },
        tasksByStatus: {
          todo: 21,
          inprogress: 23,
          done: 89
        },
        recentActivity: [
          {
            id: '1',
            action: 'completed',
            user_name: 'احمد رضایی',
            task_title: 'طراحی رابط کاربری داشبورد',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          {
            id: '2',
            action: 'commented',
            user_name: 'مریم احمدی',
            task_title: 'پیاده‌سازی API پرداخت',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          },
          {
            id: '3',
            action: 'created',
            user_name: 'علی محمدی',
            task_title: 'بهینه‌سازی عملکرد دیتابیس',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
          }
        ],
        topPerformers: [
          { user_id: '1', user_name: 'احمد رضایی', tasks_completed: 24, total_time: 156 },
          { user_id: '2', user_name: 'مریم احمدی', tasks_completed: 18, total_time: 142 },
          { user_id: '3', user_name: 'علی محمدی', tasks_completed: 15, total_time: 98 }
        ]
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalytics(mockData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'همین الان'
    if (minutes < 60) return `${minutes} دقیقه پیش`
    if (hours < 24) return `${hours} ساعت پیش`

    return date.toLocaleDateString('fa-IR')
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'completed': return <CheckSquare className="w-4 h-4 text-green-500" />
      case 'created': return <Activity className="w-4 h-4 text-blue-500" />
      case 'commented': return <Activity className="w-4 h-4 text-purple-500" />
      case 'updated': return <Activity className="w-4 h-4 text-orange-500" />
      default: return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تحلیل‌های عملکرد
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            آمار و ارقام تیم {currentWorkspace?.name}
          </p>
        </div>

        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === 'week' ? 'هفته' : range === 'month' ? 'ماه' : 'سه‌ماهه'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  کل وظایف
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {analytics.totalTasks}
                </p>
              </div>
              <CheckSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  نرخ تکمیل
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.completionRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  وظایف معوق
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {analytics.overdueTasks}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  بهره‌وری تیم
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.teamProductivity}%
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              توزیع وضعیت وظایف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">در انتظار</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.tasksByStatus.todo}</span>
                  <Badge variant="outline" className="text-xs">
                    {((analytics.tasksByStatus.todo / analytics.totalTasks) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">در حال انجام</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.tasksByStatus.inprogress}</span>
                  <Badge variant="outline" className="text-xs">
                    {((analytics.tasksByStatus.inprogress / analytics.totalTasks) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">انجام شده</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.tasksByStatus.done}</span>
                  <Badge variant="outline" className="text-xs">
                    {((analytics.tasksByStatus.done / analytics.totalTasks) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>میانگین زمان تکمیل:</span>
                <span className="font-medium">{analytics.averageCompletionTime} روز</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              توزیع اولویت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    فوری
                  </span>
                  <span className="font-medium">{analytics.tasksByPriority.urgent}</span>
                </div>
                <Progress value={(analytics.tasksByPriority.urgent / analytics.totalTasks) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    بالا
                  </span>
                  <span className="font-medium">{analytics.tasksByPriority.high}</span>
                </div>
                <Progress value={(analytics.tasksByPriority.high / analytics.totalTasks) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    متوسط
                  </span>
                  <span className="font-medium">{analytics.tasksByPriority.medium}</span>
                </div>
                <Progress value={(analytics.tasksByPriority.medium / analytics.totalTasks) * 100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    کم
                  </span>
                  <span className="font-medium">{analytics.tasksByPriority.low}</span>
                </div>
                <Progress value={(analytics.tasksByPriority.low / analytics.totalTasks) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>
                      {' '}
                      {activity.action === 'completed' ? 'وظیفه را تکمیل کرد:' :
                       activity.action === 'created' ? 'وظیفه جدیدی ایجاد کرد:' :
                       activity.action === 'commented' ? 'کامنتی گذاشت روی:' :
                       'وظیفه را بروزرسانی کرد:'}
                      {' '}
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {activity.task_title}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              بهترین عملکردها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformers.map((performer, index) => (
                <div key={performer.user_id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{performer.user_name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" />
                        {performer.tasks_completed} وظیفه
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(performer.total_time)} ساعت
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round((performer.tasks_completed / analytics.totalTasks) * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  روند پیشرفت
                </p>
                <p className="text-2xl font-bold text-green-600">
                  +{((analytics.completedTasks / analytics.totalTasks) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  میانگین تیمی
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(analytics.totalTasks / 3)} وظیفه/نفر
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  زمان پاسخگویی
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.averageCompletionTime} روز
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
