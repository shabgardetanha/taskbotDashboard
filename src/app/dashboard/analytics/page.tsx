'use client'

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { supabase } from '@/lib/supabase'
import { BarChart3, Calendar, CheckCircle, Clock, TrendingUp, Users, AlertTriangle, Target } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AnalyticsData {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  inProgressTasks: number
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
  completionRate: number
  averageCompletionTime: number
  tasksCreatedToday: number
  tasksDueToday: number
  tasksDueThisWeek: number
  workspaceStats: Array<{
    name: string
    taskCount: number
    memberCount: number
    completionRate: number
  }>
  recentActivity: Array<{
    id: string
    action: string
    task_title: string
    created_at: string
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // Get all tasks for analysis
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*')

      if (!allTasks) {
        setAnalytics(null)
        return
      }

      const totalTasks = allTasks.length
      const completedTasks = allTasks.filter(t => t.status === 'done').length
      const overdueTasks = allTasks.filter(t =>
        t.due_date &&
        new Date(t.due_date) < new Date() &&
        t.status !== 'done'
      ).length
      const inProgressTasks = allTasks.filter(t => t.status === 'inprogress').length

      const tasksByPriority = {
        urgent: allTasks.filter(t => t.priority === 'urgent').length,
        high: allTasks.filter(t => t.priority === 'high').length,
        medium: allTasks.filter(t => t.priority === 'medium').length,
        low: allTasks.filter(t => t.priority === 'low').length,
      }

      const tasksByStatus = {
        todo: allTasks.filter(t => t.status === 'todo').length,
        inprogress: allTasks.filter(t => t.status === 'inprogress').length,
        done: allTasks.filter(t => t.status === 'done').length,
      }

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // Calculate average completion time (simplified)
      const completedTasksWithDates = allTasks.filter(t =>
        t.status === 'done' && t.created_at && t.updated_at
      )
      const averageCompletionTime = completedTasksWithDates.length > 0
        ? completedTasksWithDates.reduce((acc, task) => {
            const created = new Date(task.created_at).getTime()
            const updated = new Date(task.updated_at).getTime()
            return acc + (updated - created)
          }, 0) / completedTasksWithDates.length / (1000 * 60 * 60) // Convert to hours
        : 0

      // Today's stats
      const today = new Date().toISOString().split('T')[0] || ''
      const tasksCreatedToday = allTasks.filter(t =>
        t.created_at && t.created_at.startsWith(today)
      ).length
      const tasksDueToday = allTasks.filter(t =>
        t.due_date === today
      ).length

      // This week's stats
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || ''
      const tasksDueThisWeek = allTasks.filter(t =>
        t.due_date && t.due_date >= today && t.due_date <= weekFromNow
      ).length

      // Workspace stats (simplified - would need user context)
      const workspaceStats = [
        {
          name: 'فضای کاری اصلی',
          taskCount: totalTasks,
          memberCount: 1, // Simplified
          completionRate: completionRate
        }
      ]

      // Recent activity (simplified)
      const { data: recentLogs } = await supabase
        .from('activity_logs')
        .select(`
          id,
          action,
          task_title,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      const recentActivity = (recentLogs || []).map(log => ({
        id: log.id,
        action: log.action,
        task_title: log.task_title || 'وظیفه',
        created_at: log.created_at
      }))

      setAnalytics({
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        tasksByPriority,
        tasksByStatus,
        completionRate,
        averageCompletionTime: Math.round(averageCompletionTime),
        tasksCreatedToday,
        tasksDueToday,
        tasksDueThisWeek,
        workspaceStats,
        recentActivity
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">در حال بارگذاری تحلیل‌ها...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-gray-500">
          داده‌ای برای نمایش تحلیل‌ها وجود ندارد.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          تحلیل‌ها و گزارش‌ها
        </h1>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          بروزرسانی
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل وظایف</p>
                <p className="text-3xl font-bold">{analytics.totalTasks}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">انجام شده</p>
                <p className="text-3xl font-bold text-green-600">{analytics.completedTasks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">معوق</p>
                <p className="text-3xl font-bold text-red-600">{analytics.overdueTasks}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">امروز</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.tasksDueToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              نرخ تکمیل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">پیشرفت کلی</span>
                <span className="text-sm font-bold">{analytics.completionRate}%</span>
              </div>
              <Progress value={analytics.completionRate} className="w-full" />

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analytics.tasksByStatus.todo}</div>
                  <div className="text-sm text-gray-600">در انتظار</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{analytics.tasksByStatus.inprogress}</div>
                  <div className="text-sm text-gray-600">در حال انجام</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.tasksByStatus.done}</div>
                  <div className="text-sm text-gray-600">انجام شده</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزیع اولویت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'فوری', value: analytics.tasksByPriority.urgent, color: 'bg-red-500', count: analytics.tasksByPriority.urgent },
                { label: 'زیاد', value: analytics.tasksByPriority.high, color: 'bg-orange-500', count: analytics.tasksByPriority.high },
                { label: 'متوسط', value: analytics.tasksByPriority.medium, color: 'bg-yellow-500', count: analytics.tasksByPriority.medium },
                { label: 'کم', value: analytics.tasksByPriority.low, color: 'bg-green-500', count: analytics.tasksByPriority.low },
              ].map((priority) => (
                <div key={priority.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                    <span className="text-sm font-medium">{priority.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{priority.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${priority.color}`}
                        style={{ width: `${analytics.totalTasks > 0 ? (priority.count / analytics.totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{activity.task_title}</p>
                      <p className="text-xs text-gray-500">
                        {activity.action === 'created' ? 'ایجاد شد' :
                         activity.action === 'updated' ? 'بروزرسانی شد' : 'حذف شد'}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                فعالیتی ثبت نشده
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>آمار سریع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {analytics.averageCompletionTime}
                </div>
                <div className="text-sm text-gray-600">میانگین زمان تکمیل (ساعت)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {analytics.tasksCreatedToday}
                </div>
                <div className="text-sm text-gray-600">وظایف ایجاد شده امروز</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {analytics.tasksDueThisWeek}
                </div>
                <div className="text-sm text-gray-600">سررسید این هفته</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {analytics.inProgressTasks}
                </div>
                <div className="text-sm text-gray-600">در حال انجام</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workspace Stats (if multiple workspaces) */}
      {analytics.workspaceStats.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              آمار فضاهای کاری
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.workspaceStats.map((workspace, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{workspace.name}</h3>
                    <p className="text-sm text-gray-600">{workspace.memberCount} عضو</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{workspace.taskCount}</div>
                    <div className="text-sm text-gray-600">وظیفه</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{workspace.completionRate}%</div>
                    <div className="text-sm text-gray-600">تکمیل</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Dashboard Component */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">داشبورد تجزیه و تحلیل</h2>
        <AnalyticsDashboard />
      </div>
    </div>
  )
}
