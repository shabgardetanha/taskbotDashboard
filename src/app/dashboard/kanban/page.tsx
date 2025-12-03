'use client'

export const dynamic = 'force-dynamic'
// فقط این یک خط کافیه — revalidate رو حذف کردیم

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { supabase } from '@/lib/supabase'
import { Calendar, CheckSquare, Clock } from 'lucide-react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useEffect, useState } from 'react'

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

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
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(
            label:task_labels(*)
          )
        `)
      setTasks((data as Task[]) || [])
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return

    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(
            label:task_labels(*)
          )
        `)
      setTasks((data as Task[]) || [])
    }

    fetchTasks()

    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = Number(active.id)
    const newStatus = over.id as keyof typeof columns

    await supabase.from('tasks').update({ status: newStatus } as any).eq('id', taskId)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              کانبان وظایف
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              وظایف خود را با drag & drop مدیریت کنید
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {tasks.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                کل وظایف
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckSquare className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(columns).map(([key, title]) => {
            const count = tasks.filter(t => t.status === key).length
            const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0

            return (
              <div key={key} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
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
              </div>
            )
          })}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(columns).map(([key, title]) => {
            const columnTasks = tasks.filter((t) => t.status === key)
            const columnColor = key === 'todo' ? 'blue' : key === 'inprogress' ? 'yellow' : 'green'

            return (
              <div
                key={key}
                id={key}
                className={`bg-gradient-to-br from-${columnColor}-50 to-${columnColor}-100 dark:from-${columnColor}-900/20 dark:to-${columnColor}-800/20 backdrop-blur-sm rounded-3xl p-6 min-h-96 shadow-xl border border-${columnColor}-200/50 dark:border-${columnColor}-700/50`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${columnColor}-500 rounded-xl flex items-center justify-center shadow-lg`}>
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-gray-900 dark:text-white">{title}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{columnTasks.length} وظیفه</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 bg-${columnColor}-100 dark:bg-${columnColor}-900/30 text-${columnColor}-700 dark:text-${columnColor}-300 rounded-full text-sm font-medium`}>
                    {columnTasks.length}
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`w-16 h-16 bg-${columnColor}-100 dark:bg-${columnColor}-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <CheckSquare className={`w-8 h-8 text-${columnColor}-400`} />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        هیچ وظیفه‌ای در این ستون وجود ندارد
                      </p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        id={`${task.id}`}
                        className="cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-transparent hover:border-current/20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                        onClick={() => handleTaskClick(task)}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                            {task.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Labels */}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {task.labels.slice(0, 2).map((labelData) => (
                                <Badge
                                  key={labelData.id}
                                  className="text-xs px-2 py-1 font-medium"
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
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  +{task.labels.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Due Date */}
                          {task.due_date && (
                            <div className={`flex items-center gap-2 text-sm ${getDueDateStatus(task.due_date)?.color || 'text-gray-600'}`}>
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">{formatDueDate(task.due_date, task.due_time)}</span>
                            </div>
                          )}

                          {/* Subtasks Progress */}
                          {(task.subtask_count || 0) > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <CheckSquare className="w-4 h-4" />
                                  <span>زیروظایف</span>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {task.subtask_completed || 0}/{task.subtask_count}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${task.subtask_count ? ((task.subtask_completed || 0) / task.subtask_count) * 100 : 0}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Priority Badge */}
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'warning' : 'secondary'}
                              className="text-xs px-3 py-1 font-medium"
                            >
                              {task.priority === 'low' ? 'کم' :
                               task.priority === 'medium' ? 'متوسط' :
                               task.priority === 'high' ? 'زیاد' : 'فوری'}
                            </Badge>

                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DndContext>

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
