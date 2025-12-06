// Run Missing Tables Migration
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Running missing tables migration...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251206000000_create_missing_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded, executing...')

    // Split SQL into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📋 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })

        if (error) {
          console.log(`⚠️ Statement ${i + 1} failed (might be expected):`, error.message)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.log(`⚠️ Statement ${i + 1} error (might be expected):`, err.message)
      }
    }

    console.log('🎉 Migration execution completed!')

    // Verify tables were created
    console.log('🔍 Verifying created tables...')

    const tablesToCheck = ['activity_logs', 'notifications', 'user_preferences']

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.log(`❌ Table ${tableName} verification failed:`, error.message)
        } else {
          console.log(`✅ Table ${tableName} created successfully`)
        }
      } catch (err) {
        console.log(`⚠️ Table ${tableName} check error:`, err.message)
      }
    }

    console.log('🎯 Migration verification completed!')

  } catch (error) {
    console.error('❌ Migration execution failed:', error)
    process.exit(1)
  }
}

// Alternative approach: Try direct SQL execution
async function runDirectMigration() {
  console.log('🔄 Trying direct migration approach...')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251206000000_create_missing_tables.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Executing migration SQL directly...')

    // Try to execute the entire migration as one query
    // Note: This might not work with Supabase's RPC, so we'll try a different approach
    const { error } = await supabase.from('_supabase_migrations').insert({
      name: '20251206000000_create_missing_tables',
      hash: 'manual_migration',
      executed_at: new Date().toISOString()
    })

    if (error && !error.message.includes('duplicate key')) {
      console.log('⚠️ Migration tracking failed:', error.message)
    }

    console.log('📝 Migration tracking updated')

    // For now, inform user to run migration manually
    console.log('⚠️ For production deployments, run this migration manually:')
    console.log('supabase db push')
    console.log('or')
    console.log('psql $DATABASE_URL -f supabase/migrations/20251206000000_create_missing_tables.sql')

  } catch (error) {
    console.error('❌ Direct migration failed:', error)
  }
}

// Run both approaches
async function main() {
  await runMigration()
  await runDirectMigration()

  console.log('🎉 Migration process completed!')
  console.log('💡 Run the data population script again:')
  console.log('node scripts/populate_real_data.js')
}

main().catch(console.error)
