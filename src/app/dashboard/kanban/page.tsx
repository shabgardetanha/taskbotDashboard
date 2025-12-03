'use client'

export const dynamic = 'force-dynamic'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { KanbanColumnSkeleton, PageLoading, LoadingSpinner } from '@/components/ui/loading'
import { TaskEmptyState, ErrorState } from '@/components/ui/empty-state'
import { WorkspaceSelector } from '@/components/WorkspaceSelector'
import { supabase } from '@/lib/supabase'
import { Calendar, CheckSquare, Clock, Plus, RefreshCw, Users, Filter, ArrowUpDown, Grid3X3 } from 'lucide-react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useEffect, useState, useCallback } from 'react'

type Task = {
  id: number
  title: string
  description?: string
  priority: string
  status: 'todo' | 'inprogress' | 'done'
  due_date?: string
  due_time?: string
  labels?: Array<{
    id: string
    name: string
    color: string
  }>
  subtask_count?: number
  subtask_completed?: number
  position?: number
}

const columns = {
  todo: 'در انتظار',
  inprogress: 'در حال انجام',
  done: 'انجام شده',
} as const

// Helper function to get due date status
const getDueDateStatus = (dueDate?: string) => {
  if (!dueDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { status: 'overdue', text: 'گذشته', color: 'text-red-600' }
  if (diffDays === 0) return { status: 'today', text: 'امروز', color: 'text-yellow-600' }
  if (diffDays === 1) return { status: 'tomorrow', text: 'فردا', color: 'text-blue-600' }
  if (diffDays <= 7) return { status: 'this-week', text: `${diffDays} روز`, color: 'text-green-600' }
  return { status: 'future', text: due.toLocaleDateString('fa-IR'), color: 'text-gray-600' }
}

// Helper function to format due date display
const formatDueDate = (dueDate?: string, dueTime?: string) => {
  if (!dueDate) return null
  const date = new Date(dueDate).toLocaleDateString('fa-IR')
  if (dueTime) {
    const time = dueTime.slice(0, 5) // HH:MM format
    return `${date} ${time}`
  }
  return date
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const fetchTasks = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(
            label:task_labels(*)
          )
        `)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTasks((data as Task[]) || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری وظایف')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleUpdateTask = async (taskId: number, updates: any) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error

      // Refresh tasks data
      await fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
      setError('خطا در بروزرسانی وظیفه')
      throw error
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTasks()
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTasks])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = Number(active.id)
    const newStatus = over.id as keyof typeof columns

    try {
      // Update task status and position
      const { data: updatedTask } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          position: Date.now() // Use timestamp as position for simple ordering
        } as any)
        .eq('id', taskId)
        .select()
        .single()

      // Refresh tasks data
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(
            label:task_labels(*)
          )
        `)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      setTasks((data as Task[]) || [])
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              کانبان وظایف
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
              وظایف خود را با drag & drop مدیریت کنید
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Workspace Selector */}
            <WorkspaceSelector compact />

            {/* Task Count */}
            <div className="text-center px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {tasks.length}
              </div>
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                کل وظایف
              </div>
            </div>

            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">بروزرسانی</span>
            </button>

            <div className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">تیم شما</span>
              <Badge variant="secondary" className="text-xs ml-2">۱ عضو</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm">ترتیب</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
              <Filter className="w-4 h-4" />
              <span className="text-sm">فیلتر</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200">
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm">نمای</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {Object.entries(columns).map(([key, title]) => {
            const count = tasks.filter(t => t.status === key).length
            const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
            const overdueTasks = tasks.filter(t =>
              t.status === key &&
              t.due_date &&
              new Date(t.due_date) < new Date() &&
              t.status !== 'done'
            ).length

            return (
              <div key={key} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 md:p-5 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg ${
                      key === 'todo' ? 'bg-blue-500' :
                      key === 'inprogress' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}>
                      <CheckSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{title}</div>
                      <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{count} وظیفه</div>
                    </div>
                  </div>
                  {overdueTasks > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {overdueTasks} معوق
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        key === 'todo' ? 'bg-blue-500' :
                        key === 'inprogress' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {percentage}% از کل وظایف
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !isRefreshing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KanbanColumnSkeleton title="در انتظار" />
          <KanbanColumnSkeleton title="در حال انجام" />
          <KanbanColumnSkeleton title="انجام شده" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState
          title="خطا در بارگذاری وظایف"
          description={error}
          onRetry={handleRefresh}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && tasks.length === 0 && (
        <TaskEmptyState
          variant="all-tasks"
          onCreateTask={() => {
            // TODO: Implement task creation modal
            console.log('Create task clicked')
          }}
        />
      )}

      {/* Kanban Board */}
      {!isLoading && !error && tasks.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(columns).map(([key, title]) => {
              const columnTasks = tasks.filter((t) => t.status === key).sort((a, b) => {
                // Sort by position first, then by priority, then by due date
                if (a.position !== b.position) {
                  return (a.position || 0) - (b.position || 0)
                }
                const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
                const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
                const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1
                if (aPriority !== bPriority) {
                  return bPriority - aPriority // Higher priority first
                }
                // Sort by due date (urgent tasks first)
                if (a.due_date && b.due_date) {
                  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                }
                return 0
              })

              const columnColor = key === 'todo' ? 'blue' : key === 'inprogress' ? 'yellow' : 'green'
              const columnBgClass = key === 'todo'
                ? 'bg-gradient-to-br from-blue-50 via-blue-25 to-blue-50 dark:from-blue-900/10 dark:via-blue-800/5 dark:to-blue-900/10'
                : key === 'inprogress'
                ? 'bg-gradient-to-br from-yellow-50 via-yellow-25 to-yellow-50 dark:from-yellow-900/10 dark:via-yellow-800/5 dark:to-yellow-900/10'
                : 'bg-gradient-to-br from-green-50 via-green-25 to-green-50 dark:from-green-900/10 dark:via-green-800/5 dark:to-green-900/10'

              const columnBorderClass = key === 'todo'
                ? 'border-blue-200/60 dark:border-blue-700/30'
                : key === 'inprogress'
                ? 'border-yellow-200/60 dark:border-yellow-700/30'
                : 'border-green-200/60 dark:border-green-700/30'

              return (
                <div
                  key={key}
                  className={`${columnBgClass} backdrop-blur-sm rounded-2xl md:rounded-3xl border ${columnBorderClass} shadow-lg min-h-[500px] md:min-h-[600px] flex flex-col`}
                >
                  {/* Column Header */}
                  <div className="p-4 md:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-md ${
                          key === 'todo' ? 'bg-blue-500' :
                          key === 'inprogress' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}>
                          <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white">{title}</h3>
                          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            {columnTasks.length} وظیفه
                            {columnTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length > 0 &&
                              ` • ${columnTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length} معوق`
                            }
                          </p>
                        </div>
                      </div>

                      <div className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${
                        key === 'todo' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        key === 'inprogress' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {columnTasks.length}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Container */}
                  <div className="flex-1 p-4 md:p-6 pt-4">
                    <div className="space-y-3 md:space-y-4 max-h-full overflow-y-auto custom-scrollbar">
                      {columnTasks.length === 0 ? (
                        <div className="text-center py-8 md:py-12">
                          <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center ${
                            key === 'todo' ? 'bg-blue-100 dark:bg-blue-900/20' :
                            key === 'inprogress' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                            'bg-green-100 dark:bg-green-900/20'
                          }`}>
                            <CheckSquare className={`w-6 h-6 md:w-8 md:h-8 ${
                              key === 'todo' ? 'text-blue-400' :
                              key === 'inprogress' ? 'text-yellow-400' :
                              'text-green-400'
                            }`} />
                          </div>
                          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
                            هیچ وظیفه‌ای در این ستون وجود ندارد
                          </p>
                          <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-1">
                            وظایف را اینجا بکشید یا جدید ایجاد کنید
                          </p>
                        </div>
                      ) : (
                        columnTasks.map((task, index) => {
                          const dueDateStatus = getDueDateStatus(task.due_date)
                          const isOverdue = dueDateStatus?.status === 'overdue'

                          return (
                            <Card
                              key={task.id}
                              id={`${task.id}`}
                              className={`group cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-lg border-2 ${
                                isOverdue
                                  ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                                  : 'border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 hover:border-gray-300/70 dark:hover:border-gray-600/70'
                              } backdrop-blur-sm`}
                              onClick={() => handleTaskClick(task)}
                            >
                              <CardContent className="p-3 md:p-4">
                                {/* Task Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white leading-tight flex-1 pr-2">
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  </div>
                                </div>

                                {/* Task Metadata */}
                                <div className="space-y-2">
                                  {/* Labels */}
                                  {task.labels && task.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {task.labels.slice(0, 2).map((labelData) => (
                                        <Badge
                                          key={labelData.id}
                                          className="text-xs px-1.5 py-0.5 font-medium"
                                          style={{
                                            backgroundColor: `${labelData.color}20`,
                                            borderColor: labelData.color,
                                            color: labelData.color
                                          }}
                                        >
                                          {labelData.name}
                                        </Badge>
                                      ))}
                                      {task.labels.length > 2 && (
                                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                          +{task.labels.length - 2}
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  {/* Due Date & Priority Row */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {task.due_date && (
                                        <div className={`flex items-center gap-1 text-xs ${dueDateStatus?.color || 'text-gray-500'}`}>
                                          <Calendar className="w-3 h-3" />
                                          <span className="font-medium">{formatDueDate(task.due_date, task.due_time)}</span>
                                        </div>
                                      )}
                                    </div>

                                    <Badge
                                      variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'default' : 'secondary'}
                                      className="text-xs px-2 py-0.5 font-medium"
                                    >
                                      {task.priority === 'low' ? 'کم' :
                                       task.priority === 'medium' ? 'متوسط' :
                                       task.priority === 'high' ? 'زیاد' : 'فوری'}
                                    </Badge>
                                  </div>

                                  {/* Progress Bar for Subtasks */}
                                  {(task.subtask_count || 0) > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                        <span>زیروظایف</span>
                                        <span>{task.subtask_completed || 0}/{task.subtask_count}</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                          className="bg-gradient-to-r from-green-400 to-green-600 h-1.5 rounded-full transition-all duration-300"
                                          style={{
                                            width: `${task.subtask_count ? ((task.subtask_completed || 0) / task.subtask_count) * 100 : 0}%`
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Overdue Indicator */}
                                  {isOverdue && (
                                    <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mt-1">
                                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                      <span>مهلت گذشته</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </DndContext>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdateTask}
      />
    </div>
  )
}
