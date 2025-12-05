import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface TaskFilter {
  workspace_id?: string
  assignee_id?: string
  priority?: string[]
  status?: string[]
  labels?: string[]
  due_date_from?: string
  due_date_to?: string
  search_term?: string
  include_subtasks?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const filters: TaskFilter = await req.json()
    let query = supabase.from('tasks').select(`
      *,
      assignee:profiles(id, full_name, username),
      subtasks(*),
      labels:task_label_links(label:task_labels(*))
    `)

    if (filters.workspace_id) {
      query = query.eq('workspace_id', filters.workspace_id)
    }

    if (filters.assignee_id) {
      query = query.eq('assignee_id', filters.assignee_id)
    }

    if (filters.priority?.length) {
      query = query.in('priority', filters.priority)
    }

    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }

    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }

    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }

    if (filters.search_term) {
      query = query.or(`title.ilike.%${filters.search_term}%,description.ilike.%${filters.search_term}%`)
    }

    // Order by due_date, then status
    query = query.order('due_date', { ascending: true, nullsFirst: false })
      .order('status', { ascending: true })

    const { data: tasks, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Filter by labels if specified
    let filtered = tasks || []
    if (filters.labels?.length) {
      filtered = filtered.filter(task =>
        task.labels?.some((link: any) => filters.labels?.includes(link.label.id))
      )
    }

    return NextResponse.json({ tasks: filtered, count: filtered.length })
  } catch (error) {
    console.error('Error searching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
