// src/app/api/task-templates/route.ts - Task template management
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workspace_id = searchParams.get('workspace_id')

    let query = supabase.from('task_templates').select('*')

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id)
    }

    const { data: templates, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, template_data, workspace_id, category, created_by } = await req.json()

    if (!name?.trim() || !template_data) {
      return NextResponse.json({ error: 'Name and template_data are required' }, { status: 400 })
    }

    const { data: template, error } = await supabase
      .from('task_templates')
      .insert({
        name: name.trim(),
        description,
        template_data,
        workspace_id,
        category: category || 'general',
        created_by,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
