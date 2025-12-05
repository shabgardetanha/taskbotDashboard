// src/app/api/tasks/[id]/comments/route.ts - Task comments management
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const taskId = params.id

    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        author:profiles(id, full_name, username, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching task comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const taskId = params.id
    const { content, author_id, parent_id } = await req.json()

    if (!content?.trim() || !author_id) {
      return NextResponse.json({ error: 'Content and author_id are required' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        content: content.trim(),
        author_id,
        parent_id: parent_id || null,
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        author:profiles(id, full_name, username, avatar_url)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating task comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const taskId = params.id
    const { comment_id, content, author_id } = await req.json()

    if (!comment_id || !content?.trim() || !author_id) {
      return NextResponse.json({ error: 'comment_id, content, and author_id are required' }, { status: 400 })
    }

    // Check if user owns the comment
    const { data: existingComment } = await supabase
      .from('task_comments')
      .select('author_id')
      .eq('id', comment_id)
      .eq('task_id', taskId)
      .single()

    if (!existingComment || existingComment.author_id !== author_id) {
      return NextResponse.json({ error: 'Unauthorized to edit this comment' }, { status: 403 })
    }

    const { data: comment, error } = await supabase
      .from('task_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', comment_id)
      .eq('task_id', taskId)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        author:profiles(id, full_name, username, avatar_url)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error updating task comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const taskId = params.id
    const { searchParams } = new URL(req.url)
    const comment_id = searchParams.get('comment_id')
    const author_id = searchParams.get('author_id')

    if (!comment_id || !author_id) {
      return NextResponse.json({ error: 'comment_id and author_id are required' }, { status: 400 })
    }

    // Check if user owns the comment
    const { data: existingComment } = await supabase
      .from('task_comments')
      .select('author_id')
      .eq('id', comment_id)
      .eq('task_id', taskId)
      .single()

    if (!existingComment || existingComment.author_id !== author_id) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 })
    }

    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', comment_id)
      .eq('task_id', taskId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting task comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
