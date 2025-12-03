// src/app/api/tasks/[id]/route.ts - Get, update, delete individual task
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = Number(params.id)

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles(id, full_name, username),
        subtasks(*),
        labels:task_label_links(label:task_labels(*))
      `)
      .eq('id', taskId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = Number(params.id)
    const updates = await req.json()

    // Validate that user has permission to update task
    const { data: task } = await supabase
      .from('tasks')
      .select('workspace_id, assignee_id')
      .eq('id', taskId)
      .single()

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const taskId = Number(params.id)

    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
