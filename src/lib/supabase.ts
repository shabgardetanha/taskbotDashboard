// src/lib/supabase.ts - Supabase client utilities
import { createClient } from '@supabase/supabase-js'

// Cache for client instances to avoid recreation
let supabaseClient: any = null

// Get environment variables safely
const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) {
    // In Railway/production, environment variables should be available at runtime
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
    }
    // In development or build time, use placeholder
    console.warn('NEXT_PUBLIC_SUPABASE_URL not found, using placeholder')
    return 'https://placeholder.supabase.co'
  }
  return url
}

const getSupabaseKey = (): string => {
  // Try multiple ways to access the environment variable (Railway compatibility)
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
           process.env.RAILWAY_SUPABASE_SERVICE_ROLE_KEY ||
           (typeof window !== 'undefined' ? (window as any).env?.SUPABASE_SERVICE_ROLE_KEY : undefined)

  // Debug logging - always log in Railway for debugging
  if (typeof window === 'undefined') {
    console.log('🔑 SUPABASE_SERVICE_ROLE_KEY access debug:')
    console.log('- process.env.SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'UNDEFINED')
    console.log('- process.env.RAILWAY_SUPABASE_SERVICE_ROLE_KEY:', process.env.RAILWAY_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'UNDEFINED')
    console.log('- Final key value:', key ? 'SET (length: ' + key.length + ')' : 'UNDEFINED')
    console.log('- NODE_ENV:', process.env.NODE_ENV)
  }

  if (!key) {
    // In Railway/production, environment variables should be available at runtime
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required in production')
      console.error('Available env vars with SUPABASE:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    }
    // In development or build time, use placeholder
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using placeholder')
    return 'placeholder-service-key'
  }
  return key
}

// Create Supabase client - only create when called, not at module load
const createClientInstance = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseKey()

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Lazy-loaded client creation
const getSupabaseClient = (): any => {
  if (!supabaseClient) {
    supabaseClient = createClientInstance()
  }
  return supabaseClient
}

// Export functions that create clients on demand
export const createSupabaseClient = () => createClientInstance()

// Default client instance - truly lazy loaded (only created when accessed)
export const supabase = (() => {
  let instance: any = null
  return new Proxy({} as any, {
    get(_target, prop) {
      if (!instance) {
        console.log('🚀 Creating Supabase client instance on first access')
        instance = createClientInstance()
        console.log('✅ Supabase client created successfully')
      }
      return instance[prop]
    }
  })
})()

// Utility functions for safer database operations
export const withSupabaseClient = async <T>(
  operation: (client: ReturnType<typeof createSupabaseClient>) => Promise<T>
): Promise<T> => {
  const client = createSupabaseClient()
  try {
    return await operation(client)
  } catch (error) {
    console.error('Supabase operation failed:', error)
    throw error
  }
}

// Health check function
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const client = createSupabaseClient()
    const { error } = await client.from('tasks').select('id').limit(1)
    return !error
  } catch (error) {
    console.error('Supabase connection check failed:', error)
    return false
  }
}

// Environment validation
export const validateSupabaseConfig = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const isValidUrl = url && url.startsWith('https://') && url.includes('.supabase.co')
  const isValidKey = key && key.length > 20

  if (!isValidUrl) {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!isValidKey) {
    console.error('Invalid SUPABASE_SERVICE_ROLE_KEY')
  }

  return !!(isValidUrl && isValidKey)
}
