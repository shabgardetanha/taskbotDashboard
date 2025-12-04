'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import { MessageCircle, Send, Edit, Trash2, Reply, MoreVertical } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  parent_id?: string
  author: {
    id: string
    full_name?: string
    username?: string
    avatar_url?: string
  }
  replies?: Comment[]
}

interface TaskCommentsProps {
  taskId: number
  className?: string
}

export function TaskComments({ taskId, className }: TaskCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [taskId])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      const data = await response.json()

      if (response.ok) {
        // Organize comments into threads
        const threadedComments = organizeComments(data)
        setComments(threadedComments)
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const organizeComments = (flatComments: any[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // First pass: create comment objects
    flatComments.forEach(comment => {
      const commentObj: Comment = {
        ...comment,
        replies: []
      }
      commentMap.set(comment.id, commentObj)
    })

    // Second pass: organize into threads
    flatComments.forEach(comment => {
      const commentObj = commentMap.get(comment.id)!
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(commentObj)
        }
      } else {
        rootComments.push(commentObj)
      }
    })

    return rootComments
  }

  const submitComment = async (content: string, parentId?: string) => {
    if (!content.trim() || !user) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          author_id: user.id,
          parent_id: parentId,
        }),
      })

      if (response.ok) {
        setNewComment('')
        setReplyTo(null)
        await loadComments()
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateComment = async (commentId: string, content: string) => {
    if (!content.trim() || !user) return

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          content: content.trim(),
          author_id: user.id,
        }),
      })

      if (response.ok) {
        setEditingComment(null)
        setEditContent('')
        await loadComments()
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!user || !confirm('آیا مطمئن هستید که می‌خواهید این کامنت را حذف کنید؟')) return

    try {
      const response = await fetch(
        `/api/tasks/${taskId}/comments?comment_id=${commentId}&author_id=${user.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        await loadComments()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const getInitials = (name?: string) => {
    if (!name) return '؟'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'همین الان'
    if (minutes < 60) return `${minutes} دقیقه پیش`
    if (hours < 24) return `${hours} ساعت پیش`
    if (days < 7) return `${days} روز پیش`

    return date.toLocaleDateString('fa-IR')
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'mr-12 mt-3' : 'mb-4'} relative`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatar_url} alt={comment.author.full_name} />
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author.full_name || comment.author.username || 'کاربر ناشناس'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
                {comment.updated_at !== comment.created_at && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    ویرایش شده
                  </Badge>
                )}
              </div>

              {user && comment.author.id === user.id && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(comment)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteComment(comment.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded text-sm resize-none dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateComment(comment.id, editContent)}
                    disabled={!editContent.trim()}
                  >
                    ذخیره
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    لغو
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>

          {!isReply && user && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplyTo(comment.id)}
              className="mt-1 text-xs h-6 px-2"
            >
              <Reply className="w-3 h-3 mr-1" />
              پاسخ
            </Button>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          کامنت‌ها ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          {replyTo && (
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                در حال پاسخ به کامنت
              </span>
              <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                لغو
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
              <AvatarFallback className="text-xs">
                {getInitials(user.user_metadata?.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? "پاسخ خود را بنویسید..." : "کامنت خود را بنویسید..."}
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />

              <div className="flex justify-end gap-2">
                {replyTo && (
                  <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                    لغو
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => submitComment(newComment, replyTo || undefined)}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    'در حال ارسال...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      {replyTo ? 'پاسخ' : 'ارسال'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هنوز کامنتی ثبت نشده</p>
            <p className="text-sm">اولین کامنت را شما بنویسید!</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}
