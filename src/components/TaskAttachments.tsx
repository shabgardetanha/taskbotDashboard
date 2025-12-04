'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useWorkspace } from '@/contexts/workspace-context'
import {
  Paperclip,
  Download,
  Trash2,
  File,
  Image as ImageIcon,
  FileText,
  Archive,
  Upload,
  X,
  Eye
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface Attachment {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
  uploaded_by: {
    id: string
    full_name?: string
    username?: string
    avatar_url?: string
  }
}

interface TaskAttachmentsProps {
  taskId: number
  className?: string
}

export function TaskAttachments({ taskId, className }: TaskAttachmentsProps) {
  const { user } = useAuth()
  const { currentWorkspace, members } = useWorkspace()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    loadAttachments()
  }, [taskId])

  const loadAttachments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}/attachments`)
      const data = await response.json()

      if (response.ok) {
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue

        const formData = new FormData()
        formData.append('file', file)
        formData.append('uploaded_by', user.id)

        const response = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          setUploadProgress(((i + 1) / files.length) * 100)
        } else {
          console.error('Upload failed:', await response.text())
        }
      }

      await loadAttachments()
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    if (!user || !confirm('آیا مطمئن هستید که می‌خواهید این فایل را حذف کنید؟')) return

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/attachments?attachment_id=${attachmentId}&user_id=${user.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        await loadAttachments()
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
    }
  }

  const downloadAttachment = (attachment: Attachment) => {
    // For now, we'll create a download link
    // In production, you'd want to serve files through an API endpoint
    const link = document.createElement('a')
    link.href = `/api/tasks/${taskId}/attachments/${attachment.id}/download`
    link.download = attachment.original_name
    link.click()
  }

  const previewAttachment = (attachment: Attachment) => {
    if (attachment.mime_type.startsWith('image/')) {
      // For images, we could open a modal or new tab
      window.open(`/api/tasks/${taskId}/attachments/${attachment.id}/preview`, '_blank')
    } else {
      // For other files, download
      downloadAttachment(attachment)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-green-500" />
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-4 h-4 text-yellow-500" />
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="w-4 h-4 text-blue-500" />
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText className="w-4 h-4 text-green-500" />
    return <File className="w-4 h-4 text-gray-500" />
  }

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'تصویر'
    if (mimeType === 'application/pdf') return 'PDF'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'فایل فشرده'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'سند Word'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'صفحه گسترده'
    if (mimeType.startsWith('text/')) return 'فایل متنی'
    return 'فایل'
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
    }
  }

  const canDeleteAttachment = (attachment: Attachment) => {
    if (!user || !currentWorkspace) return false

    // Owner can delete any attachment
    if (currentWorkspace.owner_id === user.id) return true

    // Workspace admins can delete any attachment
    const currentMember = members.find((m: any) => m.user_id === user.id)
    if (currentMember?.role === 'admin') return true

    // Users can delete their own attachments
    return attachment.uploaded_by.id === user.id
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          پیوست‌ها ({attachments.length})
        </h3>
      </div>

      {/* Upload Area */}
      {user && (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
          <div
            className={`p-6 text-center ${dragActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-blue-500 mx-auto animate-bounce" />
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    در حال آپلود...
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    فایل‌ها را اینجا رها کنید یا{' '}
                    <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                      انتخاب کنید
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.zip,.rar"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    حداکثر ۱۰ مگابایت، انواع: تصویر، PDF، سند، صفحه گسترده، فایل فشرده
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Attachments List */}
      <div className="space-y-3">
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هیچ فایلی پیوست نشده</p>
            <p className="text-sm">فایل‌های خود را آپلود کنید</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <Card key={attachment.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(attachment.mime_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {attachment.original_name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getFileTypeLabel(attachment.mime_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(attachment.file_size)}</span>
                        <span>
                          آپلود شده توسط {attachment.uploaded_by.full_name || attachment.uploaded_by.username || 'کاربر ناشناس'}
                        </span>
                        <span>
                          {new Date(attachment.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {attachment.mime_type.startsWith('image/') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => previewAttachment(attachment)}
                        className="h-8 w-8 p-0"
                        title="پیش‌نمایش"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadAttachment(attachment)}
                      className="h-8 w-8 p-0"
                      title="دانلود"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {canDeleteAttachment(attachment) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAttachment(attachment.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
