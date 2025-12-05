/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'

// API Integration Testing Suite
describe('API Integration Testing', () => {
  describe('Task Management Integration', () => {
    it('should create, read, update, and delete tasks end-to-end', async () => {
      // Test full CRUD cycle for tasks
      const testUserId = 'integration-test-user'

      // 1. Create a task
      const createResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': testUserId
        },
        body: JSON.stringify({
          title: 'Integration Test Task',
          description: 'Testing full CRUD cycle',
          priority: 'medium',
          status: 'todo'
        })
      })

      expect(createResponse.ok).toBe(true)
      const createdTask = await createResponse.json()
      expect(createdTask.id).toBeDefined()
      expect(createdTask.title).toBe('Integration Test Task')

      const taskId = createdTask.id

      // 2. Read the task
      const readResponse = await fetch(`/api/tasks/${taskId}`, {
        headers: { 'user-id': testUserId }
      })

      expect(readResponse.ok).toBe(true)
      const readTask = await readResponse.json()
      expect(readTask.id).toBe(taskId)
      expect(readTask.title).toBe('Integration Test Task')

      // 3. Update the task
      const updateResponse = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': testUserId
        },
        body: JSON.stringify({
          title: 'Updated Integration Test Task',
          status: 'inprogress'
        })
      })

      expect(updateResponse.ok).toBe(true)
      const updatedTask = await updateResponse.json()
      expect(updatedTask.title).toBe('Updated Integration Test Task')
      expect(updatedTask.status).toBe('inprogress')

      // 4. Delete the task
      const deleteResponse = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'user-id': testUserId }
      })

      expect(deleteResponse.ok).toBe(true)

      // 5. Verify deletion
      const verifyResponse = await fetch(`/api/tasks/${taskId}`, {
        headers: { 'user-id': testUserId }
      })

      expect(verifyResponse.status).toBe(404)
    })

    it('should handle task relationships correctly', async () => {
      // Test parent-child task relationships
      const testUserId = 'integration-test-user'

      // Create parent task
      const parentResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': testUserId
        },
        body: JSON.stringify({
          title: 'Parent Task',
          description: 'Main task with subtasks'
        })
      })

      expect(parentResponse.ok).toBe(true)
      const parentTask = await parentResponse.json()

      // Create subtask
      const subResponse = await fetch('/api/subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': testUserId
        },
        body: JSON.stringify({
          title: 'Subtask',
          parent_task_id: parentTask.id
        })
      })

      expect(subResponse.ok).toBe(true)
      const subTask = await subResponse.json()

      // Verify relationship in API response
      const tasksResponse = await fetch('/api/tasks', {
        headers: { 'user-id': testUserId }
      })

      expect(tasksResponse.ok).toBe(true)
      const tasks = await tasksResponse.json()
      const foundParent = tasks.find((t: any) => t.id === parentTask.id)

      expect(foundParent).toBeDefined()
      expect(foundParent.subtasks).toBeDefined()
      expect(foundParent.subtasks.length).toBeGreaterThan(0)
    })
  })

  describe('Workspace Integration', () => {
    it('should create workspace and manage members', async () => {
      const ownerId = 'workspace-owner'
      const memberId = 'workspace-member'

      // 1. Create workspace
      const workspaceResponse = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': ownerId
        },
        body: JSON.stringify({
          name: 'Integration Test Workspace',
          description: 'Testing workspace integration'
        })
      })

      expect(workspaceResponse.ok).toBe(true)
      const workspace = await workspaceResponse.json()

      // 2. Add member to workspace
      const addMemberResponse = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': ownerId
        },
        body: JSON.stringify({
          user_id: memberId,
          role: 'member',
          inviter_id: ownerId
        })
      })

      expect(addMemberResponse.ok).toBe(true)

      // 3. Verify member was added
      const membersResponse = await fetch(`/api/workspaces/${workspace.id}/members`, {
        headers: { 'user-id': ownerId }
      })

      expect(membersResponse.ok).toBe(true)
      const members = await membersResponse.json()
      expect(members.length).toBeGreaterThanOrEqual(2) // Owner + member

      // 4. List workspaces for member
      const userWorkspacesResponse = await fetch('/api/workspaces', {
        headers: { 'user-id': memberId }
      })

      expect(userWorkspacesResponse.ok).toBe(true)
      const userWorkspaces = await userWorkspacesResponse.json()
      expect(userWorkspaces.some((w: any) => w.id === workspace.id)).toBe(true)
    })

    it('should enforce workspace permissions', async () => {
      const ownerId = 'permission-owner'
      const unauthorizedUserId = 'unauthorized-user'

      // Create workspace as owner
      const workspaceResponse = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': ownerId
        },
        body: JSON.stringify({
          name: 'Permission Test Workspace'
        })
      })

      expect(workspaceResponse.ok).toBe(true)
      const workspace = await workspaceResponse.json()

      // Try to delete workspace as unauthorized user
      const deleteResponse = await fetch('/api/workspaces', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': unauthorizedUserId
        },
        body: JSON.stringify({ id: workspace.id })
      })

      expect(deleteResponse.status).toBe(403) // Forbidden

      // Verify workspace still exists
      const verifyResponse = await fetch(`/api/workspaces/${workspace.id}`, {
        headers: { 'user-id': ownerId }
      })

      expect(verifyResponse.ok).toBe(true)
    })
  })

  describe('Notification System Integration', () => {
    it('should create and manage notifications', async () => {
      const userId = 'notification-user'

      // Create a task (which should trigger notifications)
      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          title: 'Notification Test Task'
        })
      })

      expect(taskResponse.ok).toBe(true)

      // Check notifications
      const notificationsResponse = await fetch('/api/notifications', {
        headers: { 'user-id': userId }
      })

      expect(notificationsResponse.ok).toBe(true)
      const notifications = await notificationsResponse.json()
      expect(Array.isArray(notifications.notifications)).toBe(true)

      // Mark notification as read
      if (notifications.notifications.length > 0) {
        const notificationId = notifications.notifications[0].id

        const markReadResponse = await fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'user-id': userId
          },
          body: JSON.stringify({
            notification_ids: [notificationId],
            action: 'mark_read'
          })
        })

        expect(markReadResponse.ok).toBe(true)
      }
    })
  })

  describe('File Upload Integration', () => {
    it('should upload and manage task attachments', async () => {
      const userId = 'attachment-user'

      // Create a task first
      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          title: 'Attachment Test Task'
        })
      })

      expect(taskResponse.ok).toBe(true)
      const task = await taskResponse.json()

      // Create a test file (simulated)
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      // Upload attachment
      const formData = new FormData()
      formData.append('file', testFile)
      formData.append('uploaded_by', userId)

      const uploadResponse = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: 'POST',
        body: formData
      })

      expect(uploadResponse.status).toBeLessThan(500) // Should not crash

      // List attachments
      const listResponse = await fetch(`/api/tasks/${task.id}/attachments`, {
        headers: { 'user-id': userId }
      })

      expect(listResponse.ok).toBe(true)
      const attachments = await listResponse.json()
      expect(Array.isArray(attachments)).toBe(true)
    })
  })

  describe('Search Integration', () => {
    it('should search across tasks and workspaces', async () => {
      const userId = 'search-user'

      // Create test data
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          title: 'Unique Search Test Task',
          description: 'This task contains searchable content'
        })
      })

      // Search for the task
      const searchResponse = await fetch('/api/tasks/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          search_term: 'Unique Search Test'
        })
      })

      expect(searchResponse.ok).toBe(true)
      const searchResults = await searchResponse.json()
      expect(searchResults.tasks).toBeDefined()
      expect(Array.isArray(searchResults.tasks)).toBe(true)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      const userId = 'consistency-user'

      // Create workspace
      const workspaceResponse = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          name: 'Consistency Test Workspace'
        })
      })

      expect(workspaceResponse.ok).toBe(true)
      const workspace = await workspaceResponse.json()

      // Create task in workspace
      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          title: 'Consistency Test Task',
          workspace_id: workspace.id
        })
      })

      expect(taskResponse.ok).toBe(true)
      const task = await taskResponse.json()

      // Delete workspace
      const deleteWorkspaceResponse = await fetch('/api/workspaces', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({ id: workspace.id })
      })

      expect(deleteWorkspaceResponse.ok).toBe(true)

      // Verify task is also deleted (cascade delete)
      const verifyTaskResponse = await fetch(`/api/tasks/${task.id}`, {
        headers: { 'user-id': userId }
      })

      expect(verifyTaskResponse.status).toBe(404)
    })

    it('should handle concurrent operations safely', async () => {
      const userId = 'concurrency-user'
      const operationCount = 10

      // Perform multiple concurrent operations
      const promises = Array(operationCount).fill(null).map((_, i) =>
        fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': userId
          },
          body: JSON.stringify({
            title: `Concurrent Task ${i}`,
            description: `Created at ${Date.now()}`
          })
        })
      )

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.ok).length

      expect(successCount).toBe(operationCount) // All operations should succeed

      // Verify all tasks were created
      const listResponse = await fetch('/api/tasks', {
        headers: { 'user-id': userId }
      })

      expect(listResponse.ok).toBe(true)
      const tasks = await listResponse.json()
      expect(tasks.length).toBeGreaterThanOrEqual(operationCount)
    })
  })

  describe('Cross-Service Integration', () => {
    it('should integrate tasks with notifications', async () => {
      const userId = 'integration-user'

      // Create a task
      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          title: 'Integration Test Task',
          description: 'Testing cross-service integration'
        })
      })

      expect(taskResponse.ok).toBe(true)
      const task = await taskResponse.json()

      // Check if notification was created
      const notificationsResponse = await fetch('/api/notifications', {
        headers: { 'user-id': userId }
      })

      expect(notificationsResponse.ok).toBe(true)
      const notifications = await notificationsResponse.json()

      // Should have at least one notification about task creation
      const taskNotifications = notifications.notifications.filter((n: any) =>
        n.task?.id === task.id || n.data?.task_id === task.id
      )

      expect(taskNotifications.length).toBeGreaterThan(0)
    })

    it('should integrate with Telegram bot', async () => {
      // Test Telegram webhook integration
      const telegramUpdate = {
        update_id: 123456,
        message: {
          message_id: 1,
          from: {
            id: 12345,
            first_name: 'Test',
            username: 'testuser'
          },
          chat: {
            id: 12345,
            type: 'private'
          },
          date: Math.floor(Date.now() / 1000),
          text: '/start'
        }
      }

      const telegramResponse = await fetch('/api/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telegramUpdate)
      })

      expect(telegramResponse.ok).toBe(true)
      const responseText = await telegramResponse.text()
      expect(responseText).toBe('OK')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network failures gracefully', async () => {
      // Test with invalid endpoints
      const invalidResponse = await fetch('/api/nonexistent-endpoint')
      expect(invalidResponse.status).toBe(404)
    })

    it('should validate request data', async () => {
      // Test with invalid data
      const invalidResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': 'test-user'
        },
        body: JSON.stringify({
          // Missing required title
          description: 'Invalid task data'
        })
      })

      expect(invalidResponse.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle database errors appropriately', async () => {
      // Test with malformed IDs
      const malformedResponse = await fetch('/api/tasks/invalid-id', {
        headers: { 'user-id': 'test-user' }
      })

      expect(malformedResponse.status).toBeLessThan(500) // Should not be server error
    })
  })
})
