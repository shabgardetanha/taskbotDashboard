const fs = require('fs')
const path = require('path')
;(async () => {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8')
    env.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    })
  }
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: cols, error } = await supabase.from('information_schema.columns').select('column_name, is_nullable, data_type').eq('table_name','activity_logs')
  if (error) {
    console.error('Error querying information_schema:', error)
  } else {
    console.log('activity_logs columns:', JSON.stringify(cols, null, 2))
  }
})()
