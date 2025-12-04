'use client'

export const dynamic = 'force-dynamic'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { Calendar, Filter, Search, X } from 'lucide-react'
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

interface SearchFilters {
  query: string
  status: string[]
  priority: string[]
  labels: string[]
  due_date_from: string
  due_date_to: string
  workspace_id: string
  assignee_id: string
}

export default function SearchPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    priority: [],
    labels: [],
    due_date_from: '',
    due_date_to: '',
    workspace_id: '',
    assignee_id: ''
  })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [availableLabels, setAvailableLabels] = useState<Array<{ id: string; name: string; color: string }>>([])

  useEffect(() => {
    loadAvailableLabels()
    performSearch()
  }, [])

  const loadAvailableLabels = async () => {
    try {
      const { data } = await supabase
        .from('task_labels')
        .select('id, name, color')
        .order('name')

      setAvailableLabels(data || [])
    } catch (error) {
      console.error('Error loading labels:', error)
    }
  }

  const performSearch = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(label:task_labels(*))
        `)

      // Text search
      if (filters.query.trim()) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      }

      // Status filter
      if (filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      // Priority filter
      if (filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
      }

      // Date range filter
      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from)
      }
      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to)
      }

      // Workspace filter
      if (filters.workspace_id) {
        query = query.eq('workspace_id', filters.workspace_id)
      }

      // Assignee filter
      if (filters.assignee_id) {
        query = query.eq('assignee_id', filters.assignee_id)
      }

      // Label filter (if implemented)
      if (filters.labels.length > 0) {
        // This would need a more complex query or post-filtering
        // For now, we'll implement basic filtering
      }

      query = query.order('created_at', { ascending: false }).limit(50)

      const { data, error } = await query

      if (error) throw error

      // Post-filter for labels if needed
      let filteredTasks = data || []
      if (filters.labels.length > 0) {
        filteredTasks = filteredTasks.filter(task =>
          task.labels?.some((labelLink: any) =>
            filters.labels.includes(labelLink.label?.id)
          )
        )
      }

      setTasks(filteredTasks)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const toggleFilterArray = (key: 'status' | 'priority' | 'labels', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      status: [],
      priority: [],
      labels: [],
      due_date_from: '',
      due_date_to: '',
      workspace_id: '',
      assignee_id: ''
    })
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

      // Refresh search results
      await performSearch()
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200'
      case 'inprogress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'todo': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Search className="w-8 h-8 text-blue-500" />
          جستجوی پیشرفته
        </h1>
        <Button onClick={performSearch} disabled={isLoading} className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          {isLoading ? 'در حال جستجو...' : 'جستجو'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فیلترها
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mr-auto">
              <X className="w-4 h-4 mr-1" />
              پاک کردن
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Query */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              جستجو در عنوان و توضیحات
            </label>
            <Input
              placeholder="کلمه کلیدی را وارد کنید..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              وضعیت
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'todo', label: 'در انتظار' },
                { value: 'inprogress', label: 'در حال انجام' },
                { value: 'done', label: 'انجام شده' }
              ].map(status => (
                <Button
                  key={status.value}
                  variant={filters.status.includes(status.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilterArray('status', status.value)}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              اولویت
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'urgent', label: 'فوری' },
                { value: 'high', label: 'زیاد' },
                { value: 'medium', label: 'متوسط' },
                { value: 'low', label: 'کم' }
              ].map(priority => (
                <Button
                  key={priority.value}
                  variant={filters.priority.includes(priority.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilterArray('priority', priority.value)}
                >
                  {priority.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Labels Filter */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
              برچسب‌ها
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map(label => (
                <Button
                  key={label.id}
                  variant={filters.labels.includes(label.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilterArray('labels', label.id)}
                  className="flex items-center gap-1"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                از تاریخ
              </label>
              <Input
                type="date"
                value={filters.due_date_from}
                onChange={(e) => handleFilterChange('due_date_from', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                تا تاریخ
              </label>
              <Input
                type="date"
                value={filters.due_date_to}
                onChange={(e) => handleFilterChange('due_date_to', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            نتایج جستجو ({tasks.length} وظیفه)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">در حال جستجو...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ وظیفه‌ای یافت نشد. فیلترها را تغییر دهید.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTaskClick(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === 'todo' ? 'در انتظار' :
                           task.status === 'inprogress' ? 'در حال انجام' : 'انجام شده'}
                        </Badge>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(task.due_date).toLocaleDateString('fa-IR')}
                            {task.due_time && ` ${task.due_time.slice(0, 5)}`}
                          </div>
                        )}

                        {task.subtask_count && task.subtask_count > 0 && (
                          <div>
                            {task.subtask_completed || 0}/{task.subtask_count} زیروظیفه
                          </div>
                        )}
                      </div>

                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.labels.slice(0, 3).map((label) => (
                            <Badge
                              key={label.id}
                              variant="outline"
                              className="text-xs px-2 py-0"
                              style={{ borderColor: label.color, color: label.color }}
                            >
                              {label.name}
                            </Badge>
                          ))}
                          {task.labels.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              +{task.labels.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
