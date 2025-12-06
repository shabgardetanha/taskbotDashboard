import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    // Get all environment variables that contain SUPABASE or RAILWAY
    const envVars = Object.keys(process.env)
      .filter(key => key.includes('SUPABASE') || key.includes('RAILWAY') || key.includes('NODE_ENV'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? `${process.env[key]?.substring(0, 10)}...` : 'undefined'
        return acc
      }, {} as Record<string, string>)

    // Check specific variables
    const specificVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'undefined',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'undefined',
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID || 'undefined',
      RAILWAY_ENVIRONMENT_ID: process.env.RAILWAY_ENVIRONMENT_ID || 'undefined',
    }

    return NextResponse.json({
      message: 'Environment variables debug info',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      filteredEnvVars: envVars,
      specificVars: specificVars,
      totalEnvVars: Object.keys(process.env).length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to debug environment variables', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
