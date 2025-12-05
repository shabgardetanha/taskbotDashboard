// src/app/api/notifications/route.ts - User notifications management
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        data,
        read,
        created_at,
        workspace:workspaces(id, name),
        task:tasks(id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error, count } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      notifications: notifications || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { notification_ids, user_id, action } = await req.json()

    if (!user_id || !notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json({
        error: 'user_id and notification_ids array are required'
      }, { status: 400 })
    }

    let updateData: any = {}

    if (action === 'mark_read') {
      updateData.read = true
    } else if (action === 'mark_unread') {
      updateData.read = false
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('user_id', user_id)
      .in('id', notification_ids)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      message: `${notifications?.length || 0} notifications updated`,
      notifications
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const notificationId = searchParams.get('notification_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (notificationId) {
      query = query.eq('id', notificationId)
    }

    const { error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      message: notificationId
        ? 'Notification deleted'
        : 'All notifications deleted'
    })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
