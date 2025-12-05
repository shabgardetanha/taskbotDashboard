// src/app/api/workspaces/route.ts - Create and manage workspaces
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // First get workspace IDs where user is a member
    const { data: memberData } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user_id)

    const workspaceIds = memberData?.map(m => m.workspace_id) || []

    if (workspaceIds.length === 0) {
      return NextResponse.json([])
    }

    // Get workspaces where user is a member
    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        members:workspace_members(
          user_id,
          role,
          profiles(id, full_name, username)
        )
      `)
      .in('id', workspaceIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Process the data to include member information
    const processedWorkspaces = workspaces?.map(ws => ({
      ...ws,
      members: ws.members || [],
      member_count: ws.members?.length || 0,
      role: ws.members?.find((m: any) => m.user_id === user_id)?.role || 'viewer'
    })) || []

    return NextResponse.json(processedWorkspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

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

export async function PUT(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { id, name, description, user_id } = await req.json()

    if (!id || !user_id) {
      return NextResponse.json({ error: 'Workspace id and user_id are required' }, { status: 400 })
    }

    // Check if user is owner or admin
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
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
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const user_id = searchParams.get('user_id')

    if (!id || !user_id) {
      return NextResponse.json({ error: 'Workspace id and user_id are required' }, { status: 400 })
    }

    // Check if user is owner
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user_id)
      .single()

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can delete workspaces' }, { status: 403 })
    }

    // Delete workspace (cascade will handle related data)
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
