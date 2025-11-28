// src/app/dashboard/calendar/page.tsx - Calendar view for tasks by due date
'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Task {
  id: number
  title: string
  priority: string
  status: string
  due_date?: string
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('id, title, priority, status, due_date')
    setTasks((data as Task[]) || [])
  }

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const getTasksForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]
    return tasks.filter(t => t.due_date === dateStr)
  }

  const monthName = currentDate.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">تقویم وظایف</h1>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        {/* Header with Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ChevronRight size={24} />
          </button>

          <h2 className="text-2xl font-bold min-w-48 text-center">{monthName}</h2>

          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {/* Day Headers */}
          {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'].map(day => (
            <div key={day} className="text-center font-bold p-3 bg-gray-100 dark:bg-gray-800 rounded">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-3" />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const tasksForDay = getTasksForDate(day)
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear()

            return (
              <div
                key={day}
                className={`p-2 border rounded-lg min-h-24 overflow-hidden transition ${
                  isToday
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-bold mb-1">{day}</div>

                {tasksForDay.length > 0 && (
                  <div className="space-y-1">
                    {tasksForDay.slice(0, 3).map(task => (
                      <Card
                        key={task.id}
                        className="p-1 text-xs bg-gradient-to-r from-purple-400 to-pink-400 text-white cursor-pointer hover:shadow-md"
                      >
                        <p className="truncate">{task.title}</p>
                        <Badge
                          variant="secondary"
                          className="text-xs mt-1"
                          style={{
                            backgroundColor:
                              task.priority === 'urgent'
                                ? '#ef4444'
                                : task.priority === 'high'
                                  ? '#f97316'
                                  : '#eab308',
                          }}
                        >
                          {task.priority}
                        </Badge>
                      </Card>
                    ))}
                    {tasksForDay.length > 3 && (
                      <div className="text-xs text-gray-500">+{tasksForDay.length - 3} بیشتر</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
