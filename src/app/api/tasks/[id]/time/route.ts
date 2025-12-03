// src/app/api/tasks/[id]/time/route.ts - Time tracking for tasks
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET - Fetch time logs for a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    const { data: timeLogs, error } = await supabase
      .from('task_time_logs')
      .select(`
        *,
        profiles(id, full_name)
      `)
      .eq('task_id', taskId)
      .order('logged_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Calculate total time spent
    const totalTime = timeLogs?.reduce((total, log) => total + (log.time_spent || 0), 0) || 0

    return NextResponse.json({
      timeLogs: timeLogs || [],
      totalTime,
      totalHours: Math.floor(totalTime / 60),
      totalMinutes: totalTime % 60
    })
  } catch (error) {
    console.error('Error fetching time logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add time log to a task
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const { time_spent, unit, notes, user_id } = await req.json()

    if (!time_spent || !user_id) {
      return NextResponse.json({ error: 'Time spent and user_id are required' }, { status: 400 })
    }

    // Convert to minutes if unit is hours
    const timeInMinutes = unit === 'hours' ? time_spent * 60 : time_spent

    const { data: timeLog, error } = await supabase
      .from('task_time_logs')
      .insert({
        task_id: taskId,
        user_id,
        time_spent: timeInMinutes,
        unit: 'minutes',
        notes,
        logged_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(timeLog, { status: 201 })
  } catch (error) {
    console.error('Error creating time log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
