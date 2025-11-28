// src/app/api/workspaces/route.ts - Create and manage workspaces
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    const { name, description, owner_id } = await req.json()

    if (!name?.trim() || !owner_id) {
      return NextResponse.json({ error: 'Name and owner_id are required' }, { status: 400 })
    }

    // Create workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        description,
        owner_id,
      })
      .select()
      .single()

    if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 })

    // Add owner as workspace member
    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: owner_id,
      role: 'owner',
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
