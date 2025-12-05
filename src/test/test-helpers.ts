// src/test/test-helpers.ts - Test utilities and helpers
import { vi } from 'vitest'

// Test data factories
export class TestDataFactory {
  static createTask(overrides: Partial<Task> = {}): Task {
    return {
      id: `task-${Date.now()}-${Math.random()}`,
      title: `Test Task ${Date.now()}`,
      description: 'Test task description',
      status: 'todo',
      priority: 'medium',
      workspace_id: 'test-workspace',
      assignee_id: null,
      created_by: 'test-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: null,
      ...overrides
    }
  }

  static createWorkspace(overrides: Partial<Workspace> = {}): Workspace {
    return {
      id: `workspace-${Date.now()}`,
      name: 'Test Workspace',
      description: 'Test workspace description',
      owner_id: 'test-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    }
  }

  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: `user-${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      full_name: 'Test User',
      avatar_url: null,
      created_at: new Date().toISOString(),
      ...overrides
    }
  }
}

// Mock utilities
export class MockUtils {
  static mockSupabaseClient() {
    const mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      csv: vi.fn().mockResolvedValue({ data: null, error: null })
    }

    return mockClient
  }

  static mockApiResponse<T>(data: T, error: any = null) {
    return {
      data,
      error
    }
  }
}

// Environment utilities
export class EnvironmentUtils {
  static withCleanEnv<T>(fn: () => T | Promise<T>): T | Promise<T> {
    const originalEnv = { ...process.env }

    try {
      // Clear sensitive env vars for testing
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      delete process.env.TELEGRAM_BOT_TOKEN

      return fn()
    } finally {
      Object.assign(process.env, originalEnv)
    }
  }

  static setTestEnv() {
    ;(process.env as any).NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  }
}

// Assertion helpers
export class AssertionHelpers {
  static async expectApiResponse(response: Response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus)

    if (expectedStatus >= 200 && expectedStatus < 300) {
      const data = await response.json()
      expect(data).toBeDefined()
      return data
    }

    return null
  }

  static expectValidationError(error: any, field?: string) {
    expect(error).toBeDefined()
    if (field) {
      expect(error.message).toContain(field)
    }
  }

  static expectDatabaseError(error: any) {
    expect(error).toBeDefined()
    expect(error.code).toMatch(/^[0-9A-Z_]+$/)
  }
}

// Performance testing helpers
export class PerformanceHelpers {
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    return { result, duration }
  }

  static expectPerformance(duration: number, maxMs: number) {
    expect(duration).toBeLessThan(maxMs)
  }
}

// Type definitions
interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'inprogress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  workspace_id: string
  assignee_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  due_date: string | null
}

interface Workspace {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}
