// src/app/api/labels/route.ts - Manage task labels/tags
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

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get('workspace_id')

    let query = supabase.from('task_labels').select('*')

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id)
    }

    const { data: labels, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error fetching labels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { name, color, workspace_id } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Label name is required' }, { status: 400 })
    }

    const { data: label, error } = await supabase
      .from('task_labels')
      .insert({
        name: name.trim(),
        color: color || '#8b5cf6',
        workspace_id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(label, { status: 201 })
  } catch (error) {
    console.error('Error creating label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
