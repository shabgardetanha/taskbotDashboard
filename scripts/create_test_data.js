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
    // Get or create a profile
    let { data: profile } = await supabase.from('profiles').select('id').limit(1).maybeSingle()
    if (!profile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({ telegram_id: 123456789, full_name: 'Test User' })
        .select()
        .single()
      profile = newProfile
    }

    // Get or create workspace
    let { data: ws } = await supabase.from('workspaces').select('id').limit(1).maybeSingle()
    if (!ws) {
      const { data: newWs } = await supabase
        .from('workspaces')
        .insert({ name: 'Test Workspace', owner_id: profile.id })
        .select()
        .single()
      ws = newWs
    }

    // Create test labels
    const labels = [
      { name: 'Frontend', color: '#3b82f6', workspace_id: ws.id },
      { name: 'Backend', color: '#ef4444', workspace_id: ws.id },
      { name: 'Bug', color: '#f59e0b', workspace_id: ws.id },
      { name: 'Feature', color: '#10b981', workspace_id: ws.id }
    ]

    const createdLabels = []
    for (const label of labels) {
      const { data } = await supabase
        .from('task_labels')
        .insert(label)
        .select()
        .single()
      createdLabels.push(data)
    }

    // Create test tasks with various due dates
    const tasks = [
      {
        title: 'طراحی کامپوننت Header',
        description: 'طراحی و پیاده‌سازی کامپوننت Header ریسپانسیو',
        status: 'todo',
        priority: 'high',
        assignee_id: profile.id,
        workspace_id: ws.id,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
        due_time: '14:00:00'
      },
      {
        title: 'رفع باگ لاگین',
        description: 'بررسی و رفع مشکل لاگین در موبایل',
        status: 'inprogress',
        priority: 'urgent',
        assignee_id: profile.id,
        workspace_id: ws.id,
        due_date: new Date().toISOString().split('T')[0], // today
        due_time: '16:00:00'
      },
      {
        title: 'پیاده‌سازی API کاربران',
        description: 'نوشتن API endpoints برای مدیریت کاربران',
        status: 'done',
        priority: 'medium',
        assignee_id: profile.id,
        workspace_id: ws.id,
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
      }
    ]

    const createdTasks = []
    for (const task of tasks) {
      const { data } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()
      createdTasks.push(data)
    }

    // Link labels to tasks
    const labelLinks = [
      { task_id: createdTasks[0].id, label_id: createdLabels[0].id }, // Header -> Frontend
      { task_id: createdTasks[0].id, label_id: createdLabels[3].id }, // Header -> Feature
      { task_id: createdTasks[1].id, label_id: createdLabels[0].id }, // Login bug -> Frontend
      { task_id: createdTasks[1].id, label_id: createdLabels[2].id }, // Login bug -> Bug
      { task_id: createdTasks[2].id, label_id: createdLabels[1].id }, // API -> Backend
      { task_id: createdTasks[2].id, label_id: createdLabels[3].id }  // API -> Feature
    ]

    for (const link of labelLinks) {
      await supabase.from('task_label_links').insert(link)
    }

    // Create subtasks for the first task
    const subtasks = [
      { task_id: createdTasks[0].id, title: 'طراحی mockup', completed: true, order_index: 0 },
      { task_id: createdTasks[0].id, title: 'نوشتن HTML/CSS', completed: false, order_index: 1 },
      { task_id: createdTasks[0].id, title: 'اضافه کردن JavaScript', completed: false, order_index: 2 }
    ]

    for (const subtask of subtasks) {
      await supabase.from('subtasks').insert(subtask)
    }

    // Update subtask counts
    await supabase
      .from('tasks')
      .update({
        subtask_count: 3,
        subtask_completed: 1
      })
      .eq('id', createdTasks[0].id)

    console.log('✅ Test data created successfully!')
    console.log('Created:', {
      labels: createdLabels.length,
      tasks: createdTasks.length,
      labelLinks: labelLinks.length,
      subtasks: subtasks.length
    })

  } catch (err) {
    console.error('❌ Error creating test data:', err)
  }
})()
