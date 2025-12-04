'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  MessageCircle,
  Users,
  AlertCircle,
  Clock
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface Notification {
  id: string
  type: 'task_assigned' | 'task_due' | 'comment_mention' | 'workspace_invite' | 'task_updated'
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
  workspace?: {
    id: string
    name: string
  }
  task?: {
    id: number
    title: string
  }
}

interface NotificationsDropdownProps {
  className?: string
}

export function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/notifications?user_id=${user.id}&limit=10`)
      const data = await response.json()

      if (response.ok) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_ids: notificationIds,
          user_id: user.id,
          action: 'mark_read',
        }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    await markAsRead(unreadIds)
  }

  const deleteNotification = async (notificationId: string) => {
    if (!user) return

    try {
      const response = await fetch(
        `/api/notifications?user_id=${user.id}&notification_id=${notificationId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        // Update unread count if deleted notification was unread
        const deleted = notifications.find(n => n.id === notificationId)
        if (deleted && !deleted.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return <Users className="w-4 h-4 text-blue-500" />
      case 'task_due': return <Clock className="w-4 h-4 text-red-500" />
      case 'comment_mention': return <MessageCircle className="w-4 h-4 text-green-500" />
      case 'workspace_invite': return <Users className="w-4 h-4 text-purple-500" />
      case 'task_updated': return <AlertCircle className="w-4 h-4 text-orange-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
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

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead([notification.id])
    }

    // Navigate to relevant page based on notification type
    if (notification.task) {
      // Navigate to task detail
      window.location.href = `/dashboard/tasks/${notification.task.id}`
    } else if (notification.workspace) {
      // Navigate to workspace
      window.location.href = `/dashboard/workspaces/${notification.workspace.id}`
    }

    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <Card className="absolute top-full left-0 mt-2 w-96 z-50 shadow-xl border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                اعلان‌ها
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="mr-2 text-xs">
                    {unreadCount} خوانده نشده
                  </Badge>
                )}
              </h3>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={markAllAsRead}
                  className="text-xs h-7"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  همه خوانده شده
                </Button>
              )}
            </div>
          </div>

          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>اعلانی وجود ندارد</p>
                <p className="text-sm">اعلان‌های جدید اینجا نمایش داده می‌شود</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            {(notification.workspace || notification.task) && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                {notification.workspace && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {notification.workspace.name}
                                  </span>
                                )}
                                {notification.task && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {notification.task.title}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead([notification.id])
                              }}
                              className="h-6 text-xs"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              خوانده شد
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => window.location.href = '/dashboard/notifications'}
                >
                  مشاهده همه اعلان‌ها
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
