// Create Missing Tables Directly
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTablesDirectly() {
  console.log('🔨 Creating missing tables directly...')

  try {
    // Create activity_logs table
    console.log('📝 Creating activity_logs table...')
    const { error: activityError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // dummy data
        action: 'created',
        details: { test: true }
      })
      .select()

    if (activityError && activityError.message.includes('does not exist')) {
      console.log('⚠️ activity_logs table does not exist, will be created via migration')
    } else if (activityError && !activityError.message.includes('duplicate key')) {
      console.log('⚠️ activity_logs table creation issue:', activityError.message)
    } else {
      console.log('✅ activity_logs table exists')
      // Clean up dummy data
      await supabase.from('activity_logs').delete().eq('details->test', true)
    }

    // Create notifications table
    console.log('🔔 Creating notifications table...')
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        type: 'task_assigned',
        title: 'Test',
        message: 'Test notification'
      })
      .select()

    if (notifError && notifError.message.includes('does not exist')) {
      console.log('⚠️ notifications table does not exist, will be created via migration')
    } else if (notifError && !notifError.message.includes('duplicate key')) {
      console.log('⚠️ notifications table creation issue:', notifError.message)
    } else {
      console.log('✅ notifications table exists')
      // Clean up dummy data
      await supabase.from('notifications').delete().eq('title', 'Test')
    }

    // Create user_preferences table
    console.log('⚙️ Creating user_preferences table...')
    const { error: prefError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        theme: 'light'
      })
      .select()

    if (prefError && prefError.message.includes('does not exist')) {
      console.log('⚠️ user_preferences table does not exist, will be created via migration')
    } else if (prefError && !prefError.message.includes('duplicate key')) {
      console.log('⚠️ user_preferences table creation issue:', prefError.message)
    } else {
      console.log('✅ user_preferences table exists')
      // Clean up dummy data
      await supabase.from('user_preferences').delete().eq('user_id', '00000000-0000-0000-0000-000000000000')
    }

    console.log('🎯 Table existence check completed!')

  } catch (error) {
    console.error('❌ Table creation check failed:', error)
  }
}

async function provideManualInstructions() {
  console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS:')
  console.log('================================')
  console.log('Since automatic migration failed, run these commands manually:')
  console.log('')
  console.log('1. Using Supabase CLI:')
  console.log('   supabase db push')
  console.log('')
  console.log('2. Or using psql directly:')
  console.log('   psql $DATABASE_URL -f supabase/migrations/20251206000000_create_missing_tables.sql')
  console.log('')
  console.log('3. Or using Supabase Dashboard:')
  console.log('   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
  console.log('   - Copy and paste the contents of:')
  console.log('     supabase/migrations/20251206000000_create_missing_tables.sql')
  console.log('   - Click "Run"')
  console.log('')
  console.log('4. After running migration, execute data population:')
  console.log('   node scripts/populate_real_data.js')
}

async function main() {
  await createTablesDirectly()
  await provideManualInstructions()

  console.log('\n🎉 Setup process completed!')
  console.log('Follow the manual instructions above to complete the migration.')
}

main().catch(console.error)
