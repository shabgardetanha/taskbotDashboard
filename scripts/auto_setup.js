#!/usr/bin/env node

/**
 * Auto Setup Script - Automatically creates missing tables and populates data
 * This script handles the complete setup process automatically
 */

const { createClient } = require('@supabase/supabase-js')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dbUrl = process.env.SUPABASE_DB_URL

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' })
    return true
  } catch (error) {
    return false
  }
}

async function runSupabaseMigration() {
  console.log('🔄 Running Supabase CLI migration...')

  try {
    // Check if we're in a Supabase project
    const supabaseConfigPath = path.join(process.cwd(), 'supabase', 'config.toml')
    if (!fs.existsSync(supabaseConfigPath)) {
      console.log('⚠️ Supabase config not found, trying alternative approach...')
      return false
    }

    // Run migration
    execSync('supabase db push --yes', { stdio: 'inherit' })
    console.log('✅ Supabase CLI migration completed')
    return true

  } catch (error) {
    console.log('⚠️ Supabase CLI migration failed:', error.message)
    return false
  }
}

async function runDirectSQLMigration() {
  console.log('🔄 Running direct SQL migration...')

  if (!dbUrl) {
    console.log('⚠️ SUPABASE_DB_URL not found, skipping direct SQL migration')
    return false
  }

  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251206000000_create_missing_tables.sql')

    if (!fs.existsSync(migrationPath)) {
      console.log('⚠️ Migration file not found')
      return false
    }

    // Use psql to execute the migration
    const command = `psql "${dbUrl}" -f "${migrationPath}"`
    execSync(command, { stdio: 'inherit' })

    console.log('✅ Direct SQL migration completed')
    return true

  } catch (error) {
    console.log('⚠️ Direct SQL migration failed:', error.message)
    return false
  }
}

async function createTablesManually() {
  console.log('🔨 Creating tables manually through API...')

  // Since direct SQL execution failed, let's try creating tables one by one
  // This is a fallback approach

  const createStatements = [
    // activity_logs table
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid references workspaces(id) on delete cascade,
      task_id bigint references tasks(id) on delete cascade,
      user_id uuid not null references profiles(id) on delete cascade,
      action text not null check (action in (
        'created', 'updated', 'deleted', 'commented', 'attachment_added', 'attachment_removed',
        'assigned', 'unassigned', 'status_changed', 'priority_changed', 'due_date_changed',
        'label_added', 'label_removed', 'subtask_added', 'subtask_completed'
      )),
      details jsonb,
      created_at timestamp with time zone default now()
    )`,

    // notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references profiles(id) on delete cascade,
      workspace_id uuid references workspaces(id) on delete cascade,
      task_id bigint references tasks(id) on delete cascade,
      type text not null check (type in (
        'task_assigned', 'task_due', 'comment_mention', 'workspace_invite', 'task_updated'
      )),
      title text not null,
      message text not null,
      data jsonb,
      read boolean default false,
      created_at timestamp with time zone default now()
    )`,

    // user_preferences table
    `CREATE TABLE IF NOT EXISTS user_preferences (
      user_id uuid primary key references profiles(id) on delete cascade,
      theme text default 'light' check (theme in ('light', 'dark', 'auto')),
      language text default 'fa',
      timezone text default 'Asia/Tehran',
      email_notifications boolean default true,
      telegram_notifications boolean default true,
      weekly_digest boolean default true,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    )`
  ]

  try {
    // Try to execute each statement individually
    for (const sql of createStatements) {
      try {
        // This won't work with Supabase client, but let's try anyway
        console.log('⚠️ Manual table creation requires direct database access')
        console.log('Please run the migration manually using one of these methods:')
        console.log('')
        console.log('Method 1 - Supabase CLI:')
        console.log('  supabase db push')
        console.log('')
        console.log('Method 2 - Supabase Dashboard:')
        console.log('  Go to SQL Editor and run the migration file')
        console.log('')
        console.log('Method 3 - Direct SQL:')
        console.log('  psql $DATABASE_URL -f supabase/migrations/20251206000000_create_missing_tables.sql')
        break
      } catch (error) {
        console.log(`⚠️ Failed to create table:`, error.message)
      }
    }
  } catch (error) {
    console.log('❌ Manual table creation failed')
  }
}

async function verifyTablesExist() {
  console.log('🔍 Verifying table existence...')

  const tables = ['activity_logs', 'notifications', 'user_preferences']
  let allExist = true

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error && error.message.includes('does not exist')) {
        console.log(`❌ Table ${table} does not exist`)
        allExist = false
      } else {
        console.log(`✅ Table ${table} exists`)
      }
    } catch (err) {
      console.log(`❌ Error checking table ${table}:`, err.message)
      allExist = false
    }
  }

  return allExist
}

async function populateData() {
  console.log('🚀 Populating real data...')

  try {
    execSync('node scripts/populate_real_data.js', { stdio: 'inherit' })
    console.log('✅ Data population completed')
    return true
  } catch (error) {
    console.log('❌ Data population failed:', error.message)
    return false
  }
}

async function runFinalTests() {
  console.log('🧪 Running final tests...')

  try {
    execSync('node test-connection.js', { stdio: 'inherit' })
    console.log('✅ Connection tests passed')
    return true
  } catch (error) {
    console.log('❌ Connection tests failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🤖 Starting automatic setup process...')
  console.log('=====================================')

  let migrationSuccess = false

  // Try Supabase CLI first
  if (await checkSupabaseCLI()) {
    console.log('✅ Supabase CLI detected')
    migrationSuccess = await runSupabaseMigration()
  } else {
    console.log('⚠️ Supabase CLI not detected, trying direct SQL...')
    migrationSuccess = await runDirectSQLMigration()
  }

  // If migration failed, provide manual instructions
  if (!migrationSuccess) {
    console.log('\n⚠️ Automatic migration failed. Please run manually:')
    console.log('================================================')
    console.log('')
    console.log('1. Install Supabase CLI:')
    console.log('   npm install -g supabase')
    console.log('')
    console.log('2. Run migration:')
    console.log('   supabase db push')
    console.log('')
    console.log('3. Or use Supabase Dashboard SQL Editor')
    console.log('')

    // Try manual table creation as last resort
    await createTablesManually()
  }

  // Verify tables exist
  const tablesExist = await verifyTablesExist()

  if (!tablesExist) {
    console.log('\n❌ Tables still missing. Please complete migration manually.')
    process.exit(1)
  }

  // Populate data
  console.log('\n📝 Starting data population...')
  const dataSuccess = await populateData()

  if (!dataSuccess) {
    console.log('❌ Data population failed')
    process.exit(1)
  }

  // Run final tests
  console.log('\n🧪 Running final verification...')
  const testSuccess = await runFinalTests()

  if (testSuccess) {
    console.log('\n🎉 AUTOMATIC SETUP COMPLETED SUCCESSFULLY!')
    console.log('==========================================')
    console.log('✅ All tables created')
    console.log('✅ All real data populated')
    console.log('✅ All tests passing')
    console.log('')
    console.log('🚀 Your TaskBot Dashboard is now fully set up with real data!')
    console.log('')
    console.log('Login credentials:')
    console.log('  Demo: demo@taskbot.com / demo123')
    console.log('  Admin: admin@taskbot.com / admin123')
    console.log('  User: user@taskbot.com / user123')
  } else {
    console.log('\n⚠️ Setup completed but tests failed. Check manually.')
  }
}

main().catch(error => {
  console.error('💥 Setup failed:', error)
  process.exit(1)
})
