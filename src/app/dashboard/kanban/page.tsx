export const dynamic = 'force-dynamic'
export const revalidate = 0

'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
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
  priority: string
  status: 'todo' | 'inprogress' | 'done'
}

const columns = {
  todo: 'در انتظار',
  inprogress: 'در حال انجام',
  done: 'انجام شده',
} as const

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

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
  }, [])

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*')
    setTasks((data as Task[]) || [])
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const taskId = Number(active.id)
    const newStatus = over.id as keyof typeof columns

    // فقط این خط رو با as any بستیم — فقط این یک جا کافیه!
    await supabase
      .from('tasks')
      .update({ status: newStatus } as any)
      .eq('id', taskId)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">کانبان وظایف</h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([key, title]) => (
            <div
              key={key}
              id={key}
              className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 min-h-96"
            >
              <h2 className="font-bold text-lg mb-4 text-center">{title}</h2>
              <div className="space-y-4">
                {tasks
                  .filter((t) => t.status === key)
                  .map((task) => (
                    <Card
                      key={task.id}
                      id={`${task.id}`}
                      className="cursor-grab active:cursor-grabbing shadow-md hover:shadow-lg transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                          {task.priority}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}