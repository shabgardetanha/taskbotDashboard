const fs = require('fs')
const path = require('path')
;(async () => {
  // Load .env.local
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8')
    env.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    })
  }

  const { createClient } = require('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE env vars')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  try {
    // Ensure we have a workspace to attach to (some triggers require workspace_id)
    let { data: ws, error: wsErr } = await supabase.from('workspaces').select('id').limit(1).maybeSingle()
    if (wsErr) throw wsErr

    let workspaceId = ws?.id
    if (!workspaceId) {
      // find a profile to be the owner
      let { data: profile, error: profileErr } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
      if (profileErr) throw profileErr
      let ownerId = profile?.id
      if (!ownerId) {
        // fallback: try to extract any assignee_id from existing tasks
        const { data: tdata } = await supabase.from('tasks').select('assignee_id').neq('assignee_id', null).limit(1)
        ownerId = tdata && tdata.length ? tdata[0].assignee_id : null
      }
      if (!ownerId) throw new Error('No profile found to be workspace owner; please create a profile first')
      const { data: newWs, error: createErr } = await supabase.from('workspaces').insert({ name: 'dev-default', owner_id: ownerId }).select().single()
      if (createErr) throw createErr
      workspaceId = newWs.id
    }

    const title = 'Script Test Task ' + new Date().toISOString()
    const insert = await supabase.from('tasks').insert({ title, status: 'todo', priority: 'medium', assignee_id: null, workspace_id: workspaceId }).select()
    console.log('Insert result:', JSON.stringify(insert, null, 2))

    const { data: tasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(5)
    console.log('Recent tasks:', JSON.stringify(tasks, null, 2))
  } catch (err) {
    console.error('Error:', err)
  }
})()
