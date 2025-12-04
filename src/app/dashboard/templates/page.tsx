'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { TaskDetailModal } from '@/components/TaskDetailModal'
import { FileText, Plus, Search, Star, Trash2, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TaskTemplate {
  id: string
  name: string
  description?: string
  template_data: any
  category: string
  created_by: string
  created_at: string
  usage_count?: number
}

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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'general',
    template_data: null as any
  })

  useEffect(() => {
    loadTemplates()
    loadTasks()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('task_templates')
        .select('*')
        .order('created_at', { ascending: false })

      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(label:task_labels(*))
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const createTemplateFromTask = async (task: Task) => {
    const templateData = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      labels: task.labels?.map(l => ({ name: l.name, color: l.color })) || [],
      subtasks: [] // Could be enhanced to include subtasks
    }

    setNewTemplate({
      name: `${task.title} - قالب`,
      description: `قالب ایجاد شده از وظیفه: ${task.title}`,
      category: 'general',
      template_data: templateData
    })

    setIsCreatingTemplate(true)
  }

  const saveTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.template_data) return

    try {
      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          name: newTemplate.name.trim(),
          description: newTemplate.description,
          template_data: newTemplate.template_data,
          category: newTemplate.category,
          created_by: 'user-1' // Should get from auth context
        })
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => [data, ...prev])
      setIsCreatingTemplate(false)
      setNewTemplate({ name: '', description: '', category: 'general', template_data: null })
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این قالب را حذف کنید؟')) return

    try {
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const useTemplate = async (template: TaskTemplate) => {
    try {
      const templateData = template.template_data

      // Create task from template
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title: templateData.title,
          description: templateData.description,
          priority: templateData.priority || 'medium',
          status: 'todo',
          assignee_id: 'user-1', // Should get from auth context
          workspace_id: null // Could be enhanced to use current workspace
        })
        .select()
        .single()

      if (error) throw error

      // Add labels if any
      if (templateData.labels && templateData.labels.length > 0) {
        for (const label of templateData.labels) {
          // Find or create label
          let { data: existingLabel } = await supabase
            .from('task_labels')
            .select('id')
            .eq('name', label.name)
            .single()

          if (!existingLabel) {
            const { data: newLabel } = await supabase
              .from('task_labels')
              .insert({
                name: label.name,
                color: label.color,
                workspace_id: null // Could be enhanced
              })
              .select()
              .single()
            existingLabel = newLabel
          }

          if (existingLabel) {
            await supabase
              .from('task_label_links')
              .insert({
                task_id: task.id,
                label_id: existingLabel.id
              })
          }
        }
      }

      // Update usage count
      await supabase
        .from('task_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', template.id)

      alert(`وظیفه "${task.title}" با موفقیت از قالب ایجاد شد!`)
    } catch (error) {
      console.error('Error using template:', error)
      alert('خطا در ایجاد وظیفه از قالب')
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'general', 'bug', 'feature', 'meeting', 'review']

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">در حال بارگذاری قالب‌ها...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          قالب‌های وظیفه
        </h1>
        <Button
          onClick={() => setIsCreatingTemplate(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ایجاد قالب جدید
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در قالب‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'همه' :
                   category === 'general' ? 'عمومی' :
                   category === 'bug' ? 'باگ' :
                   category === 'feature' ? 'ویژگی' :
                   category === 'meeting' ? 'جلسه' : 'بررسی'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Template Modal */}
      {isCreatingTemplate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ایجاد قالب جدید</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                نام قالب
              </label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="نام قالب را وارد کنید"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                توضیحات
              </label>
              <textarea
                value={newTemplate.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                placeholder="توضیحات قالب (اختیاری)"
                rows={3}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                دسته‌بندی
              </label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="general">عمومی</option>
                <option value="bug">باگ</option>
                <option value="feature">ویژگی</option>
                <option value="meeting">جلسه</option>
                <option value="review">بررسی</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveTemplate} disabled={!newTemplate.name.trim()}>
                ذخیره قالب
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingTemplate(false)}>
                لغو
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {template.category === 'general' ? 'عمومی' :
                     template.category === 'bug' ? 'باگ' :
                     template.category === 'feature' ? 'ویژگی' :
                     template.category === 'meeting' ? 'جلسه' : 'بررسی'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => useTemplate(template)}
                    title="استفاده از قالب"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTemplate(template.id)}
                    title="حذف قالب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {template.description || 'توضیحاتی ندارد'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>استفاده: {template.usage_count || 0}</span>
                <span>{new Date(template.created_at).toLocaleDateString('fa-IR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>ایجاد سریع از وظایف موجود</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.slice(0, 6).map(task => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 line-clamp-1">{task.title}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {task.priority === 'urgent' ? 'فوری' :
                       task.priority === 'high' ? 'زیاد' :
                       task.priority === 'medium' ? 'متوسط' : 'کم'}
                    </Badge>
                    {task.labels && task.labels.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {task.labels.length} برچسب
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createTemplateFromTask(task)}
                    className="w-full"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    ایجاد قالب
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={async () => {}} // Could be implemented for template preview
      />
    </div>
  )
}
