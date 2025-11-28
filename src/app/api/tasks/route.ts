// src/app/api/tasks/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const { title, telegramId } = await req.json()

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

    // Create task with assignee_id
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        status: 'todo',
        priority: 'medium',
        assignee_id: profile.id,
      })
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
