// src/components/TaskDetailModal.tsx - Detailed task view/edit modal
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import { useState } from 'react'

interface Task {
  id: number
  title: string
  description?: string
  priority: string
  status: string
  due_date?: string
  due_time?: string
  assignee?: { id: string; full_name: string }
  subtasks?: Array<{ id: string; title: string; completed: boolean }>
  labels?: Array<{ label: { id: string; name: string; color: string } }>
}

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (taskId: number, updates: any) => Promise<void>
}

export function TaskDetailModal({ task, isOpen, onClose, onUpdate }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Task | null>(task)

  if (!isOpen || !task) return null

  const handleSave = async () => {
    if (editedTask) {
      await onUpdate(task.id, editedTask)
      setIsEditing(false)
    }
  }

  const progressPercent = task.subtasks
    ? Math.round(
        (task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100
      )
    : 0

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-96 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold">وظیفه #{task.id}</h2>
          <button onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold block mb-2">عنوان</label>
            {isEditing ? (
              <Input
                value={editedTask?.title || ''}
                onChange={(e) => setEditedTask({ ...editedTask!, title: e.target.value })}
                className="w-full"
              />
            ) : (
              <p className="text-lg font-semibold">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold block mb-2">توضیحات</label>
            {isEditing ? (
              <textarea
                value={editedTask?.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask!, description: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-800"
                rows={3}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">{task.description || 'بدون توضیح'}</p>
            )}
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold block mb-2">اولویت</label>
              <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                {task.priority}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">وضعیت</label>
              <Badge variant="outline">{task.status}</Badge>
            </div>
          </div>

          {/* Due Date */}
          {task.due_date && (
            <div>
              <label className="text-sm font-semibold block mb-2">تاریخ مهلت</label>
              <p className="text-gray-600 dark:text-gray-400">{task.due_date}</p>
            </div>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div>
              <label className="text-sm font-semibold block mb-2">مسئول</label>
              <p className="text-gray-600 dark:text-gray-400">{task.assignee.full_name}</p>
            </div>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div>
              <label className="text-sm font-semibold block mb-2">برچسب‌ها</label>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((link) => (
                  <Badge key={link.label.id} style={{ backgroundColor: link.label.color }}>
                    {link.label.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tasks Progress */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <label className="text-sm font-semibold block mb-2">
                زیرمجموعه‌ها ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
              </label>
              <div className="space-y-1">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={subtask.completed} readOnly />
                    <span className={subtask.completed ? 'line-through text-gray-400' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t dark:border-gray-800">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex-1 bg-blue-500">
                ذخیره
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                لغو
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} className="flex-1">
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
