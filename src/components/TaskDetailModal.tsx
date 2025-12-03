'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Calendar, CheckSquare, Clock, Plus, X, Edit, Save, Trash2, User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Task {
  id: number
  title: string
  description?: string
  priority: string
  status: string
  due_date?: string
  due_time?: string
  assignee?: { id: string; full_name: string }
  subtasks?: Array<{ id: string; title: string; completed: boolean; order_index: number }>
  labels?: Array<{
    id: string
    name: string
    color: string
  }>
  workspace_id?: string
  created_at?: string
  updated_at?: string
}

interface ActivityLog {
  id: string
  action: string
  user_id: string
  created_at: string
  changes?: any
}

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (taskId: number, updates: any) => Promise<void>
}

export function TaskDetailModal({ task, isOpen, onClose, onUpdate }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Task | null>(null)
  const [availableLabels, setAvailableLabels] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task })
      loadAvailableLabels()
      loadActivityLogs()
    }
  }, [task])

  const loadAvailableLabels = async () => {
    if (!task?.workspace_id) return

    const { data } = await supabase
      .from('task_labels')
      .select('id, name, color')
      .eq('workspace_id', task.workspace_id)

    setAvailableLabels(data || [])
  }

  const loadActivityLogs = async () => {
    if (!task?.workspace_id) return

    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setActivityLogs(data || [])
  }

  const handleSave = async () => {
    if (!editedTask) return

    setIsLoading(true)
    try {
      await onUpdate(task!.id, {
        title: editedTask.title,
        description: editedTask.description,
        due_date: editedTask.due_date,
        due_time: editedTask.due_time,
        priority: editedTask.priority
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    await supabase
      .from('subtasks')
      .update({ completed: !completed })
      .eq('id', subtaskId)

    // Reload task data
    if (task) {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks(*),
          labels:task_label_links(label:task_labels(*))
        `)
        .eq('id', task.id)
        .single()

      if (data) {
        setEditedTask(data)
      }
    }
  }

  const addSubtask = async () => {
    if (!newSubtask.trim() || !task) return

    await supabase
      .from('subtasks')
      .insert({
        task_id: task.id,
        title: newSubtask.trim(),
        completed: false,
        order_index: (task.subtasks?.length || 0)
      })

    setNewSubtask('')
    // Reload data
    if (task) {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks(*),
          labels:task_label_links(label:task_labels(*))
        `)
        .eq('id', task.id)
        .single()

      if (data) {
        setEditedTask(data)
      }
    }
  }

  const progressPercent = editedTask?.subtasks
    ? Math.round(
        (editedTask.subtasks.filter(st => st.completed).length / editedTask.subtasks.length) * 100
      )
    : 0

  if (!isOpen || !task || !editedTask) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-800">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold">وظیفه #{task.id}</h2>
              <p className="text-sm text-gray-500">ایجاد شده در {new Date(task.created_at || '').toLocaleDateString('fa-IR')}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">عنوان</label>
            {isEditing ? (
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="w-full text-lg font-semibold"
              />
            ) : (
              <h3 className="text-xl font-bold">{task.title}</h3>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">توضیحات</label>
            {isEditing ? (
              <textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none"
                rows={4}
                placeholder="توضیحات وظیفه را وارد کنید..."
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {task.description || 'توضیحاتی برای این وظیفه ثبت نشده است.'}
                </p>
              </div>
            )}
          </div>

          {/* Priority, Status & Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">اولویت</label>
              <Badge
                variant={editedTask.priority === 'urgent' ? 'destructive' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {editedTask.priority === 'low' ? 'کم' :
                 editedTask.priority === 'medium' ? 'متوسط' :
                 editedTask.priority === 'high' ? 'زیاد' : 'فوری'}
              </Badge>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">وضعیت</label>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {editedTask.status === 'todo' ? 'در انتظار' :
                 editedTask.status === 'inprogress' ? 'در حال انجام' : 'انجام شده'}
              </Badge>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">مسئول</label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {task.assignee?.full_name || 'تعیین نشده'}
                </span>
              </div>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                تاریخ مهلت
              </label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedTask.due_date || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className="w-full"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {editedTask.due_date
                      ? new Date(editedTask.due_date).toLocaleDateString('fa-IR')
                      : 'تعیین نشده'
                    }
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                ساعت مهلت
              </label>
              {isEditing ? (
                <Input
                  type="time"
                  value={editedTask.due_time || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, due_time: e.target.value })}
                  className="w-full"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {editedTask.due_time || 'تعیین نشده'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              برچسب‌ها
            </label>
            <div className="flex flex-wrap gap-2">
              {editedTask.labels?.map((label) => (
                <Badge
                  key={label.id}
                  style={{ backgroundColor: label.color }}
                  className="text-white text-xs px-2 py-1"
                >
                  {label.name}
                </Badge>
              )) || (
                <span className="text-sm text-gray-500">برچسبی تنظیم نشده</span>
              )}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                زیروظایف ({editedTask.subtasks?.filter(st => st.completed).length || 0}/{editedTask.subtasks?.length || 0})
              </label>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    placeholder="زیروظیفه جدید..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="w-48 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                  />
                  <Button size="sm" onClick={addSubtask} disabled={!newSubtask.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {editedTask.subtasks?.sort((a, b) => a.order_index - b.order_index).map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(subtask.id, subtask.completed)}
                    className="w-4 h-4"
                  />
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-400' : ''}`}>
                    {subtask.title}
                  </span>
                  {isEditing && (
                    <button className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )) || (
                <p className="text-sm text-gray-500 italic">زیروظیفه‌ای وجود ندارد</p>
              )}
            </div>
          </div>

          {/* Activity Log */}
          {activityLogs.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
                تاریخچه فعالیت
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <span className="font-medium">{log.action}</span> - {new Date(log.created_at).toLocaleString('fa-IR')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isLoading} className="flex-1 bg-blue-500 hover:bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                لغو
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                ویرایش
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                بستن
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
