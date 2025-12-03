// src/app/api/workspaces/[id]/route.ts - Individual workspace operations
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id

    // Get workspace with full details
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        members:workspace_members(
          user_id,
          role,
          joined_at,
          profiles(id, full_name, username, telegram_id)
        ),
        task_count:tasks(count),
        label_count:task_labels(count)
      `)
      .eq('id', workspaceId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id
    const { name, description, user_id } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Check permissions
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user_id)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: any = {}
    if (name) updates.name = name.trim()
    if (description !== undefined) updates.description = description

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Check if user is owner
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user_id)
      .single()

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can delete workspaces' }, { status: 403 })
    }

    // Delete workspace (cascade will handle related data)
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
