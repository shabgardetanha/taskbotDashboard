// src/app/api/tasks/route.ts
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
    const {
      title,
      telegramId,
      description,
      priority,
      due_date,
      due_time,
      workspace_id,
      is_recurring,
      recurrence_rule
    } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get or create user profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId || 0)
      .single()

    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          telegram_id: telegramId || Math.floor(Math.random() * 1000000),
          full_name: 'Web User',
        })
        .select()
        .single()

      profile = newProfile
    }

    if (!profile?.id) {
      return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 })
    }

    // Create task with new fields
    const taskData: any = {
      title: title.trim(),
      description,
      status: 'todo',
      priority: priority || 'medium',
      assignee_id: profile.id,
      due_date,
      due_time,
      workspace_id: workspace_id || null, // Allow null for backward compatibility
    }

    // Add recurring fields if provided
    if (is_recurring) {
      taskData.is_recurring = true
      taskData.recurrence_rule = recurrence_rule
      taskData.recurrence_next_date = due_date // Set next occurrence to due date initially
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
