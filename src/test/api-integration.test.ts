// src/test/api-integration.test.ts - API Integration Tests
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { TestDataFactory, MockUtils, AssertionHelpers, EnvironmentUtils } from './test-helpers'
import { createClient } from '@supabase/supabase-js'

// Mock fetch for API tests
global.fetch = vi.fn()

describe('API Integration Tests', () => {
  const baseUrl = 'http://localhost:3000'
  let supabase: any

  beforeAll(() => {
    EnvironmentUtils.setTestEnv()
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Task API Routes', () => {
    it('GET /api/tasks - should return tasks list', async () => {
      const mockTasks = [
        TestDataFactory.createTask(),
        TestDataFactory.createTask()
      ]

      // Mock Supabase response
      const mockSupabase = MockUtils.mockSupabaseClient()
      mockSupabase.select.mockResolvedValue(MockUtils.mockApiResponse(mockTasks))

      // Mock the API call
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTasks
      })

      const response = await fetch(`${baseUrl}/api/tasks`)
      const data = await AssertionHelpers.expectApiResponse(response)

      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('title')
    })

    it('POST /api/tasks - should create new task', async () => {
      const newTask = TestDataFactory.createTask({
        title: 'Integration Test Task',
        status: 'todo'
      })

      const mockSupabase = MockUtils.mockSupabaseClient()
      mockSupabase.insert.mockResolvedValue(MockUtils.mockApiResponse(newTask))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => newTask
      })

      const response = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          workspace_id: newTask.workspace_id,
          priority: newTask.priority
        })
      })

      const data = await AssertionHelpers.expectApiResponse(response, 201)
      expect(data.title).toBe(newTask.title)
      expect(data.status).toBe('todo')
    })

    it('GET /api/tasks/[id] - should return specific task', async () => {
      const task = TestDataFactory.createTask()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => task
      })

      const response = await fetch(`${baseUrl}/api/tasks/${task.id}`)
      const data = await AssertionHelpers.expectApiResponse(response)

      expect(data.id).toBe(task.id)
      expect(data.title).toBe(task.title)
    })

    it('PUT /api/tasks/[id] - should update task', async () => {
      const task = TestDataFactory.createTask()
      const updates = { title: 'Updated Task Title' }

      const updatedTask = { ...task, ...updates }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedTask
      })

      const response = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await AssertionHelpers.expectApiResponse(response)
      expect(data.title).toBe(updates.title)
    })

    it('DELETE /api/tasks/[id] - should delete task', async () => {
      const task = TestDataFactory.createTask()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const response = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
        method: 'DELETE'
      })

      expect(response.status).toBe(204)
    })
  })

  describe('Workspace API Routes', () => {
    it('GET /api/workspaces - should return workspaces', async () => {
      const mockWorkspaces = [
        TestDataFactory.createWorkspace(),
        TestDataFactory.createWorkspace()
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockWorkspaces
      })

      const response = await fetch(`${baseUrl}/api/workspaces`)
      const data = await AssertionHelpers.expectApiResponse(response)

      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
    })

    it('POST /api/workspaces - should create workspace', async () => {
      const newWorkspace = TestDataFactory.createWorkspace({
        name: 'Integration Test Workspace'
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => newWorkspace
      })

      const response = await fetch(`${baseUrl}/api/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspace.name,
          description: newWorkspace.description
        })
      })

      const data = await AssertionHelpers.expectApiResponse(response, 201)
      expect(data.name).toBe(newWorkspace.name)
    })
  })

  describe('Task Templates API Routes', () => {
    it('GET /api/task-templates - should return templates', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Bug Report Template',
          template_data: { title: 'Bug: ', priority: 'high' }
        }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTemplates
      })

      const response = await fetch(`${baseUrl}/api/task-templates`)
      const data = await AssertionHelpers.expectApiResponse(response)

      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('template_data')
    })

    it('POST /api/task-templates - should create template', async () => {
      const templateData = {
        name: 'Feature Request Template',
        template_data: { title: 'Feature: ', priority: 'medium' },
        workspace_id: 'workspace-1',
        category: 'feature'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'template-2', ...templateData })
      })

      const response = await fetch(`${baseUrl}/api/task-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })

      const data = await AssertionHelpers.expectApiResponse(response, 201)
      expect(data.name).toBe(templateData.name)
      expect(data.template_data).toEqual(templateData.template_data)
    })
  })

  describe('Validation & Error Handling', () => {
    it('POST /api/tasks - should validate required fields', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Title and template_data are required' })
      })

      const response = await fetch(`${baseUrl}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
      const error = await response.json()
      expect(error.error).toContain('required')
    })

    it('GET /api/tasks/[id] - should handle not found', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Task not found' })
      })

      const response = await fetch(`${baseUrl}/api/tasks/non-existent-id`)
      expect(response.status).toBe(404)
    })

    it('should handle database errors gracefully', async () => {
      const mockSupabase = MockUtils.mockSupabaseClient()
      mockSupabase.select.mockResolvedValue(MockUtils.mockApiResponse(null, {
        code: 'PGRST116',
        message: 'Database connection error'
      }))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      const response = await fetch(`${baseUrl}/api/tasks`)
      expect(response.status).toBe(500)
    })
  })

  describe('Performance Tests', () => {
    it('API responses should be fast', async () => {
      const startTime = performance.now()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [TestDataFactory.createTask()]
      })

      await fetch(`${baseUrl}/api/tasks`)
      const duration = performance.now() - startTime

      // API should respond within 500ms (reasonable for integration test)
      expect(duration).toBeLessThan(500)
    })
  })
})
