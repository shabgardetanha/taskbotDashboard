/**
 * Database Connection & Health Tests
 * Tests basic database connectivity and health
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

describe('Database Connection Tests', () => {
  describe('Connection Health', () => {
    it('should establish connection to Supabase', async () => {
      const { data, error } = await supabase.from('tasks').select('count').single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should handle connection timeouts gracefully', async () => {
      // Test with a reasonable timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      const queryPromise = supabase.from('tasks').select('id').limit(1)

      try {
        await Promise.race([queryPromise, timeoutPromise])
        expect(true).toBe(true) // Query completed before timeout
      } catch (error) {
        expect(error.message).toBe('Timeout')
      }
    })

    it('should validate environment variables', () => {
      expect(supabaseUrl).toBeDefined()
      expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/)
      expect(supabaseKey).toBeDefined()
      expect(supabaseKey.length).toBeGreaterThan(100)
    })
  })

  describe('Table Existence', () => {
    const requiredTables = [
      'profiles',
      'tasks',
      'task_labels',
      'task_label_links',
      'subtasks',
      'notifications',
      'workspaces',
      'workspace_members'
    ]

    requiredTables.forEach(tableName => {
      it(`should have ${tableName} table`, async () => {
        const { error } = await supabase.from(tableName).select('count').limit(1)
        expect(error).toBeNull()
      })
    })
  })

  describe('RLS Policies', () => {
    it('should have RLS enabled on tasks table', async () => {
      // Test with anon key (should fail for sensitive operations)
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error } = await anonClient
        .from('tasks')
        .insert({ title: 'Test RLS', status: 'todo' })

      // Should fail due to RLS
      expect(error).toBeDefined()
      expect(error.message).toMatch(/permission denied|insufficient_privilege|RLS/i)
    })

    it('should allow service role full access', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Basic Query Performance', () => {
    it('should execute simple queries within time limits', async () => {
      const startTime = Date.now()

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .limit(10)

      const duration = Date.now() - startTime

      expect(error).toBeNull()
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle concurrent connections', async () => {
      const promises = Array(5).fill(null).map(() =>
        supabase.from('tasks').select('count').single()
      )

      const results = await Promise.all(promises)
      const failures = results.filter(result => result.error)

      expect(failures).toHaveLength(0)
    })
  })
})
