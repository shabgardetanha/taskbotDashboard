'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './auth-context'
import { toast } from '@/components/ui/toast'

interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
  member_count?: number
}

interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
  user_profile?: {
    id: string
    full_name?: string
    username?: string
    avatar_url?: string
  }
}

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  members: WorkspaceMember[]
  loading: boolean
  setCurrentWorkspace: (workspace: Workspace | null) => void
  createWorkspace: (name: string, description?: string) => Promise<void>
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  inviteMember: (workspaceId: string, email: string, role?: string) => Promise<void>
  updateMemberRole: (workspaceId: string, userId: string, role: string) => Promise<void>
  removeMember: (workspaceId: string, userId: string) => Promise<void>
  refreshWorkspaces: () => Promise<void>
  refreshMembers: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadWorkspaces()
    } else {
      setWorkspaces([])
      setCurrentWorkspace(null)
      setMembers([])
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers(currentWorkspace.id)
    } else {
      setMembers([])
    }
  }, [currentWorkspace])

  const loadWorkspaces = async () => {
    if (!user) return

    try {
      setLoading(true)

      const { data: workspacesData, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          workspace_members!inner(user_id)
        `)
        .eq('workspace_members.user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const workspacesWithCount = workspacesData?.map(workspace => ({
        ...workspace,
        member_count: Array.isArray(workspace.workspace_members)
          ? workspace.workspace_members.length
          : 1
      })) || []

      setWorkspaces(workspacesWithCount)

      // Set first workspace as current if none selected
      if (workspacesWithCount.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(workspacesWithCount[0]!)
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
      toast({
        title: "خطا در بارگذاری تیم‌ها",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMembers = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          user_profile:profiles(id, full_name, username, avatar_url)
        `)
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true })

      if (error) throw error

      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const createWorkspace = async (name: string, description?: string) => {
    if (!user) throw new Error('Authentication required')

    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          description,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      await refreshWorkspaces()
      setCurrentWorkspace(workspace)

      toast({
        title: "تیم ایجاد شد",
        description: `"${name}" با موفقیت ایجاد گردید`,
        variant: "success",
      })
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast({
        title: "خطا در ایجاد تیم",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    }
  }

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      await refreshWorkspaces()

      toast({
        title: "تیم بروزرسانی شد",
        description: "تغییرات ذخیره گردید",
        variant: "success",
      })
    } catch (error) {
      console.error('Error updating workspace:', error)
      toast({
        title: "خطا در بروزرسانی",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    }
  }

  const deleteWorkspace = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id)

      if (error) throw error

      await refreshWorkspaces()

      if (currentWorkspace?.id === id) {
        const remainingWorkspaces = workspaces.filter(w => w.id !== id)
        setCurrentWorkspace(remainingWorkspaces.length > 0 ? remainingWorkspaces[0] : null)
      }

      toast({
        title: "تیم حذف شد",
        description: "تیم و تمام اطلاعات آن حذف گردید",
        variant: "success",
      })
    } catch (error) {
      console.error('Error deleting workspace:', error)
      toast({
        title: "خطا در حذف تیم",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    }
  }

  const inviteMember = async (workspaceId: string, email: string, role = 'member') => {
    try {
      // First, find user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email) // Assuming we add email to profiles later

      if (profileError) throw profileError

      if (!profiles || profiles.length === 0) {
        throw new Error('کاربر با این ایمیل یافت نشد')
      }

      const userId = profiles[0].id

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        throw new Error('این کاربر قبلاً عضو تیم است')
      }

      // Add member
      const { error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          role,
        })

      if (error) throw error

      await refreshMembers()

      toast({
        title: "عضو دعوت شد",
        description: "کاربر جدید به تیم اضافه گردید",
        variant: "success",
      })
    } catch (error) {
      console.error('Error inviting member:', error)
      toast({
        title: "خطا در دعوت عضو",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    }
  }

  const updateMemberRole = async (workspaceId: string, userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)

      if (error) throw error

      await refreshMembers()

      toast({
        title: "نقش بروزرسانی شد",
        description: "نقش عضو تیم تغییر یافت",
        variant: "success",
      })
    } catch (error) {
      console.error('Error updating member role:', error)
      toast({
        title: "خطا در بروزرسانی نقش",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    }
  }

  const removeMember = async (workspaceId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)

      if (error) throw error

      await refreshMembers()

      toast({
        title: "عضو حذف شد",
        description: "کاربر از تیم حذف گردید",
        variant: "success",
      })
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: "خطا در حذف عضو",
        description: error instanceof Error ? error.message : "خطای نامشخص",
        variant: "destructive",
      })
      throw error
    }
  }

  const refreshWorkspaces = async () => {
    await loadWorkspaces()
  }

  const refreshMembers = async () => {
    if (currentWorkspace) {
      await loadMembers(currentWorkspace.id)
    }
  }

  const value: WorkspaceContextType = {
    workspaces,
    currentWorkspace,
    members,
    loading,
    setCurrentWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    updateMemberRole,
    removeMember,
    refreshWorkspaces,
    refreshMembers,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
