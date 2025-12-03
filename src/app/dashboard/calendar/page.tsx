'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Filter } from 'lucide-react'
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-500" />
          تقویم وظایف
        </h1>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            ماهانه
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            هفتگی
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight size={24} />
            </button>

            <h2 className="text-2xl font-bold min-w-48 text-center">{monthName}</h2>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              امروز
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              فیلتر
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'].map(day => (
            <div key={day} className="text-center font-bold p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-32" />
          ))}

          {/* Days of Month */}
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
                className={`p-2 border rounded-lg min-h-32 transition-all duration-200 ${
                  isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 ring-2 ring-blue-300'
                    : isPast
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`font-bold mb-2 text-sm ${isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {day}
                </div>

                {tasksForDay.length > 0 && (
                  <div className="space-y-1">
                    {tasksForDay.slice(0, 4).map(task => (
                      <Card
                        key={task.id}
                        className={`p-2 text-xs cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 ${getStatusColor(task.status)}`}
                        style={{ borderLeftColor: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : '#eab308' }}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium truncate flex-1 text-gray-900 dark:text-gray-100">
                            {task.title}
                          </p>
                          <div className={`w-2 h-2 rounded-full ml-1 ${getPriorityColor(task.priority)}`} />
                        </div>

                        {task.due_time && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <Clock className="w-3 h-3" />
                            {task.due_time.slice(0, 5)}
                          </div>
                        )}

                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {task.labels.slice(0, 2).map((label) => (
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
                            {task.subtask_completed || 0}/{task.subtask_count} زیروظیفه
                          </div>
                        )}
                      </Card>
                    ))}
                    {tasksForDay.length > 4 && (
                      <div className="text-xs text-gray-500 text-center py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        +{tasksForDay.length - 4} وظیفه دیگر
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-3 text-sm">راهنما:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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
