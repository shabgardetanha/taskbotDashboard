// src/app/api/tasks/[id]/attachments/route.ts - Task attachments management
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configure upload directory
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'attachments')

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    const { data: attachments, error } = await supabase
      .from('task_attachments')
      .select(`
        id,
        filename,
        original_name,
        file_size,
        mime_type,
        created_at,
        uploaded_by:profiles(id, full_name, username, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching task attachments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const formData = await req.formData()
    const file = formData.get('file') as File
    const uploadedBy = formData.get('uploaded_by') as string

    if (!file || !uploadedBy) {
      return NextResponse.json({ error: 'File and uploaded_by are required' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large (max 10MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/markdown',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-rar-compressed'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${randomUUID()}.${fileExtension}`
    const filePath = join(UPLOAD_DIR, filename)

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true })

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save attachment record to database
    const { data: attachment, error } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        filename,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_path: filePath,
        uploaded_by: uploadedBy,
      })
      .select(`
        id,
        filename,
        original_name,
        file_size,
        mime_type,
        created_at,
        uploaded_by:profiles(id, full_name, username, avatar_url)
      `)
      .single()

    if (error) {
      // Clean up file if database insert fails
      await unlink(filePath).catch(console.error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        task_id: taskId,
        user_id: uploadedBy,
        action: 'attachment_added',
        details: {
          filename: file.name,
          file_size: file.size,
          mime_type: file.type
        }
      })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const { searchParams } = new URL(req.url)
    const attachmentId = searchParams.get('attachment_id')
    const userId = searchParams.get('user_id')

    if (!attachmentId || !userId) {
      return NextResponse.json({ error: 'attachment_id and user_id are required' }, { status: 400 })
    }

    // Get attachment info
    const { data: attachment } = await supabase
      .from('task_attachments')
      .select('uploaded_by, file_path, filename')
      .eq('id', attachmentId)
      .eq('task_id', taskId)
      .single()

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Check permission (only uploader or workspace admin can delete)
    const { data: userRole } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id',
        (await supabase
          .from('tasks')
          .select('workspace_id')
          .eq('id', taskId)
          .single()).data?.workspace_id
      )
      .eq('user_id', userId)
      .single()

    if (!userRole || (attachment.uploaded_by !== userId && !['owner', 'admin'].includes(userRole.role))) {
      return NextResponse.json({ error: 'Unauthorized to delete this attachment' }, { status: 403 })
    }

    // Delete file from disk
    try {
      await unlink(attachment.file_path)
    } catch (fileError) {
      console.warn('Failed to delete file from disk:', fileError)
    }

    // Delete from database
    const { error } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('task_id', taskId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        task_id: taskId,
        user_id: userId,
        action: 'attachment_removed',
        details: {
          filename: attachment.filename
        }
      })

    return NextResponse.json({ message: 'Attachment deleted successfully' })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Allow longer uploads
