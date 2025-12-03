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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">کانبان وظایف</h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([key, title]) => (
            <div key={key} id={key} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 min-h-96">
              <h2 className="font-bold text-lg mb-4 text-center">{title}</h2>
              <div className="space-y-4">
                {tasks
                  .filter((t) => t.status === key)
                  .map((task) => (
                    <Card
                      key={task.id}
                      id={`${task.id}`}
                      className="cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.labels.slice(0, 3).map((labelData) => (
                              <Badge
                                key={labelData.id}
                                variant="outline"
                                className="text-xs px-2 py-0"
                                style={{
                                  borderColor: labelData.color,
                                  color: labelData.color
                                }}
                              >
                                {labelData.name}
                              </Badge>
                            ))}
                            {task.labels.length > 3 && (
                              <Badge variant="outline" className="text-xs px-2 py-0">
                                +{task.labels.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                          <div className={`flex items-center gap-1 text-xs ${getDueDateStatus(task.due_date)?.color || 'text-gray-600'}`}>
                            <Calendar className="w-3 h-3" />
                            <span>{formatDueDate(task.due_date, task.due_time)}</span>
                          </div>
                        )}

                        {/* Subtasks */}
                        {(task.subtask_count || 0) > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <CheckSquare className="w-3 h-3" />
                            <span>{task.subtask_completed || 0}/{task.subtask_count} زیروظیفه</span>
                          </div>
                        )}

                        {/* Priority Badge */}
                        <Badge
                          variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority === 'low' ? 'کم' :
                           task.priority === 'medium' ? 'متوسط' :
                           task.priority === 'high' ? 'زیاد' : 'فوری'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
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
