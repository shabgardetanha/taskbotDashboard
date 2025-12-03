// src/app/api/workspaces/[id]/members/route.ts - Workspace members management
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

    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(`
        user_id,
        role,
        joined_at,
        profiles(id, full_name, username, telegram_id)
      `)
      .eq('workspace_id', workspaceId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching workspace members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id
    const { user_id, role, inviter_id } = await req.json()

    if (!user_id || !inviter_id) {
      return NextResponse.json({ error: 'user_id and inviter_id are required' }, { status: 400 })
    }

    // Check if inviter has permission to add members
    const { data: inviter } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', inviter_id)
      .single()

    if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
      return NextResponse.json({ error: 'Unauthorized to add members' }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user_id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Add member
    const { data: member, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id,
        role: role || 'member'
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error adding workspace member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspaceId = params.id
    const { user_id, role, updater_id } = await req.json()

    if (!user_id || !role || !updater_id) {
      return NextResponse.json({ error: 'user_id, role, and updater_id are required' }, { status: 400 })
    }

    // Check if updater has permission to change roles
    const { data: updater } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', updater_id)
      .single()

    if (!updater || !['owner', 'admin'].includes(updater.role)) {
      return NextResponse.json({ error: 'Unauthorized to change member roles' }, { status: 403 })
    }

    // Owners can only be changed by other owners
    if (role === 'owner' && updater.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can assign owner role' }, { status: 403 })
    }

    // Update member role
    const { data: member, error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('workspace_id', workspaceId)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error updating workspace member:', error)
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
    const remover_id = searchParams.get('remover_id')

    if (!user_id || !remover_id) {
      return NextResponse.json({ error: 'user_id and remover_id are required' }, { status: 400 })
    }

    // Check if remover has permission to remove members
    const { data: remover } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', remover_id)
      .single()

    if (!remover || !['owner', 'admin'].includes(remover.role)) {
      return NextResponse.json({ error: 'Unauthorized to remove members' }, { status: 403 })
    }

    // Check if target user exists and get their role
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user_id)
      .single()

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Owners can only be removed by other owners
    if (targetMember.role === 'owner' && remover.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can remove other owners' }, { status: 403 })
    }

    // Cannot remove yourself
    if (user_id === remover_id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Remove member
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', user_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Error removing workspace member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
