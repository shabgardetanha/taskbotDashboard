'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading'
import { useWorkspace } from '@/contexts/workspace-context'
import { Building2, ChevronDown, Plus, Users, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
// Define local interface since context doesn't export Workspace
interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
  member_count?: number
}

interface WorkspaceSelectorProps {
  currentWorkspaceId?: string
  onWorkspaceChange?: (workspaceId: string) => void
  compact?: boolean
}

export function WorkspaceSelector({
  currentWorkspaceId,
  onWorkspaceChange,
  compact = false
}: WorkspaceSelectorProps) {
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    loading: isLoading
  } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (workspaces.length > 0 && currentWorkspaceId) {
      const workspace = workspaces.find(w => w.id === currentWorkspaceId)
      if (workspace) {
        setCurrentWorkspace(workspace)
      }
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspace])

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    setIsOpen(false)
    onWorkspaceChange?.(workspace.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-500">بارگذاری...</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <Building2 className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium">{currentWorkspace?.name}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <Card className="absolute top-full left-0 mt-2 w-64 z-50">
            <CardContent className="p-2">
              <div className="space-y-1">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      currentWorkspace?.id === workspace.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{workspace.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        {workspace.member_count} عضو
                      </div>
                    </div>
                  </button>
                ))}

                <div className="border-t pt-2 mt-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    فضای کاری جدید
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">فضای کاری</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">مدیریت تیم و پروژه‌ها</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              currentWorkspace?.id === workspace.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => handleWorkspaceSelect(workspace)}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{workspace.name}</h4>
              <Badge variant="outline" className="text-xs">
                {workspace.member_count} عضو
              </Badge>
            </div>

            {workspace.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {workspace.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {workspace.member_count} عضو
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  ۰ وظیفه
                </span>
              </div>

              <div className="text-xs">
                ایجاد {new Date(workspace.created_at).toLocaleDateString('fa-IR')}
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          فضای کاری جدید
        </Button>
      </div>
    </div>
  )
}

// Compact version for header
export function WorkspaceHeader() {
  const { currentWorkspace } = useWorkspace()

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center">
        <Building2 className="w-3 h-3 text-white" />
      </div>
      <span className="text-sm font-medium">{currentWorkspace?.name || 'فضای کاری'}</span>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </div>
  )
}
