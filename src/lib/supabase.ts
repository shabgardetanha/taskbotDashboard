// src/lib/supabase.ts - Supabase client utilities
import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks for build time
const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL is not set, using placeholder for build time')
    return 'https://placeholder.supabase.co'
  }
  return url
}

const getSupabaseKey = (): string => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set, using placeholder for build time')
    return 'placeholder-service-key'
  }
  return key
}

// Create Supabase client with safe fallbacks
export const createSupabaseClient = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseKey()

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Default client instance (use with caution - prefer createSupabaseClient())
export const supabase = createSupabaseClient()

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
