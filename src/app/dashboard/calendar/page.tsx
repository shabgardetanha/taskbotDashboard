'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { LoadingSpinner, PageLoading } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/empty-state'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Filter, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Task {
  id: number
  title: string
  description?: string
  priority: string
  status: string
  due_date?: string
  due_time?: string
  labels?: Array<{
    id: string
    name: string
    color: string
  }>
  subtask_count?: number
  subtask_completed?: number
  workspace_id?: string
  created_at?: string
}

type ViewMode = 'month' | 'week'

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(label:task_labels(*))
        `)
        .not('due_date', 'is', null)
        .order('due_date')

      setTasks((data as Task[]) || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
      throw error
    }
  }

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const getTasksForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]
    return tasks.filter(t => t.due_date === dateStr)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      case 'inprogress': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'todo': return 'border-gray-300 bg-white dark:bg-gray-800'
      default: return 'border-gray-300 bg-white dark:bg-gray-800'
    }
  }

  const monthName = currentDate.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">در حال بارگذاری تقویم...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Mobile Header */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 md:w-8 md:h-8 text-blue-500" />
            تقویم وظایف
          </h1>

          {/* Mobile: Today button */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="md:hidden"
          >
            امروز
          </Button>
        </div>

        {/* Navigation Header - Mobile Optimized */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>

              <h2 className="text-lg md:text-2xl font-bold text-center min-w-0 flex-1 px-2">
                {monthName}
              </h2>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                امروز
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                فیلتر
              </Button>
            </div>
          </div>

          {/* Mobile: Quick stats */}
          <div className="md:hidden grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-lg font-bold text-blue-600">{tasks.length}</div>
              <div className="text-xs text-blue-600/70">کل وظایف</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="text-lg font-bold text-green-600">
                {tasks.filter(t => t.status === 'done').length}
              </div>
              <div className="text-xs text-green-600/70">انجام شده</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-lg font-bold text-red-600">
                {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length}
              </div>
              <div className="text-xs text-red-600/70">معوق</div>
            </div>
          </div>

          {/* Day Headers - Mobile Responsive */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day, index) => (
              <div key={day} className="text-center font-bold p-2 md:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 text-sm md:text-base">
                <span className="hidden md:inline">
                  {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'][index]}
                </span>
                <span className="md:hidden">{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 md:p-6">
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square p-1 md:p-2" />
          ))}

          {/* Days of Month - Mobile Touch Friendly */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const tasksForDay = getTasksForDate(day)
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear()
            const isPast = dateStr < new Date() && !isToday

            return (
              <div
                key={day}
                className={`aspect-square p-1 md:p-2 border rounded-xl transition-all duration-200 min-h-[60px] md:min-h-[120px] ${
                  isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 ring-2 ring-blue-300 shadow-lg'
                    : isPast
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 active:scale-95'
                }`}
              >
                <div className={`font-bold mb-1 text-xs md:text-sm text-center ${
                  isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {day}
                </div>

                {/* Tasks - Mobile Optimized */}
                {tasksForDay.length > 0 && (
                  <div className="space-y-0.5 md:space-y-1 overflow-hidden">
                    {tasksForDay.slice(0, window.innerWidth < 768 ? 2 : 4).map(task => (
                      <div
                        key={task.id}
                        className={`p-1 md:p-2 text-xs rounded border-l-2 md:border-l-4 cursor-pointer hover:shadow-sm transition-all duration-200 ${
                          getStatusColor(task.status)
                        } active:scale-95`}
                        style={{
                          borderLeftColor: task.priority === 'urgent' ? '#ef4444' :
                                         task.priority === 'high' ? '#f97316' :
                                         task.priority === 'medium' ? '#eab308' : '#22c55e'
                        }}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-medium truncate flex-1 text-gray-900 dark:text-gray-100 text-xs md:text-sm leading-tight">
                            {task.title}
                          </p>
                          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ml-1 mt-0.5 ${getPriorityColor(task.priority)}`} />
                        </div>

                        {/* Mobile: Simplified info */}
                        <div className="md:hidden">
                          {task.due_time && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {task.due_time.slice(0, 5)}
                            </div>
                          )}
                        </div>

                        {/* Desktop: Full info */}
                        <div className="hidden md:block">
                          {task.due_time && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                              <Clock className="w-3 h-3" />
                              {task.due_time.slice(0, 5)}
                            </div>
                          )}

                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {task.labels.slice(0, 1).map((label) => (
                                <Badge
                                  key={label.id}
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                  style={{ borderColor: label.color, color: label.color }}
                                >
                                  {label.name}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {task.subtask_count && task.subtask_count > 0 && (
                            <div className="text-xs text-gray-500">
                              {task.subtask_completed || 0}/{task.subtask_count}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Show more indicator */}
                    {tasksForDay.length > (window.innerWidth < 768 ? 2 : 4) && (
                      <div className="text-xs text-gray-500 text-center py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        +{tasksForDay.length - (window.innerWidth < 768 ? 2 : 4)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend - Mobile Optimized */}
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <h3 className="font-semibold mb-2 md:mb-3 text-sm">اولویت‌ها:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>فوری</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>زیاد</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>متوسط</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>کم</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Actions */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-around">
          <Button variant="outline" size="sm" onClick={() => setViewMode('month')}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            ماهانه
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode('week')}>
            <Filter className="w-4 h-4 mr-2" />
            هفتگی
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            فیلتر
          </Button>
        </div>
      </div>

      {/* Add bottom padding for mobile */}
      <div className="h-20 md:hidden" />

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
