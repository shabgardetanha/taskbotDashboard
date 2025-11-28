// src/components/TaskFilters.tsx - Advanced filtering panel
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

interface FilterOptions {
  priorities: string[]
  statuses: string[]
  labels: string[]
  dateRange: { from: string; to: string }
  searchTerm: string
}

interface TaskFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
  availablePriorities?: string[]
  availableStatuses?: string[]
  availableLabels?: Array<{ id: string; name: string; color: string }>
}

export function TaskFilters({
  onFilterChange,
  availablePriorities = ['low', 'medium', 'high', 'urgent'],
  availableStatuses = ['todo', 'inprogress', 'done'],
  availableLabels = [],
}: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    priorities: [],
    statuses: [],
    labels: [],
    dateRange: { from: '', to: '' },
    searchTerm: '',
  })

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handlePriorityToggle = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority]
    handleFilterChange({ ...filters, priorities: newPriorities })
  }

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    handleFilterChange({ ...filters, statuses: newStatuses })
  }

  const handleLabelToggle = (labelId: string) => {
    const newLabels = filters.labels.includes(labelId)
      ? filters.labels.filter(l => l !== labelId)
      : [...filters.labels, labelId]
    handleFilterChange({ ...filters, labels: newLabels })
  }

  const handleReset = () => {
    const emptyFilters: FilterOptions = {
      priorities: [],
      statuses: [],
      labels: [],
      dateRange: { from: '', to: '' },
      searchTerm: '',
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const activeFilterCount =
    filters.priorities.length +
    filters.statuses.length +
    filters.labels.length +
    (filters.searchTerm ? 1 : 0) +
    (filters.dateRange.from || filters.dateRange.to ? 1 : 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <ChevronDown size={20} className={isExpanded ? 'rotate-180' : ''} />
          <span className="font-semibold">فیلترها</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-blue-500 text-white">
              {activeFilterCount}
            </Badge>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t dark:border-gray-700 p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="text-sm font-semibold block mb-2">جستجو</label>
            <Input
              placeholder="جستجو در عنوان و توضیحات..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-semibold block mb-2">اولویت</label>
            <div className="flex flex-wrap gap-2">
              {availablePriorities.map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityToggle(priority)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    filters.priorities.includes(priority)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-semibold block mb-2">وضعیت</label>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    filters.statuses.includes(status)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Labels */}
          {availableLabels.length > 0 && (
            <div>
              <label className="text-sm font-semibold block mb-2">برچسب‌ها</label>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => handleLabelToggle(label.id)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filters.labels.includes(label.id) ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{
                      backgroundColor: label.color,
                      opacity: filters.labels.includes(label.id) ? 1 : 0.6,
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-semibold block mb-2">از تاریخ</label>
              <Input
                type="date"
                value={filters.dateRange.from}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, from: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-2">تا تاریخ</label>
              <Input
                type="date"
                value={filters.dateRange.to}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, to: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Reset Button */}
          {activeFilterCount > 0 && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
            >
              <X size={16} className="ml-2" />
              پاک‌کردن تمام فیلترها
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
