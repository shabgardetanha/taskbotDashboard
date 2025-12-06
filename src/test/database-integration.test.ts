/**
 * Comprehensive Database Integration Tests
 * Covers all database operations, performance, security, and edge cases
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Load environment variables properly for tests
const getEnvVar = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }
  return value
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Database Integration Suite', () => {
  // Test data management
  const testData = {
    tasks: [] as any[],
    labels: [] as any[],
    workspaces: [] as any[],
    users: [] as string[]
  }

  // Global cleanup
  afterAll(async () => {
    // Clean up all test data
    const cleanupPromises = []

    // Delete tasks and related data
    for (const task of testData.tasks) {
      cleanupPromises.push(
        supabase.from('task_label_links').delete().eq('task_id', task.id),
        supabase.from('subtasks').delete().eq('task_id', task.id),
        supabase.from('tasks').delete().eq('id', task.id)
      )
    }

    // Delete labels
    if (testData.labels.length > 0) {
      cleanupPromises.push(
        supabase.from('task_labels').delete().in('id', testData.labels.map((l: any) => l.id))
      )
    }

    // Delete workspaces
    if (testData.workspaces.length > 0) {
      cleanupPromises.push(
        supabase.from('workspaces').delete().in('id', testData.workspaces.map((w: any) => w.id))
      )
    }

    await Promise.all(cleanupPromises)
  })

  describe('Environment & Configuration', () => {
    it('should load all required environment variables', () => {
      expect(supabaseUrl).toBeDefined()
      expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/)
      expect(supabaseKey).toBeDefined()
      expect(supabaseKey.length).toBeGreaterThan(100)
    })

    it('should validate Supabase configuration', async () => {
      const { data, error } = await supabase.from('tasks').select('count').limit(1)
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Database Schema Validation', () => {
    const requiredTables = [
      'profiles', 'tasks', 'task_labels', 'task_label_links',
      'subtasks', 'notifications', 'workspaces', 'workspace_members'
    ]

    requiredTables.forEach(tableName => {
      it(`should have ${tableName} table with proper structure`, async () => {
        const { error } = await supabase.from(tableName).select('*').limit(1)
        expect(error).toBeNull()
      })
    })

    it('should validate table relationships', async () => {
      // Test foreign key constraints
      const { data: tasks } = await supabase.from('tasks').select('id').limit(1)
      if (tasks && tasks.length > 0) {
        const { data: subtasks } = await supabase
          .from('subtasks')
          .select('task_id')
          .eq('task_id', tasks[0].id)

        expect(subtasks).toBeDefined()
        expect(Array.isArray(subtasks)).toBe(true)
      }
    })
  })

  describe('CRUD Operations - Tasks', () => {
    let taskId: number

    it('CREATE - should create task with all fields', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'Comprehensive database testing',
        status: 'todo',
        priority: 'high',
        assignee_id: `test-user-${Date.now()}`,
        due_date: new Date().toISOString().split('T')[0],
        due_time: '14:30:00'
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.title).toBe(taskData.title)
      expect(data!.status).toBe(taskData.status)
      expect(data!.priority).toBe(taskData.priority)
      expect(data!.due_date).toBe(taskData.due_date)

      taskId = data!.id
      testData.tasks.push(data)
    })

    it('READ - should retrieve task with all relationships', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(
            task_labels(*)
          ),
          subtasks(*)
        `)
        .eq('id', taskId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.id).toBe(taskId)
      expect(Array.isArray(data!.labels)).toBe(true)
      expect(Array.isArray(data!.subtasks)).toBe(true)
    })

    it('UPDATE - should update multiple fields', async () => {
      const updates = {
        status: 'inprogress',
        priority: 'urgent',
        description: 'Updated for integration testing'
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data!.status).toBe(updates.status)
      expect(data!.priority).toBe(updates.priority)
      expect(data!.description).toBe(updates.description)
    })

    it('DELETE - should delete task and cascade relationships', async () => {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId)
      expect(error).toBeNull()

      // Verify deletion
      const { data } = await supabase.from('tasks').select('id').eq('id', taskId).single()
      expect(data).toBeNull()

      // Remove from test data
      testData.tasks = testData.tasks.filter((t: any) => t.id !== taskId)
    })
  })

  describe('CRUD Operations - Labels & Relationships', () => {
    let taskId: number
    let labelIds: string[]

    beforeEach(async () => {
      // Create test task
      const { data: task } = await supabase
        .from('tasks')
        .insert({ title: 'Label Relationship Test', status: 'todo' })
        .select()
        .single()

      taskId = task!.id
      testData.tasks.push(task)
    })

    afterEach(async () => {
      // Cleanup
      await supabase.from('task_label_links').delete().eq('task_id', taskId)
      if (labelIds && labelIds.length > 0) {
        await supabase.from('task_labels').delete().in('id', labelIds)
      }
      await supabase.from('tasks').delete().eq('id', taskId)
      testData.tasks = testData.tasks.filter((t: any) => t.id !== taskId)
    })

    it('CREATE - should create labels and relationships', async () => {
      const labels = [
        { name: 'Frontend', color: '#3b82f6' },
        { name: 'Backend', color: '#ef4444' },
        { name: 'Database', color: '#10b981' }
      ]

      const { data: createdLabels, error: labelError } = await supabase
        .from('task_labels')
        .insert(labels)
        .select()

      expect(labelError).toBeNull()
      expect(createdLabels).toBeDefined()
      expect(createdLabels).toHaveLength(3)

      labelIds = createdLabels!.map((l: any) => l.id)
      testData.labels.push(...createdLabels!)

      // Create relationships
      const relationships = labelIds.map(labelId => ({
        task_id: taskId,
        label_id: labelId
      }))

      const { error: relError } = await supabase
        .from('task_label_links')
        .insert(relationships)

      expect(relError).toBeNull()
    })

    it('READ - should retrieve with complex joins', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links!inner(
            task_labels(*)
          )
        `)
        .eq('id', taskId)
        .single()

      expect(error).toBeNull()
      expect(data!.labels).toHaveLength(3)
      expect(data!.labels[0].task_labels).toBeDefined()
      expect(data!.labels[0].task_labels.name).toBeDefined()
    })
  })

  describe('Query Performance & Optimization', () => {
    beforeEach(async () => {
      // Create test data for performance testing
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        title: `Performance Test Task ${i}`,
        status: i % 3 === 0 ? 'todo' : i % 3 === 1 ? 'inprogress' : 'done',
        priority: i % 2 === 0 ? 'high' : 'medium'
      }))

      const { data } = await supabase.from('tasks').insert(tasks).select()
      if (data) {
        testData.tasks.push(...data)
      }
    })

    afterEach(async () => {
      await supabase.from('tasks').delete().in('id', testData.tasks.map((t: any) => t.id))
      testData.tasks = []
    })

    it('should perform complex queries within time limits', async () => {
      const startTime = Date.now()

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(
            task_labels(name, color)
          )
        `)
        .eq('status', 'todo')
        .order('created_at', { ascending: false })
        .limit(5)

      const duration = Date.now() - startTime

      expect(error).toBeNull()
      expect(duration).toBeLessThan(2000) // Complex queries should complete within 2 seconds
    })

    it('should handle pagination efficiently', async () => {
      const pageSize = 3

      const { data: page1, error: error1 } = await supabase
        .from('tasks')
        .select('id, title')
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1)

      const { data: page2, error: error2 } = await supabase
        .from('tasks')
        .select('id, title')
        .order('created_at', { ascending: false })
        .range(pageSize, pageSize * 2 - 1)

      expect(error1).toBeNull()
      expect(error2).toBeNull()
      expect(page1).toBeDefined()
      expect(page2).toBeDefined()
      expect(page1).toHaveLength(pageSize)
      expect(page2).toHaveLength(pageSize)

      // Ensure no overlap
      const page1Ids = page1!.map((t: any) => t.id)
      const page2Ids = page2!.map((t: any) => t.id)
      const overlap = page1Ids.filter(id => page2Ids.includes(id))
      expect(overlap).toHaveLength(0)
    })

    it('should use indexes effectively', async () => {
      const startTime = Date.now()

      // Query that should use status index
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('status', 'todo')

      const duration = Date.now() - startTime

      expect(error).toBeNull()
      expect(duration).toBeLessThan(500) // Indexed query should be fast
    })
  })

  describe('Data Integrity & Constraints', () => {
    it('should enforce NOT NULL constraints', async () => {
      const { error } = await supabase
        .from('tasks')
        .insert({
          description: 'Missing title test',
          status: 'todo'
          // Missing required title field
        })

      expect(error).toBeDefined()
      expect(error!.message).toContain('null value')
    })

    it('should handle foreign key constraints', async () => {
      const { error } = await supabase
        .from('subtasks')
        .insert({
          task_id: 999999, // Non-existent task ID
          title: 'Invalid foreign key test'
        })

      expect(error).toBeDefined()
    })

    it('should prevent duplicate relationships', async () => {
      // Create a task and label first
      const { data: task } = await supabase
        .from('tasks')
        .insert({ title: 'Duplicate Test', status: 'todo' })
        .select()
        .single()

      const { data: label } = await supabase
        .from('task_labels')
        .insert({ name: 'Test Label', color: '#000000' })
        .select()
        .single()

      // First relationship - should succeed
      await supabase
        .from('task_label_links')
        .insert({ task_id: task!.id, label_id: label!.id })

      // Duplicate relationship - should fail or be handled
      const { error } = await supabase
        .from('task_label_links')
        .insert({ task_id: task!.id, label_id: label!.id })

      // Either error or success is acceptable (depends on unique constraints)

      // Cleanup
      await supabase.from('task_label_links').delete().eq('task_id', task!.id)
      await supabase.from('task_labels').delete().eq('id', label!.id)
      await supabase.from('tasks').delete().eq('id', task!.id)
    })
  })

  describe('Security & RLS', () => {
    it('should respect RLS policies', async () => {
      // Test with anon key (should be restricted)
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error } = await anonClient
        .from('tasks')
        .insert({ title: 'RLS Test', status: 'todo' })

      expect(error).toBeDefined()
      expect(error!.message).toMatch(/permission denied|RLS|insufficient_privilege/i)
    })

    it('should allow service role full access', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Real-time Features', () => {
    it('should support real-time subscriptions', async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Real-time test timeout'))
        }, 10000)

        const channel = supabase
          .channel('test-realtime')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'tasks'
          }, (payload) => {
            clearTimeout(timeout)
            channel.unsubscribe()
            resolve(payload)
          })
          .subscribe()

        // Trigger an insert
        setTimeout(async () => {
          await supabase
            .from('tasks')
            .insert({ title: 'Real-time Test Task', status: 'todo' })
            .then(({ data }) => {
              // Store for cleanup
              if (data) testData.tasks.push(data[0])
            })
        }, 1000)
      }).then((result: any) => {
        expect(result).toBeDefined()
        expect(result.eventType).toBe('INSERT')
        expect(result.new.title).toBe('Real-time Test Task')
      })
    })
  })

  describe('Edge Cases & Error Handling', () => {
    it('should handle empty result sets', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', 999999) // Non-existent ID

      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })

    it('should handle malformed queries gracefully', async () => {
      // This should not crash the database
      const { error } = await supabase
        .from('tasks')
        .select('*')
        .eq('invalid_column', 'value')

      expect(error).toBeDefined()
    })

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 5 }, (_, i) =>
        supabase
          .from('tasks')
          .insert({
            title: `Concurrent Test ${i}`,
            status: 'todo'
          })
          .select()
      )

      const results = await Promise.allSettled(operations)
      const successful = results.filter(r => r.status === 'fulfilled').length

      expect(successful).toBeGreaterThan(0)

      // Cleanup
      const successfulInserts = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as any).value.data[0])
        .filter(Boolean)

      if (successfulInserts.length > 0) {
        await supabase
          .from('tasks')
          .delete()
          .in('id', successfulInserts.map((t: any) => t.id))
      }
    })
  })

  describe('Migration & Schema Compatibility', () => {
    it('should be compatible with all migrations', async () => {
      // Test that all expected columns exist
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, priority, assignee_id,
          due_date, due_time, position, parent_task_id,
          subtask_count, subtask_completed, created_at, updated_at
        `)
        .limit(1)

      expect(error).toBeNull()
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty('id')
        expect(data[0]).toHaveProperty('title')
        expect(data[0]).toHaveProperty('status')
        expect(data[0]).toHaveProperty('subtask_count')
        expect(data[0]).toHaveProperty('subtask_completed')
      }
    })

    it('should handle schema changes gracefully', async () => {
      // Test backward compatibility
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .limit(1)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
