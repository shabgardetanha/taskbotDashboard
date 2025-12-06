// Quick Supabase connection test
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Service Key exists:', !!supabaseKey)
console.log('Anon Key exists:', !!anonKey)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set properly')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const anonSupabase = anonKey ? createClient(supabaseUrl, anonKey) : null

async function testConnection() {
  try {
    console.log('🔍 Testing basic connection...')

    // Test 1: Basic connection
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Basic connection failed:', testError.message)
      return false
    }

    console.log('✅ Basic connection successful')

    // Test 2: Test the exact query from kanban page
    console.log('🔍 Testing kanban page query...')

    const { data: kanbanData, error: kanbanError } = await supabase
      .from('tasks')
      .select(`
        *,
        labels:task_label_links(
          task_labels(*)
        )
      `)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(5)

    if (kanbanError) {
      console.error('❌ Kanban query failed:', kanbanError.message)
      console.error('❌ This would cause "خطا در بارگذاری وظایف"')
      return false
    }

    console.log('✅ Kanban query successful')
    console.log('📊 Found', kanbanData?.length || 0, 'tasks')

    // Test 3: Check if we have any tasks
    if (kanbanData && kanbanData.length > 0) {
      console.log('📋 Sample task:', {
        id: kanbanData[0].id,
        title: kanbanData[0].title,
        hasLabels: !!(kanbanData[0].labels && kanbanData[0].labels.length > 0)
      })
    }

    // Test 4: Test with anonymous client (simulates user access)
    if (anonSupabase) {
      console.log('🔍 Testing anonymous client access (simulates user login)...')

      const { data: anonData, error: anonError } = await anonSupabase
        .from('tasks')
        .select(`
          *,
          labels:task_label_links(
            task_labels(*)
          )
        `)
        .limit(1)

      if (anonError) {
        console.error('❌ Anonymous client access failed:', anonError.message)
        console.error('❌ This would cause "خطا در بارگذاری وظایف" for regular users!')
        console.error('🔧 Possible causes:')
        console.error('   - RLS policies blocking access')
        console.error('   - User not authenticated')
        console.error('   - Missing user session')
        return false
      }

      console.log('✅ Anonymous client access successful')
    } else {
      console.log('⚠️ Anonymous key not available for testing')
    }

    console.log('🎉 All tests passed! No "خطا در بارگذاری وظایف" error should occur.')
    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1)
})
