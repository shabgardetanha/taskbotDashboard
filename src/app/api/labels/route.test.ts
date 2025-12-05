/// <reference types="vitest/globals" />
import { vi, beforeEach } from 'vitest'

// Mock Supabase
const mockCreateClient = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient.mockReturnValue({
    from: mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq
      })
    })
  })
}))

// Mock NextRequest and NextResponse
const mockJson = vi.fn()
const mockNextResponse = {
  json: mockJson
}

vi.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: mockNextResponse
}))

describe('Labels API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSupabaseClient', () => {
    it('should throw error when SUPABASE_URL is missing', () => {
      // Temporarily remove env vars
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      // Import the module to trigger the client creation
      expect(() => {
        // This would normally be called inside the route handler
        const { getSupabaseClient } = require('./route')
        getSupabaseClient()
      }).toThrow('Supabase configuration missing')

      // Restore env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
    })

    it('should create client when env vars are available', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'test-url'
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

      const { getSupabaseClient } = require('./route')
      const client = getSupabaseClient()

      expect(mockCreateClient).toHaveBeenCalledWith('test-url', 'test-key')
      expect(client).toBeDefined()

      // Restore env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
    })
  })

  describe('GET /api/labels', () => {
    it('should return labels successfully', async () => {
      const mockLabels = [{ id: 1, name: 'Test Label' }]
      mockEq.mockResolvedValue({ data: mockLabels, error: null })

      const { GET } = require('./route')

      const mockRequest = {
        url: 'http://localhost:3000/api/labels'
      }

      await GET(mockRequest)

      expect(mockJson).toHaveBeenCalledWith(mockLabels)
    })

    it('should filter by workspace_id', async () => {
      const mockLabels = [{ id: 1, name: 'Workspace Label' }]
      mockEq.mockResolvedValue({ data: mockLabels, error: null })

      const { GET } = require('./route')

      const mockRequest = {
        url: 'http://localhost:3000/api/labels?workspace_id=123'
      }

      await GET(mockRequest)

      expect(mockEq).toHaveBeenCalledWith('workspace_id', '123')
      expect(mockJson).toHaveBeenCalledWith(mockLabels)
    })

    it('should handle database errors', async () => {
      const mockError = { message: 'Database connection failed' }
      mockEq.mockResolvedValue({ data: null, error: mockError })

      const { GET } = require('./route')

      const mockRequest = {
        url: 'http://localhost:3000/api/labels'
      }

      await GET(mockRequest)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    })
  })

  describe('POST /api/labels', () => {
    it('should create label successfully', async () => {
      const newLabel = { id: 1, name: 'New Label', color: '#ff0000' }
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: newLabel, error: null })
        })
      })

      mockFrom.mockReturnValue({
        insert: mockInsert
      })

      const { POST } = require('./route')

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'New Label',
          color: '#ff0000',
          workspace_id: 123
        })
      }

      await POST(mockRequest)

      expect(mockJson).toHaveBeenCalledWith(newLabel, { status: 201 })
    })

    it('should validate required name field', async () => {
      const { POST } = require('./route')

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          color: '#ff0000'
        })
      }

      await POST(mockRequest)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Label name is required' },
        { status: 400 }
      )
    })

    it('should handle creation errors', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Unique constraint violated' }
          })
        })
      })

      mockFrom.mockReturnValue({
        insert: mockInsert
      })

      const { POST } = require('./route')

      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          name: 'Duplicate Label'
        })
      }

      await POST(mockRequest)

      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Unique constraint violated' },
        { status: 500 }
      )
    })
  })
})
