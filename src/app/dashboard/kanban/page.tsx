'use client'

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@hello-pangea/dnd'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

type Task = {
  id: number
  title: string
  priority: string
  status: 'todo' | 'inprogress' | 'done'
}

const columns: Record<string, string> = {
  todo: 'در انتظار',
  inprogress: 'در حال انجام',
  done: 'انجام شده',
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-changes')
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
    setTasks(data || [])
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = Number(active.id)
    const newStatus = over.id as Task['status']

    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">کانبان وظایف</h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([key, title]) => (
            <div key={key} id={key} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <h2 className="font-bold text-lg mb-4">{title}</h2>
              <div className="space-y-3">
                {tasks
                  .filter(t => t.status === key)
                  .map(task => (
                    <Card key={task.id} className="cursor-move">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{task.title}</CardTitle>
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