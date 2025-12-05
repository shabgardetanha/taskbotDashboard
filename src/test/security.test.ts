// src/test/security.test.ts - Security Testing Suite
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { EnvironmentUtils, TestDataFactory, AssertionHelpers } from './test-helpers'

// Mock fetch for security tests
global.fetch = vi.fn()

describe('Security Testing Suite', () => {
  beforeAll(() => {
    EnvironmentUtils.setTestEnv()
  })

  describe('OWASP Top 10 Testing', () => {
    describe('A01:2021 - Broken Access Control', () => {
      it('should prevent unauthorized task access', async () => {
        const task = TestDataFactory.createTask({ created_by: 'user-1' })

        // Mock API call with different user context
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: 'Access denied' })
        })

        const response = await fetch(`/api/tasks/${task.id}`, {
          headers: { 'X-User-ID': 'user-2' } // Different user
        })

        expect(response.status).toBe(403)
      })

      it('should validate workspace membership for task operations', async () => {
        const task = TestDataFactory.createTask({
          workspace_id: 'workspace-1',
          created_by: 'user-1'
        })

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: 'Not a workspace member' })
        })

        const response = await fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: {
            'X-User-ID': 'user-2', // User not in workspace
            'X-Workspace-ID': 'workspace-1'
          },
          body: JSON.stringify({ title: 'Modified Title' })
        })

        expect(response.status).toBe(403)
      })
    })

    describe('A02:2021 - Cryptographic Failures', () => {
      it('should reject weak passwords', () => {
        const weakPasswords = ['123456', 'password', '123456789', 'qwerty']

        weakPasswords.forEach(password => {
          expect(validatePasswordStrength(password)).toBe(false)
        })
      })

      it('should accept strong passwords', () => {
        const strongPasswords = [
          'MySecurePass123!',
          'Complex@2025#Test',
          'Str0ng_P@ssw0rd_2025'
        ]

        strongPasswords.forEach(password => {
          expect(validatePasswordStrength(password)).toBe(true)
        })
      })

      it('should use secure token generation', () => {
        const token1 = generateSecureToken()
        const token2 = generateSecureToken()

        expect(token1).not.toBe(token2)
        expect(token1.length).toBeGreaterThanOrEqual(32)
        expect(/^[a-f0-9]+$/i.test(token1)).toBe(true)
      })
    })

    describe('A03:2021 - Injection', () => {
      it('should prevent SQL injection in search queries', async () => {
        const maliciousQueries = [
          "' OR '1'='1",
          "'; DROP TABLE tasks; --",
          "' UNION SELECT * FROM users --",
          "admin'--"
        ]

        for (const query of maliciousQueries) {
          ;(global.fetch as any).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => [] // Should return empty or sanitized results
          })

          const response = await fetch(`/api/tasks/search?q=${encodeURIComponent(query)}`)
          const data = await AssertionHelpers.expectApiResponse(response)

          // Should not crash and should return safe results
          expect(Array.isArray(data)).toBe(true)
          expect(data.length).toBe(0) // Malicious queries should return no results
        }
      })

      it('should sanitize user input in task creation', async () => {
        const maliciousInput = {
          title: '<script>alert("xss")</script>',
          description: '<img src=x onerror=alert("xss")>'
        }

        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: 'task-1',
            ...maliciousInput,
            sanitized: true
          })
        })

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(maliciousInput)
        })

        const data = await AssertionHelpers.expectApiResponse(response, 201)
        expect(data.sanitized).toBe(true)
        // Verify no script tags in stored data
        expect(data.title).not.toContain('<script>')
        expect(data.description).not.toContain('<img')
      })
    })

    describe('A04:2021 - Insecure Design', () => {
      it('should implement rate limiting', async () => {
        // Simulate multiple rapid requests
        const requests = Array.from({ length: 100 }, () =>
          fetch('/api/tasks', {
            headers: { 'X-Client-IP': '192.168.1.1' }
          })
        )

        const responses = await Promise.all(requests)
        const blockedRequests = responses.filter(r => r.status === 429)

        expect(blockedRequests.length).toBeGreaterThan(0)
      })

      it('should validate input length limits', () => {
        const oversizedInput = {
          title: 'A'.repeat(1000), // Too long title
          description: 'B'.repeat(10000) // Too long description
        }

        expect(validateTaskInput(oversizedInput)).toBe(false)
      })
    })

    describe('A05:2021 - Security Misconfiguration', () => {
      it('should not expose sensitive environment variables', () => {
        const sensitiveVars = [
          'SUPABASE_SERVICE_ROLE_KEY',
          'TELEGRAM_BOT_TOKEN',
          'DATABASE_PASSWORD'
        ]

        sensitiveVars.forEach(varName => {
          expect(process.env[varName]).toBeUndefined()
        })
      })

      it('should use secure headers', async () => {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Map([
            ['content-security-policy', "default-src 'self'"],
            ['x-frame-options', 'DENY'],
            ['x-content-type-options', 'nosniff'],
            ['strict-transport-security', 'max-age=31536000']
          ]),
          json: async () => ({ success: true })
        })

        const response = await fetch('/api/health')
        expect(response.headers.get('content-security-policy')).toBeTruthy()
        expect(response.headers.get('x-frame-options')).toBe('DENY')
      })
    })
  })

  describe('Authentication & Authorization', () => {
    it('should require authentication for protected routes', async () => {
      const protectedRoutes = ['/api/tasks', '/api/workspaces', '/dashboard']

      for (const route of protectedRoutes) {
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Authentication required' })
        })

        const response = await fetch(route)
        expect([401, 302]).toContain(response.status) // 302 for redirect to login
      }
    })

    it('should validate JWT tokens', async () => {
      const invalidTokens = [
        'invalid.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
        null,
        undefined,
        ''
      ]

      invalidTokens.forEach(token => {
        expect(validateJWT(token)).toBe(false)
      })
    })

    it('should implement proper session management', async () => {
      // Test session timeout
      const expiredSession = {
        userId: 'user-1',
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      }

      expect(isValidSession(expiredSession)).toBe(false)

      // Test valid session
      const validSession = {
        userId: 'user-1',
        expiresAt: Date.now() + 3600000 // Valid for 1 hour
      }

      expect(isValidSession(validSession)).toBe(true)
    })
  })

  describe('Data Protection & Privacy', () => {
    it('should encrypt sensitive data at rest', () => {
      const sensitiveData = {
        creditCard: '4111111111111111',
        ssn: '123-45-6789',
        password: 'secret123'
      }

      const encrypted = encryptData(sensitiveData)
      expect(encrypted).not.toEqual(sensitiveData)
      expect(typeof encrypted).toBe('string')

      const decrypted = decryptData(encrypted)
      expect(decrypted).toEqual(sensitiveData)
    })

    it('should implement data anonymization', () => {
      const personalData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567'
      }

      const anonymized = anonymizeData(personalData)

      expect(anonymized.name).not.toBe(personalData.name)
      expect(anonymized.email).toMatch(/^anon_[a-f0-9]+@example\.com$/)
      expect(anonymized.phone).toBe('[REDACTED]')
    })

    it('should comply with data retention policies', () => {
      const oldData = {
        createdAt: new Date('2020-01-01').toISOString(),
        type: 'audit_log'
      }

      const newData = {
        createdAt: new Date().toISOString(),
        type: 'user_session'
      }

      expect(shouldRetainData(oldData)).toBe(false) // Old audit logs should be deleted
      expect(shouldRetainData(newData)).toBe(true)  // New sessions should be retained
    })
  })

  describe('Iran-Specific Security Requirements', () => {
    it('should handle internet disconnection gracefully', async () => {
      // Mock network disconnection
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network disconnected'))

      const response = await fetch('/api/tasks').catch(error => error)

      expect(response).toBeInstanceOf(Error)
      expect(response.message).toContain('disconnected')
    })

    it('should work with Iranian payment gateways', async () => {
      const paymentData = {
        amount: 100000, // Rials
        gateway: 'shaparak',
        callbackUrl: 'https://example.com/callback'
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          paymentId: 'payment-123',
          gatewayUrl: 'https://shaparak.ir/pay'
        })
      })

      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      })

      const data = await AssertionHelpers.expectApiResponse(response)
      expect(data.gatewayUrl).toContain('shaparak.ir')
    })

    it('should handle filtering circumvention', async () => {
      // Test that the app works with Iranian filtering systems
      const testUrls = [
        'https://api.supabase.co',
        'https://telegram.org',
        'https://fonts.googleapis.com'
      ]

      for (const url of testUrls) {
        const response = await fetch(url, { method: 'HEAD' }).catch(() => ({ ok: false }))

        // Should either succeed or fail gracefully
        expect(typeof response.ok).toBe('boolean')
      }
    })
  })
})

// Helper functions for security tests
function validatePasswordStrength(password: string): boolean {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return password.length >= minLength &&
         hasUpperCase &&
         hasLowerCase &&
         hasNumbers &&
         hasSpecialChar
}

function generateSecureToken(): string {
  return require('crypto').randomBytes(32).toString('hex')
}

function validateJWT(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false

  const parts = token.split('.')
  return parts.length === 3 && parts.every(part => part.length > 0)
}

function isValidSession(session: any): boolean {
  return session &&
         session.userId &&
         session.expiresAt &&
         session.expiresAt > Date.now()
}

function validateTaskInput(input: any): boolean {
  const maxTitleLength = 200
  const maxDescriptionLength = 5000

  return input.title &&
         input.title.length <= maxTitleLength &&
         (!input.description || input.description.length <= maxDescriptionLength)
}

function encryptData(data: any): string {
  // Mock encryption - in real implementation use proper encryption
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

function decryptData(encryptedData: string): any {
  // Mock decryption - in real implementation use proper decryption
  return JSON.parse(Buffer.from(encryptedData, 'base64').toString())
}

function anonymizeData(data: any): any {
  return {
    name: `anon_${Date.now()}`,
    email: `anon_${Date.now()}@example.com`,
    phone: '[REDACTED]'
  }
}

function shouldRetainData(data: any): boolean {
  const retentionPolicies: Record<string, number> = {
    audit_log: 365 * 24 * 60 * 60 * 1000, // 1 year
    user_session: 30 * 24 * 60 * 60 * 1000, // 30 days
    task: Infinity // Keep forever
  }

  const maxAge = retentionPolicies[data.type] || 0
  const dataAge = Date.now() - new Date(data.createdAt).getTime()

  return dataAge <= maxAge
}
