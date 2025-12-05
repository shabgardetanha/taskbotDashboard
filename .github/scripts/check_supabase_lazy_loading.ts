#!/usr/bin/env node

/**
 * Check that Supabase clients are not created at module level in API routes
 * This prevents build-time failures due to missing environment variables
 */

import { readdirSync, statSync, readFileSync } from 'fs'
import { join, extname } from 'path'

interface CheckResult {
  file: string
  violations: string[]
}

function findRouteFiles(dir: string): string[] {
  const files: string[] = []
  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...findRouteFiles(fullPath))
    } else if (item === 'route.ts' || item === 'route.js') {
      files.push(fullPath)
    }
  }

  return files
}

function checkFile(filePath: string): CheckResult {
  const content = readFileSync(filePath, 'utf8')
  const violations: string[] = []

  // Check for module-level Supabase client creation
  const moduleLevelClientRegex = /const\s+supabase\s*=\s*createClient\s*\(/g
  const matches = content.match(moduleLevelClientRegex)

  if (matches) {
    violations.push(`Found ${matches.length} module-level Supabase client creation(s)`)
  }

  // Check for missing lazy loading function
  if (!content.includes('function getSupabaseClient')) {
    violations.push('Missing getSupabaseClient function for lazy loading')
  }

  // Check for proper error handling
  if (!content.includes('Supabase configuration missing')) {
    violations.push('Missing proper error handling for missing Supabase config')
  }

  return {
    file: filePath,
    violations
  }
}

function main() {
  const apiDir = join(process.cwd(), 'src', 'app', 'api')
  const routeFiles = findRouteFiles(apiDir)

  console.log(`🔍 Checking ${routeFiles.length} API route files for Supabase lazy loading...\n`)

  const results: CheckResult[] = []
  let totalViolations = 0

  for (const file of routeFiles) {
    const result = checkFile(file)
    if (result.violations.length > 0) {
      results.push(result)
      totalViolations += result.violations.length
    }
  }

  if (results.length === 0) {
    console.log('✅ All API routes properly implement lazy Supabase client loading!')
    process.exit(0)
  } else {
    console.log('❌ Found violations in API routes:')
    console.log('=====================================')

    for (const result of results) {
      console.log(`📁 ${result.file}`)
      for (const violation of result.violations) {
        console.log(`  ❌ ${violation}`)
      }
      console.log('')
    }

    console.log(`🚨 Total violations: ${totalViolations}`)
    console.log('')
    console.log('💡 Fix: Replace module-level client creation with lazy loading function')
    console.log('   See: src/app/api/labels/route.ts for example implementation')

    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
