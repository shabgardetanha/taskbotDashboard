// src/app/api/subtasks/route.ts - Create and manage subtasks
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { task_id, title, description } = await req.json()

    if (!task_id || !title?.trim()) {
      return NextResponse.json({ error: 'Task ID and title are required' }, { status: 400 })
    }

    const { data: subtask, error } = await supabase
      .from('subtasks')
      .insert({
        task_id,
        title: title.trim(),
        description,
        order_index: 0,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update parent task's subtask count
    const { data: allSubtasks } = await supabase
      .from('subtasks')
      .select('id, completed')
      .eq('task_id', task_id)

    const total = allSubtasks?.length || 0
    const completed = allSubtasks?.filter((st: any) => st.completed).length || 0

    await supabase
      .from('tasks')
      .update({ subtask_count: total, subtask_completed: completed })
      .eq('id', task_id)

    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { id, completed } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Subtask ID is required' }, { status: 400 })
    }

    const { data: subtask, error: updateError } = await supabase
      .from('subtasks')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('task_id')
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Update parent task progress
    const { data: allSubtasks } = await supabase
      .from('subtasks')
      .select('id, completed')
      .eq('task_id', subtask.task_id)

    const total = allSubtasks?.length || 0
    const completedCount = allSubtasks?.filter((st: any) => st.completed).length || 0

    await supabase
      .from('tasks')
      .update({ subtask_count: total, subtask_completed: completedCount })
      .eq('id', subtask.task_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating subtask:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
