/// <reference types="vitest/globals" />
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

describe('Build Verification', () => {
  it('should build successfully without environment variables', () => {
    // Temporarily remove env vars that might cause build issues
    const originalEnv = { ...process.env }
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.TELEGRAM_BOT_TOKEN

    try {
      // Run build command with longer timeout
      execSync('npm run build', {
        stdio: 'pipe',
        timeout: 120000, // 2 minute timeout for build
        cwd: process.cwd()
      })

      // Check if .next directory was created
      expect(existsSync(join(process.cwd(), '.next'))).toBe(true)

      // Check for common build artifacts
      expect(existsSync(join(process.cwd(), '.next', 'build-manifest.json'))).toBe(true)
    } catch (error: any) {
      // If build fails, it should not be due to missing env vars in API routes
      expect(error.message).not.toMatch(/supabaseUrl is required/)
      expect(error.message).not.toMatch(/Supabase configuration missing/)
      expect(error.message).not.toMatch(/TELEGRAM_BOT_TOKEN missing/)
      throw error
    } finally {
      // Restore environment
      Object.assign(process.env, originalEnv)
    }
  }, 130000) // Test timeout

  it('should not have Supabase clients initialized at module level', () => {
    // This test ensures that API routes don't create Supabase clients
    // at import time, which would cause build failures

    const fs = require('fs')
    const path = require('path')

    // Check all API route files
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api')
    const routeFiles = findRouteFiles(apiDir)

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf8')

      // Should not have module-level Supabase client creation
      expect(content).not.toMatch(/const supabase = createClient/)
      expect(content).not.toMatch(/createClient\(.*\).*at module level/)

      // Should have lazy client creation (either function or direct in functions)
      const hasGetSupabaseClient = content.includes('function getSupabaseClient')
      const hasDirectInitialization = content.includes('const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL')

      expect(hasGetSupabaseClient || hasDirectInitialization).toBe(true)
    }

    function findRouteFiles(dir: string): string[] {
      const files: string[] = []
      const items = fs.readdirSync(dir)

      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          files.push(...findRouteFiles(fullPath))
        } else if (item === 'route.ts') {
          files.push(fullPath)
        }
      }

      return files
    }
  })

  it('should handle missing environment variables gracefully', async () => {
    // Test that the application can start without crashing due to missing env vars
    const originalEnv = { ...process.env }
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    try {
      // Try to import the supabase client (should not crash)
      const supabaseModule = await import('../lib/supabase')
      expect(supabaseModule.supabase).toBeDefined()

      // The client should be created with placeholder values
      // This is acceptable for build-time, but runtime will need real values
    } finally {
      Object.assign(process.env, originalEnv)
    }
  })
})
