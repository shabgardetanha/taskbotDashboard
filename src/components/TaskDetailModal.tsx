'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { TaskComments } from '@/components/TaskComments'
import { TaskAttachments } from '@/components/TaskAttachments'
import { Calendar, CheckSquare, Clock, Plus, X, Edit, Save, Timer, MessageCircle, Trash2 } from 'lucide-react'
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
  is_recurring?: boolean
  recurrence_rule?: string
  recurrence_next_date?: string
  original_task_id?: number
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
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [totalTime, setTotalTime] = useState(0)
  const [totalHours, setTotalHours] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [timeSpent, setTimeSpent] = useState('')
  const [timeNotes, setTimeNotes] = useState('')

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

  const loadTimeLogs = async () => {
    if (!task?.id) return

    try {
      const response = await fetch(`/api/tasks/${task.id}/time`)
      const data = await response.json()

      setTimeLogs(data.timeLogs || [])
      setTotalTime(data.totalTime || 0)
      setTotalHours(data.totalHours || 0)
      setTotalMinutes(data.totalMinutes || 0)
    } catch (error) {
      console.error('Error loading time logs:', error)
    }
  }

  const addTimeLog = async () => {
    if (!timeSpent || !task?.id) return

    try {
      const response = await fetch(`/api/tasks/${task.id}/time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_spent: parseInt(timeSpent),
          unit: 'minutes',
          notes: timeNotes,
          user_id: '00000000-0000-0000-0000-000000000000' // Default user for now
        })
      })

      if (response.ok) {
        setTimeSpent('')
        setTimeNotes('')
        loadTimeLogs() // Reload time logs
      }
    } catch (error) {
      console.error('Error adding time log:', error)
    }
  }

  useEffect(() => {
    if (task) {
      loadTimeLogs()
    }
  }, [task])

  const progressPercent = editedTask?.subtasks
    ? Math.round(
        (editedTask.subtasks.filter(st => st.completed).length / editedTask.subtasks.length) * 100
      )
    : 0

  if (!isOpen || !task || !editedTask) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">وظیفه #{task.id}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                ایجاد شده در {new Date(task.created_at || '').toLocaleDateString('fa-IR')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-100 dark:hover:bg-red-900/20 p-3 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <X size={24} className="text-gray-500 hover:text-red-500" />
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
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">نوع</label>
              <div className="flex items-center gap-2">
                {editedTask.is_recurring ? (
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    🔄 تکراری ({editedTask.recurrence_rule})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    یکباره
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Recurring Task Info */}
          {editedTask.is_recurring && (
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">وظیفه تکراری</span>
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                <p>قانون تکرار: <strong>{editedTask.recurrence_rule}</strong></p>
                {editedTask.recurrence_next_date && (
                  <p>تاریخ بعدی: <strong>{new Date(editedTask.recurrence_next_date).toLocaleDateString('fa-IR')}</strong></p>
                )}
                {editedTask.original_task_id && (
                  <p>این نمونه از وظیفه اصلی #{editedTask.original_task_id} است</p>
                )}
              </div>
            </div>
          )}

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

          {/* Time Tracking */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                ردیابی زمان ({totalHours}:{totalMinutes.toString().padStart(2, '0')})
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="زمان (دقیقه)"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  className="w-24 text-sm"
                  type="number"
                />
                <Input
                  placeholder="توضیحات"
                  value={timeNotes}
                  onChange={(e) => setTimeNotes(e.target.value)}
                  className="w-32 text-sm"
                />
                <Button size="sm" onClick={() => addTimeLog()}>
                  <Timer className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {timeLogs.length > 0 ? (
                timeLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Timer className="w-3 h-3 text-gray-400" />
                      <span>{log.time_spent} دقیقه</span>
                      {log.notes && <span className="text-gray-500">- {log.notes}</span>}
                    </div>
                    <span className="text-gray-400">
                      {new Date(log.logged_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">هیچ زمان‌بندی ثبت نشده</p>
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

          {/* Comments Section */}
          <div>
            <TaskComments taskId={task.id} />
          </div>

          {/* Attachments Section */}
          <div>
            <TaskAttachments taskId={task.id} />
          </div>
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
