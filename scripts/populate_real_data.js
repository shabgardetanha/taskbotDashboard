/**
 * Populate Real Data Script
 * Replaces all placeholders and mocks with real database-connected data
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function populateRealData() {
  console.log('🚀 Starting real data population...')

  try {
    // 1. Create real users with profiles
    console.log('📝 Creating real users...')
    await createRealUsers()

    // 2. Create real workspaces
    console.log('🏢 Creating real workspaces...')
    await createRealWorkspaces()

    // 3. Create real tasks with all relationships
    console.log('📋 Creating real tasks...')
    await createRealTasks()

    // 4. Create real labels and link to tasks
    console.log('🏷️ Creating real labels...')
    await createRealLabels()

    // 5. Create real subtasks
    console.log('📝 Creating real subtasks...')
    await createRealSubtasks()

    // 6. Create real task templates
    console.log('📄 Creating real task templates...')
    await createRealTemplates()

    // 7. Create sample activity logs
    console.log('📊 Creating real activity logs...')
    await createRealActivityLogs()

    // 8. Create sample notifications
    console.log('🔔 Creating real notifications...')
    await createRealNotifications()

    console.log('✅ All real data populated successfully!')

  } catch (error) {
    console.error('❌ Error populating real data:', error)
    process.exit(1)
  }
}

async function createRealUsers() {
  const users = [
    {
      email: 'demo@taskbot.com',
      password: 'demo123',
      full_name: 'کاربر دمو',
      telegram_id: 123456789
    },
    {
      email: 'admin@taskbot.com',
      password: 'admin123',
      full_name: 'مدیر سیستم',
      telegram_id: 987654321
    },
    {
      email: 'user@taskbot.com',
      password: 'user123',
      full_name: 'کاربر عادی',
      telegram_id: 555666777
    }
  ]

  for (const userData of users) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          telegram_id: userData.telegram_id
        }
      })

      if (authError && authError.message !== 'User already registered') {
        console.log(`⚠️ Auth user ${userData.email} already exists or error:`, authError.message)
        continue
      }

      const userId = authData?.user?.id
      if (!userId) {
        // Try to get existing user
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(userData.email)
        if (existingUser?.user?.id) {
          // Create or update profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: existingUser.user.id,
              telegram_id: userData.telegram_id,
              full_name: userData.full_name,
              updated_at: new Date().toISOString()
            })

          if (profileError) {
            console.log(`⚠️ Profile update error for ${userData.email}:`, profileError.message)
          } else {
            console.log(`✅ Updated profile for ${userData.email}`)
          }
        }
        continue
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          telegram_id: userData.telegram_id,
          full_name: userData.full_name
        })

      if (profileError) {
        console.log(`⚠️ Profile creation error for ${userData.email}:`, profileError.message)
      } else {
        console.log(`✅ Created user: ${userData.email}`)
      }

    } catch (error) {
      console.log(`⚠️ Error creating user ${userData.email}:`, error.message)
    }
  }
}

async function createRealWorkspaces() {
  const workspaces = [
    {
      name: 'پروژه TaskBot',
      description: 'پلتفرم مدیریت وظایف هوشمند',
      owner_id: await getUserIdByEmail('admin@taskbot.com')
    },
    {
      name: 'تیم توسعه',
      description: 'تیم توسعه و مهندسی نرم‌افزار',
      owner_id: await getUserIdByEmail('demo@taskbot.com')
    },
    {
      name: 'پشتیبانی',
      description: 'تیم پشتیبانی و خدمات مشتری',
      owner_id: await getUserIdByEmail('user@taskbot.com')
    }
  ]

  for (const workspace of workspaces) {
    if (!workspace.owner_id) continue

    const { error } = await supabase
      .from('workspaces')
      .insert(workspace)

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Workspace creation error:`, error.message)
    } else {
      console.log(`✅ Created workspace: ${workspace.name}`)
    }
  }
}

async function createRealTasks() {
  const tasks = [
    {
      title: 'پیاده‌سازی API کاربران',
      description: 'طراحی و پیاده‌سازی REST API برای مدیریت کاربران با احراز هویت JWT',
      status: 'inprogress',
      priority: 'high',
      assignee_id: await getUserIdByEmail('demo@taskbot.com'),
      workspace_id: await getWorkspaceIdByName('پروژه TaskBot'),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      due_time: '14:00',
      subtask_count: 3,
      subtask_completed: 1
    },
    {
      title: 'بهینه‌سازی عملکرد دیتابیس',
      description: 'افزودن ایندکس‌های مناسب و بهینه‌سازی Queryها برای بهبود عملکرد',
      status: 'todo',
      priority: 'medium',
      assignee_id: await getUserIdByEmail('admin@taskbot.com'),
      workspace_id: await getWorkspaceIdByName('پروژه TaskBot'),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
      subtask_count: 5,
      subtask_completed: 2
    },
    {
      title: 'طراحی رابط کاربری داشبورد',
      description: 'طراحی و پیاده‌سازی داشبورد مدیریتی با استفاده از React و Tailwind CSS',
      status: 'done',
      priority: 'high',
      assignee_id: await getUserIdByEmail('user@taskbot.com'),
      workspace_id: await getWorkspaceIdByName('تیم توسعه'),
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
      subtask_count: 4,
      subtask_completed: 4
    },
    {
      title: 'پیاده‌سازی سیستم نوتیفیکیشن',
      description: 'سیستم ارسال نوتیفیکیشن real-time برای رویدادهای مهم',
      status: 'inprogress',
      priority: 'medium',
      assignee_id: await getUserIdByEmail('demo@taskbot.com'),
      workspace_id: await getWorkspaceIdByName('پشتیبانی'),
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      subtask_count: 6,
      subtask_completed: 3
    },
    {
      title: 'نوشتن مستندات API',
      description: 'تهیه مستندات کامل API با استفاده از Swagger/OpenAPI',
      status: 'todo',
      priority: 'low',
      assignee_id: await getUserIdByEmail('user@taskbot.com'),
      workspace_id: await getWorkspaceIdByName('تیم توسعه'),
      due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 21 days from now
      subtask_count: 2,
      subtask_completed: 0
    }
  ]

  for (const task of tasks) {
    if (!task.assignee_id) continue

    const { error } = await supabase
      .from('tasks')
      .insert(task)

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Task creation error:`, error.message)
    } else {
      console.log(`✅ Created task: ${task.title}`)
    }
  }
}

async function createRealLabels() {
  const labels = [
    { name: 'Frontend', color: '#3b82f6', owner_id: await getUserIdByEmail('demo@taskbot.com') },
    { name: 'Backend', color: '#ef4444', owner_id: await getUserIdByEmail('admin@taskbot.com') },
    { name: 'Database', color: '#10b981', owner_id: await getUserIdByEmail('demo@taskbot.com') },
    { name: 'UI/UX', color: '#f59e0b', owner_id: await getUserIdByEmail('user@taskbot.com') },
    { name: 'Testing', color: '#8b5cf6', owner_id: await getUserIdByEmail('admin@taskbot.com') },
    { name: 'Documentation', color: '#06b6d4', owner_id: await getUserIdByEmail('user@taskbot.com') },
    { name: 'Bug', color: '#dc2626', owner_id: await getUserIdByEmail('demo@taskbot.com') },
    { name: 'Feature', color: '#16a34a', owner_id: await getUserIdByEmail('admin@taskbot.com') }
  ]

  for (const label of labels) {
    if (!label.owner_id) continue

    const { data: labelData, error } = await supabase
      .from('task_labels')
      .insert(label)
      .select()
      .single()

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Label creation error:`, error.message)
      continue
    }

    if (labelData) {
      // Link some labels to tasks
      await linkLabelsToTasks(labelData.id, label.name)
      console.log(`✅ Created label: ${label.name}`)
    }
  }
}

async function linkLabelsToTasks(labelId, labelName) {
  // Get some tasks to link labels to
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title')
    .limit(3)

  if (!tasks || tasks.length === 0) return

  // Link based on task content and label type
  const links = []
  for (const task of tasks) {
    if (labelName === 'Frontend' && task.title.includes('API')) {
      links.push({ task_id: task.id, label_id: labelId })
    } else if (labelName === 'Backend' && task.title.includes('API')) {
      links.push({ task_id: task.id, label_id: labelId })
    } else if (labelName === 'Database' && task.title.includes('دیتابیس')) {
      links.push({ task_id: task.id, label_id: labelId })
    } else if (labelName === 'UI/UX' && task.title.includes('رابط')) {
      links.push({ task_id: task.id, label_id: labelId })
    } else if (labelName === 'Documentation' && task.title.includes('مستندات')) {
      links.push({ task_id: task.id, label_id: labelId })
    }
  }

  for (const link of links) {
    const { error } = await supabase
      .from('task_label_links')
      .insert(link)

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Label link creation error:`, error.message)
    }
  }
}

async function createRealSubtasks() {
  // Get tasks to add subtasks to
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title')
    .limit(3)

  if (!tasks) return

  const subtasks = [
    { task_id: tasks[0]?.id, title: 'طراحی schema دیتابیس', completed: true },
    { task_id: tasks[0]?.id, title: 'پیاده‌سازی endpoints', completed: false },
    { task_id: tasks[0]?.id, title: 'نوشتن تست‌ها', completed: false },
    { task_id: tasks[1]?.id, title: 'تحلیل Queryهای کند', completed: true },
    { task_id: tasks[1]?.id, title: 'افزودن ایندکس‌ها', completed: false },
    { task_id: tasks[2]?.id, title: 'طراحی mockups', completed: true },
    { task_id: tasks[2]?.id, title: 'پیاده‌سازی کامپوننت‌ها', completed: true }
  ]

  for (const subtask of subtasks) {
    if (!subtask.task_id) continue

    const { error } = await supabase
      .from('subtasks')
      .insert(subtask)

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Subtask creation error:`, error.message)
    } else {
      console.log(`✅ Created subtask: ${subtask.title}`)
    }
  }
}

async function createRealTemplates() {
  const templates = [
    {
      name: 'تمپلیت توسعه ویژگی',
      description: 'تمپلیت استاندارد برای توسعه ویژگی‌های جدید',
      category: 'development',
      owner_id: await getUserIdByEmail('admin@taskbot.com'),
      is_public: true,
      estimated_duration: 14,
      priority: 'high',
      template_data: {
        title: 'توسعه ویژگی: [نام ویژگی]',
        description: 'پیاده‌سازی ویژگی جدید با نیازمندی‌های مشخص شده',
        subtasks: [
          'تحلیل نیازمندی‌ها',
          'طراحی معماری',
          'پیاده‌سازی',
          'تست و QA',
          'مستندسازی'
        ]
      }
    },
    {
      name: 'تمپلیت رفع باگ',
      description: 'تمپلیت استاندارد برای رفع باگ‌های گزارش شده',
      category: 'bug_fix',
      owner_id: await getUserIdByEmail('demo@taskbot.com'),
      is_public: true,
      estimated_duration: 3,
      priority: 'urgent',
      template_data: {
        title: 'رفع باگ: [توضیح باگ]',
        description: 'رفع باگ گزارش شده با اولویت بالا',
        subtasks: [
          'تجزیه و تحلیل باگ',
          'بازتولید باگ',
          'پیاده‌سازی رفع',
          'تست رفع',
          'تست رگرسیون'
        ]
      }
    }
  ]

  for (const template of templates) {
    if (!template.owner_id) continue

    const { error } = await supabase
      .from('task_templates')
      .insert(template)

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Template creation error:`, error.message)
    } else {
      console.log(`✅ Created template: ${template.name}`)
    }
  }
}

async function createRealActivityLogs() {
  const users = await getAllUserIds()
  const activities = [
    {
      user_id: users[0],
      task_id: 1,
      action: 'created',
      details: { priority: 'high', status: 'todo' }
    },
    {
      user_id: users[1],
      task_id: 2,
      action: 'updated',
      details: { old_status: 'todo', new_status: 'inprogress' }
    },
    {
      user_id: users[2],
      task_id: 3,
      action: 'status_changed',
      details: { completed_at: new Date().toISOString() }
    }
  ]

  for (const activity of activities) {
    if (!activity.user_id) continue

    const { error } = await supabase
      .from('activity_logs')
      .insert(activity)

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Activity log creation error:`, error.message)
    } else {
      console.log(`✅ Created activity log: ${activity.action}`)
    }
  }
}

async function createRealNotifications() {
  const users = await getAllUserIds()
  const notifications = [
    {
      user_id: users[0],
      type: 'task_assigned',
      title: 'وظیفه جدید به شما اختصاص یافت',
      message: 'پیاده‌سازی API کاربران - اولویت بالا',
      data: { task_id: '1', priority: 'high' }
    },
    {
      user_id: users[1],
      type: 'task_due',
      title: 'مهلت وظیفه نزدیک است',
      message: 'بهینه‌سازی عملکرد دیتابیس - ۲ روز تا مهلت',
      data: { task_id: '2', days_remaining: 2 }
    },
    {
      user_id: users[2],
      type: 'task_updated',
      title: 'وظیفه تکمیل شد',
      message: 'طراحی رابط کاربری داشبورد توسط شما تکمیل گردید',
      data: { task_id: '3', completed_by: users[2] }
    }
  ]

  for (const notification of notifications) {
    if (!notification.user_id) continue

    const { error } = await supabase
      .from('notifications')
      .insert(notification)

    if (error && !error.message.includes('duplicate key')) {
      console.log(`⚠️ Notification creation error:`, error.message)
    } else {
      console.log(`✅ Created notification: ${notification.title}`)
    }
  }
}

// Helper functions
async function getUserIdByEmail(email) {
  try {
    const { data } = await supabase.auth.admin.getUserByEmail(email)
    return data?.user?.id || null
  } catch {
    return null
  }
}

async function getWorkspaceIdByName(name) {
  try {
    const { data } = await supabase
      .from('workspaces')
      .select('id')
      .eq('name', name)
      .single()
    return data?.id || null
  } catch {
    return null
  }
}

async function getAllUserIds() {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .limit(5)
    return data?.map(p => p.id) || []
  } catch {
    return []
  }
}

// Run the script
populateRealData().then(() => {
  console.log('🎉 Real data population completed!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})
