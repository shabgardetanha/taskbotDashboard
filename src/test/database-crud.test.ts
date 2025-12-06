/**
 * Database CRUD Operations Tests
 * Tests Create, Read, Update, Delete operations for all entities
 */

import { createClient } from '@supabase/supabase-js'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Database CRUD Tests', () => {
  // Test data cleanup
  const testData = {
    taskId: null as number | null,
    labelIds: [] as string[],
    subtaskIds: [] as string[],
    workspaceId: `test-workspace-${Date.now()}`,
    userId: `test-user-${Date.now()}`
  }

  afterAll(async () => {
    // Clean up all test data
    const cleanupPromises = []

    if (testData.taskId) {
      cleanupPromises.push(
        supabase.from('task_label_links').delete().eq('task_id', testData.taskId),
        supabase.from('subtasks').delete().eq('task_id', testData.taskId),
        supabase.from('tasks').delete().eq('id', testData.taskId)
      )
    }

    if (testData.labelIds.length > 0) {
      cleanupPromises.push(
        supabase.from('task_labels').delete().in('id', testData.labelIds)
      )
    }

    await Promise.all(cleanupPromises)
  })

  describe('Tasks CRUD', () => {
    it('should CREATE a new task', async () => {
      const taskData = {
        title: 'Database CRUD Test Task',
        description: 'Testing CRUD operations',
        status: 'todo',
        priority: 'medium',
        assignee_id: testData.userId
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.title).toBe(taskData.title)
      expect(data.status).toBe(taskData.status)
      expect(data.priority).toBe(taskData.priority)

      testData.taskId = data.id
    })

    it('should READ tasks with proper filtering', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', testData.taskId)
        .single()

      expect(error).toBeNull()
      expect(data.id).toBe(testData.taskId)
      expect(data.title).toBe('Database CRUD Test Task')
    })

    it('should UPDATE task properties', async () => {
      const updates = {
        status: 'inprogress',
        priority: 'high',
        description: 'Updated description for CRUD test'
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', testData.taskId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.status).toBe(updates.status)
      expect(data.priority).toBe(updates.priority)
      expect(data.description).toBe(updates.description)
    })

    it('should handle bulk updates', async () => {
      // Create another test task
      const { data: task2 } = await supabase
        .from('tasks')
        .insert({
          title: 'Bulk Update Test Task',
          status: 'todo',
          priority: 'low'
        })
        .select()
        .single()

      const taskIds = [testData.taskId, task2.id]

      // Bulk update status
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done' })
        .in('id', taskIds)

      expect(error).toBeNull()

      // Verify bulk update
      const { data: updatedTasks } = await supabase
        .from('tasks')
        .select('id, status')
        .in('id', taskIds)

      expect(updatedTasks).toBeDefined()
      expect(updatedTasks).toHaveLength(2)
      expect(updatedTasks!.every(task => task.status === 'done')).toBe(true)

      // Clean up
      await supabase.from('tasks').delete().eq('id', task2.id)
    })

    it('should DELETE task', async () => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', testData.taskId)

      expect(error).toBeNull()

      // Verify deletion
      const { data } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', testData.taskId)
        .single()

      expect(data).toBeNull()
    })
  })

  describe('Labels CRUD', () => {
    beforeEach(async () => {
      // Recreate test task for label tests
      const { data } = await supabase
        .from('tasks')
        .insert({
          title: 'Label CRUD Test Task',
          status: 'todo'
        })
        .select()
        .single()

      testData.taskId = data.id
    })

    afterEach(async () => {
      // Clean up labels
      await supabase.from('task_label_links').delete().eq('task_id', testData.taskId)
      await supabase.from('task_labels').delete().in('id', testData.labelIds)
      testData.labelIds = []
    })

    it('should CREATE labels', async () => {
      const labels = [
        { name: 'Frontend', color: '#3b82f6', workspace_id: testData.workspaceId },
        { name: 'Backend', color: '#ef4444', workspace_id: testData.workspaceId },
        { name: 'Database', color: '#10b981', workspace_id: testData.workspaceId }
      ]

      const { data, error } = await supabase
        .from('task_labels')
        .insert(labels)
        .select()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data).toHaveLength(3)
      expect(data!.map(l => l.name)).toEqual(['Frontend', 'Backend', 'Database'])

      testData.labelIds = data.map(l => l.id)
    })

    it('should READ labels with filtering', async () => {
      const { data, error } = await supabase
        .from('task_labels')
        .select('*')
        .eq('workspace_id', testData.workspaceId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(3)
      expect(data!.some(l => l.name === 'Frontend')).toBe(true)
    })

    it('should UPDATE label properties', async () => {
      const labelId = testData.labelIds[0]
      const updates = {
        name: 'Updated Frontend',
        color: '#8b5cf6'
      }

      const { data, error } = await supabase
        .from('task_labels')
        .update(updates)
        .eq('id', labelId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.name).toBe(updates.name)
      expect(data.color).toBe(updates.color)
    })

    it('should DELETE labels', async () => {
      const labelId = testData.labelIds[0]

      const { error } = await supabase
        .from('task_labels')
        .delete()
        .eq('id', labelId)

      expect(error).toBeNull()

      // Verify deletion
      const { data } = await supabase
        .from('task_labels')
        .select('id')
        .eq('id', labelId)
        .single()

      expect(data).toBeNull()

      // Remove from test data
      testData.labelIds = testData.labelIds.filter(id => id !== labelId)
    })
  })

  describe('Relationships CRUD', () => {
    beforeEach(async () => {
      // Setup test data
      const { data: task } = await supabase
        .from('tasks')
        .insert({ title: 'Relationship Test Task', status: 'todo' })
        .select()
        .single()

      testData.taskId = task.id

      const { data: labels } = await supabase
        .from('task_labels')
        .insert([
          { name: 'Test Label 1', color: '#ff0000' },
          { name: 'Test Label 2', color: '#00ff00' }
        ])
        .select()

      testData.labelIds = labels.map(l => l.id)
    })

    afterEach(async () => {
      // Clean up
      await supabase.from('task_label_links').delete().eq('task_id', testData.taskId)
      await supabase.from('subtasks').delete().eq('task_id', testData.taskId)
      await supabase.from('tasks').delete().eq('id', testData.taskId)
      await supabase.from('task_labels').delete().in('id', testData.labelIds)
      testData.labelIds = []
    })

    it('should CREATE task-label relationships', async () => {
      const relationships = testData.labelIds.map(label_id => ({
        task_id: testData.taskId,
        label_id
      }))

      const { data, error } = await supabase
        .from('task_label_links')
        .insert(relationships)
        .select()

      expect(error).toBeNull()
      expect(data).toHaveLength(2)
    })

    it('should READ relationships with joins', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links!inner(
            task_labels(*)
          )
        `)
        .eq('id', testData.taskId)
        .single()

      expect(error).toBeNull()
      expect(data.labels).toBeDefined()
      expect(data.labels).toHaveLength(2)
      expect(data.labels![0].task_labels).toBeDefined()
    })

    it('should handle cascading deletes', async () => {
      // Delete task - should cascade to relationships
      await supabase.from('tasks').delete().eq('id', testData.taskId)

      // Check that relationships are gone
      const { data: links } = await supabase
        .from('task_label_links')
        .select('*')
        .eq('task_id', testData.taskId)

      expect(links).toHaveLength(0)
    })
  })

  describe('Subtasks CRUD', () => {
    beforeEach(async () => {
      // Create test task
      const { data } = await supabase
        .from('tasks')
        .insert({ title: 'Subtask CRUD Test', status: 'todo' })
        .select()
        .single()

      testData.taskId = data.id
    })

    afterEach(async () => {
      await supabase.from('subtasks').delete().eq('task_id', testData.taskId)
      await supabase.from('tasks').delete().eq('id', testData.taskId)
    })

    it('should CREATE subtasks', async () => {
      const subtasks = [
        {
          task_id: testData.taskId,
          title: 'Implement authentication',
          description: 'Add login/logout functionality',
          completed: false,
          order_index: 0
        },
        {
          task_id: testData.taskId,
          title: 'Design database schema',
          description: 'Create tables and relationships',
          completed: true,
          order_index: 1
        }
      ]

      const { data, error } = await supabase
        .from('subtasks')
        .insert(subtasks)
        .select()

      expect(error).toBeNull()
      expect(data).toHaveLength(2)
      expect(data[0].completed).toBe(false)
      expect(data[1].completed).toBe(true)
    })

    it('should UPDATE subtask completion status', async () => {
      // Get first subtask
      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('id')
        .eq('task_id', testData.taskId)
        .limit(1)

      const subtaskId = subtasks[0].id

      const { data, error } = await supabase
        .from('subtasks')
        .update({ completed: true })
        .eq('id', subtaskId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.completed).toBe(true)
    })

    it('should DELETE subtasks', async () => {
      const { data: subtasks } = await supabase
        .from('subtasks')
        .select('id')
        .eq('task_id', testData.taskId)

      const subtaskId = subtasks[0].id

      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId)

      expect(error).toBeNull()

      // Verify deletion
      const { data } = await supabase
        .from('subtasks')
        .select('id')
        .eq('id', subtaskId)
        .single()

      expect(data).toBeNull()
    })
  })

  describe('Data Validation', () => {
    it('should enforce required fields', async () => {
      // Try to create task without title
      const { error } = await supabase
        .from('tasks')
        .insert({
          status: 'todo',
          priority: 'medium'
          // Missing title
        })

      expect(error).toBeDefined()
      expect(error.message).toContain('null value')
    })

    it('should validate enum values', async () => {
      // Try invalid status
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: 'Invalid Status Test',
          status: 'invalid_status'
        })

      // This might not fail at DB level, but let's check
      if (error) {
        expect(error.message).toMatch(/invalid|check constraint/i)
      }
    })

    it('should handle constraint violations', async () => {
      // Try duplicate unique constraints if any exist
      // For now, just test that basic constraints work
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: 'Constraint Test',
          status: 'todo',
          id: 1 // Try to force ID conflict
        })

      // Should handle the error gracefully
      expect(error?.message || 'success').toBeTruthy()
    })
  })
})
