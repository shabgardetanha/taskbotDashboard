// src/lib/supabase-queries.ts
// Optimized query patterns following 2025 standards
// All queries use proper indexes and pagination

import { supabase } from '@/lib/supabase'

/**
 * Get tasks for a specific workspace with optimized querying
 * Uses idx_tasks_workspace_status index for performance
 */
export async function getTasksByWorkspace(
  workspaceId: string | null,
  options?: {
    limit?: number
    offset?: number
    status?: string
    assigneeId?: string
  }
) {
  if (!workspaceId) return { data: [], count: 0 }

  const limit = Math.min(options?.limit || 50, 200) // Max 200 items
  const offset = options?.offset || 0

  let query = supabase
    .from('tasks')
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      position,
      due_date,
      due_time,
      assignee_id,
      parent_task_id,
      subtask_count,
      subtask_completed,
      created_at,
      updated_at,
      labels:task_label_links(
        label:task_labels(id, name, color)
      ),
      assignee:profiles(id, full_name, avatar_url)
      `,
      { count: 'estimated' }
    )
    .eq('workspace_id', workspaceId)
    .is('parent_task_id', null) // Exclude subtasks from main list

  // Apply optional filters
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.assigneeId) {
    query = query.eq('assignee_id', options.assigneeId)
  }

  // Apply ordering and pagination
  const result = await query
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return {
    data: result.data || [],
    count: result.count || 0,
    error: result.error,
  }
}

/**
 * Get tasks by user (assigned to current user)
 * Uses idx_tasks_assignee_status index for performance
 */
export async function getTasksByAssignee(
  userId: string | null,
  options?: {
    limit?: number
    offset?: number
    status?: string
    workspaceId?: string
  }
) {
  if (!userId) return { data: [], count: 0 }

  const limit = Math.min(options?.limit || 50, 200)
  const offset = options?.offset || 0

  let query = supabase
    .from('tasks')
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      due_date,
      workspace_id,
      parent_task_id,
      subtask_count,
      created_at,
      labels:task_label_links(label:task_labels(id, name, color))
      `,
      { count: 'estimated' }
    )
    .eq('assignee_id', userId)
    .is('parent_task_id', null) // Main tasks only

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.workspaceId) {
    query = query.eq('workspace_id', options.workspaceId)
  }

  const result = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return {
    data: result.data || [],
    count: result.count || 0,
    error: result.error,
  }
}

/**
 * Get tasks due on specific date range
 * Uses idx_tasks_due_date_status index for performance
 */
export async function getTasksByDueDate(
  workspaceId: string | null,
  startDate: string,
  endDate: string,
  options?: { limit?: number; offset?: number }
) {
  if (!workspaceId) return { data: [], count: 0 }

  const limit = Math.min(options?.limit || 100, 200)
  const offset = options?.offset || 0

  const result = await supabase
    .from('tasks')
    .select(
      `
      id,
      title,
      due_date,
      due_time,
      status,
      priority,
      assignee_id,
      created_at,
      labels:task_label_links(label:task_labels(id, name, color))
      `,
      { count: 'estimated' }
    )
    .eq('workspace_id', workspaceId)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('due_date', { ascending: true })
    .order('due_time', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1)

  return {
    data: result.data || [],
    count: result.count || 0,
    error: result.error,
  }
}

/**
 * Search tasks with pagination and filtering
 * Uses GIN index on description for full-text search
 */
export async function searchTasks(
  workspaceId: string | null,
  searchText: string,
  options?: {
    limit?: number
    offset?: number
    status?: string
    priority?: string
  }
) {
  if (!workspaceId || !searchText) return { data: [], count: 0 }

  const limit = Math.min(options?.limit || 50, 200)
  const offset = options?.offset || 0

  let query = supabase
    .from('tasks')
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      labels:task_label_links(label:task_labels(id, name, color))
      `,
      { count: 'estimated' }
    )
    .eq('workspace_id', workspaceId)
    .or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%`)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.priority) {
    query = query.eq('priority', options.priority)
  }

  const result = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return {
    data: result.data || [],
    count: result.count || 0,
    error: result.error,
  }
}

/**
 * Get subtasks for a parent task
 * Uses idx_subtasks_task index for performance
 */
export async function getSubtasks(
  taskId: number,
  options?: { limit?: number; offset?: number }
) {
  const limit = Math.min(options?.limit || 50, 200)
  const offset = options?.offset || 0

  const result = await supabase
    .from('subtasks')
    .select('*', { count: 'estimated' })
    .eq('task_id', taskId)
    .order('order_index', { ascending: true })
    .range(offset, offset + limit - 1)

  return {
    data: result.data || [],
    count: result.count || 0,
    error: result.error,
  }
}

/**
 * Get labels for a workspace
 */
export async function getLabelsByWorkspace(workspaceId: string | null) {
  if (!workspaceId) return { data: [], error: null }

  const result = await supabase
    .from('task_labels')
    .select('id, name, color')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return {
    data: result.data || [],
    error: result.error,
  }
}

/**
 * Get activity logs for a task (audit trail)
 * Uses idx_activity_logs_task_created index
 */
export async function getTaskActivity(
  taskId: number,
  options?: { limit?: number; offset?: number }
) {
  const limit = Math.min(options?.limit || 50, 200)
  const offset = options?.offset || 0

  const result = await supabase
    .from('activity_logs')
    .select(
      `
      id,
      action,
      changes,
      created_at,
      user:profiles(id, full_name, avatar_url)
      `
    )
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return {
    data: result.data || [],
    error: result.error,
  }
}

/**
 * Scoped realtime subscription for workspace tasks
 * Only listens to tasks in specific workspace
 */
export function subscribeToWorkspaceTasks(
  workspaceId: string | null,
  callback: (event: any) => void
) {
  if (!workspaceId) return null

  // Scope subscription to specific workspace using where clause
  const channel = supabase
    .channel(`workspace:${workspaceId}:tasks`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

/**
 * Scoped realtime subscription for comments
 */
export function subscribeToTaskComments(
  taskId: number,
  callback: (event: any) => void
) {
  const channel = supabase
    .channel(`task:${taskId}:comments`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `task_id=eq.${taskId}`,
      },
      callback
    )
    .subscribe()

  return channel
}
