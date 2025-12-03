// src/app/api/telegram/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { Telegraf } from 'telegraf'

const token = process.env.TELEGRAM_BOT_TOKEN!
if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing')

const bot = new Telegraf(token)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Profile {
  id: string
  telegram_id: number
}

async function getOrCreateUser(tgUser: any): Promise<Profile> {
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, telegram_id')
    .eq('telegram_id', tgUser.id)
    .single()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        telegram_id: tgUser.id,
        full_name: tgUser.first_name || 'کاربر',
        username: tgUser.username || null,
      })
      .select()
      .single()

    if (!newProfile) throw new Error('Failed to create profile')
    profile = newProfile
  }

  // این خط فقط برای TypeScript — در عمل همیشه profile داریم
  return profile as Profile
}

bot.command('dashboard', (ctx) => {
  ctx.reply('داشبورد حرفه‌ای شما', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'باز کردن داشبورد', web_app: { url: 'https://taskbotdashboard-production.up.railway.app/webapp' } }
      ]]
    }
  })
})

// دستورات ربات
bot.start((ctx) => ctx.reply(
  '🤖 *TaskBot Persian* - دستیار هوشمند مدیریت وظایف\n\n' +
  '📋 *مدیریت وظایف:*\n' +
  '• `/new متن` ← ایجاد وظیفه جدید\n' +
  '• `/task شماره` ← جزئیات تک وظیفه\n' +
  '• `/edit شماره` ← ویرایش وظیفه\n' +
  '• `/done شماره` ← تکمیل وظیفه\n' +
  '• `/delete شماره` ← حذف وظیفه\n\n' +
  '📊 *گزارش‌ها و جستجو:*\n' +
  '• `/today` ← وظایف امروز\n' +
  '• `/week` ← وظایف این هفته\n' +
  '• `/overdue` ← وظایف معوق\n' +
  '• `/stats` ← آمار کلی\n' +
  '• `/search کلمه` ← جستجو در وظایف\n\n' +
  '⚙️ *تنظیمات پیشرفته:*\n' +
  '• `/priority شماره سطح` ← تغییر اولویت\n' +
  '• `/due شماره YYYY-MM-DD` ← تنظیم مهلت\n' +
  '• `/label شماره برچسب` ← اضافه کردن برچسب\n' +
  '• `/assign شماره @username` ← تخصیص به عضو\n\n' +
  '💻 `/dashboard` ← وب‌اپ حرفه‌ای\n\n' +
  '*مثال:* `/new خرید مواد غذایی`',
  { parse_mode: 'Markdown' }
))

// دستور راهنما پیشرفته
bot.command('help', (ctx) => ctx.reply(
  '📚 *راهنمای کامل TaskBot*\n\n' +
  '*📝 ایجاد و مدیریت وظایف:*\n' +
  '• `/new <متن>` - ایجاد وظیفه جدید\n' +
  '• `/task <شماره>` - نمایش جزئیات وظیفه\n' +
  '• `/edit <شماره>` - ویرایش عنوان وظیفه\n' +
  '• `/delete <شماره>` - حذف وظیفه\n' +
  '• `/done <شماره>` - علامت‌گذاری به عنوان انجام شده\n\n' +
  '*🔧 تنظیمات پیشرفته:*\n' +
  '• `/priority <شماره> <سطح>` - تغییر اولویت (urgent/high/medium/low)\n' +
  '• `/due <شماره> <تاریخ>` - تنظیم تاریخ مهلت (YYYY-MM-DD)\n' +
  '• `/label <شماره> <برچسب>` - اضافه کردن برچسب\n' +
  '• `/assign <شماره> <یوزرنیم>` - تخصیص به عضو تیم\n\n' +
  '*📊 گزارش‌ها:*\n' +
  '• `/today` - وظایف امروز\n' +
  '• `/week` - وظایف این هفته\n' +
  '• `/overdue` - وظایف معوق\n' +
  '• `/stats` - آمار عملکرد\n' +
  '• `/progress` - پیشرفت تیم\n\n' +
  '*🔍 جستجو:*\n' +
  '• `/search <کلمه>` - جستجو در عنوان و توضیحات\n' +
  '• `/mytasks` - همه وظایف من\n\n' +
  '*💡 نکات:*\n' +
  '• شماره وظایف را از `/mytasks` پیدا کنید\n' +
  '• تاریخ را به فرمت YYYY-MM-DD وارد کنید\n' +
  '• @username باید با @ شروع شود\n\n' +
  'برای شروع از `/start` استفاده کنید',
  { parse_mode: 'Markdown' }
))

bot.command('new', async (ctx) => {
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بعد از /new بنویس')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: task } = await supabase
      .from('tasks')
      .insert({ title: text, assignee_id: user.id, status: 'todo', priority: 'medium' })
      .select()
      .single()

    ctx.reply(task ? `وظیفه #${task.id} اضافه شد` : 'خطا در ایجاد وظیفه')
  } catch (e) {
    ctx.reply('خطا')
  }
})

bot.command('mytasks', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('assignee_id', user.id)

    if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید')

    const msg = tasks.map(t => `#${t.id} | ${t.title} (${t.status})`).join('\n')
    ctx.reply(`وظایف شما:\n${msg}`)
  } catch {
    ctx.reply('خطا')
  }
})

bot.command('done', async (ctx) => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('استفاده: /done 1')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', id)
      .eq('assignee_id', user.id)

    ctx.reply(error ? 'وظیفه مال شما نیست' : `وظیفه #${id} انجام شد`)
  } catch {
    ctx.reply('خطا')
  }
})

// دستور: وظایف معوق
bot.command('overdue', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)
    const today = new Date().toISOString().split('T')[0]
    const { data: overdue } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority')
      .eq('assignee_id', user.id)
      .lt('due_date', today)
      .eq('status', 'todo')

    if (!overdue?.length) return ctx.reply('هیچ وظیفه معوق نیست!')

    const msg = overdue.map(t => `#${t.id} | ${t.title} (${t.due_date}) | ${t.priority}`).join('\n')
    ctx.reply(`⚠️ وظایف معوق (${overdue.length}):\n${msg}`)
  } catch (e) {
    ctx.reply('خطا')
  }
})

// دستور: وظایف امروز
bot.command('today', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority, description, due_time')
      .eq('assignee_id', user.id)
      .eq('due_date', today)

    if (!todayTasks?.length) return ctx.reply('هیچ وظیفه برای امروز نیست! ✅')

    const msg = todayTasks.map(t => {
      const time = t.due_time ? ` ⏰${t.due_time.slice(0,5)}` : ''
      const desc = t.description ? `\n  └ ${t.description.slice(0,50)}${t.description.length > 50 ? '...' : ''}` : ''
      return `#${t.id} | ${t.title}${time} (${t.status}) | ${t.priority === 'urgent' ? 'فوری' : t.priority === 'high' ? 'زیاد' : t.priority === 'medium' ? 'متوسط' : 'کم'}${desc}`
    }).join('\n\n')
    ctx.reply(`📅 وظایف امروز (${todayTasks.length}):\n\n${msg}`)
  } catch (e) {
    ctx.reply('خطا در دریافت وظایف امروز')
  }
})

// دستور: نمایش جزئیات تک وظیفه
bot.command('task', async (ctx) => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('استفاده: /task 123')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: task } = await supabase
      .from('tasks')
      .select(`
        id, title, description, status, priority, due_date, due_time, created_at,
        labels:task_label_links(label:task_labels(name, color)),
        subtasks(id, title, completed)
      `)
      .eq('id', id)
      .eq('assignee_id', user.id)
      .single()

    if (!task) return ctx.reply('وظیفه یافت نشد یا مال شما نیست')

    const labels = task.labels?.map((l: any) => l.label?.name).join(', ') || 'بدون برچسب'
    const subtasks = task.subtasks || []
    const completed = subtasks.filter((s: any) => s.completed).length

    let msg = `📋 وظیفه #${task.id}: ${task.title}\n\n`
    if (task.description) msg += `📝 ${task.description}\n\n`
    msg += `🏷️ برچسب‌ها: ${labels}\n`
    msg += `📊 وضعیت: ${task.status === 'todo' ? 'در انتظار' : task.status === 'inprogress' ? 'در حال انجام' : 'انجام شده'}\n`
    msg += `🎯 اولویت: ${task.priority === 'urgent' ? 'فوری' : task.priority === 'high' ? 'زیاد' : task.priority === 'medium' ? 'متوسط' : 'کم'}\n`

    if (task.due_date) {
      const dueDate = new Date(task.due_date).toLocaleDateString('fa-IR')
      msg += `📅 مهلت: ${dueDate}`
      if (task.due_time) msg += ` ${task.due_time.slice(0,5)}`
      msg += '\n'
    }

    if (subtasks.length > 0) {
      msg += `✅ زیروظایف: ${completed}/${subtasks.length}\n`
      subtasks.slice(0, 3).forEach((s: any, i: number) => {
        msg += `  ${s.completed ? '☑️' : '⬜'} ${s.title}\n`
      })
      if (subtasks.length > 3) msg += `  ... و ${subtasks.length - 3} زیروظیفه دیگر\n`
    }

    msg += `\n📅 ایجاد شده: ${new Date(task.created_at).toLocaleDateString('fa-IR')}`

    ctx.reply(msg)
  } catch (e) {
    ctx.reply('خطا در دریافت جزئیات وظیفه')
  }
})

// دستور: وظایف این هفته
bot.command('week', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)
    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const { data: weekTasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority, status')
      .eq('assignee_id', user.id)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', weekFromNow.toISOString().split('T')[0])
      .eq('status', 'todo')
      .order('due_date')

    if (!weekTasks?.length) return ctx.reply('هیچ وظیفه برای این هفته نیست! 🎉')

    const grouped = weekTasks.reduce((acc: any, task) => {
      const date = task.due_date || 'بدون تاریخ'
      if (!acc[date]) acc[date] = []
      acc[date].push(task)
      return acc
    }, {})

    let msg = `📅 وظایف این هفته (${weekTasks.length}):\n\n`
    Object.keys(grouped).sort().forEach(date => {
      const dateStr = date === 'بدون تاریخ' ? 'بدون تاریخ' : new Date(date).toLocaleDateString('fa-IR')
      msg += `🗓️ ${dateStr}:\n`
      grouped[date].forEach((task: any) => {
        msg += `  #${task.id} ${task.title} (${task.priority === 'urgent' ? 'فوری' : task.priority})\n`
      })
      msg += '\n'
    })

    ctx.reply(msg)
  } catch (e) {
    ctx.reply('خطا در دریافت وظایف هفته')
  }
})

// دستور: آمار وظایف
bot.command('stats', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('status, priority, due_date, created_at')
      .eq('assignee_id', user.id)

    if (!allTasks?.length) return ctx.reply('هنوز هیچ وظیفه‌ای ندارید!')

    const stats = {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inprogress: allTasks.filter(t => t.status === 'inprogress').length,
      done: allTasks.filter(t => t.status === 'done').length,
      urgent: allTasks.filter(t => t.priority === 'urgent').length,
      overdue: allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    }

    const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

    // Calculate weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thisWeekTasks = allTasks.filter(t => new Date(t.created_at) > weekAgo)
    const weeklyCompletion = thisWeekTasks.filter(t => t.status === 'done').length

    const msg =
      `📊 *آمار وظایف شما*\n\n` +
      `📋 *کل وظایف:* ${stats.total}\n` +
      `✅ *انجام شده:* ${stats.done} (${completionRate}%)\n` +
      `⏳ *در انتظار:* ${stats.todo}\n` +
      `🔄 *در حال انجام:* ${stats.inprogress}\n\n` +
      `🎯 *اولویت‌ها:*\n` +
      `🚨 فوری: ${stats.urgent}\n\n` +
      `⚠️ *وضعیت‌ها:*\n` +
      `📅 معوق: ${stats.overdue}\n` +
      `📈 هفتگی: ${weeklyCompletion} تکمیل شده\n\n` +
      `برای جزئیات بیشتر از \`/progress\` استفاده کنید`

    ctx.reply(msg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '📈 پیشرفت هفتگی', callback_data: 'progress_week' },
          { text: '🎯 اولویت‌ها', callback_data: 'priority_stats' }
        ], [
          { text: '📅 وظایف امروز', callback_data: 'today_tasks' },
          { text: '⚠️ معوق‌ها', callback_data: 'overdue_tasks' }
        ]]
      }
    })
  } catch (e) {
    ctx.reply('خطا در دریافت آمار')
  }
})

// دستور پیشرفته: پیشرفت
bot.command('progress', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)

    // Weekly progress
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: weekTasks } = await supabase
      .from('tasks')
      .select('status, created_at')
      .eq('assignee_id', user.id)
      .gte('created_at', weekAgo.toISOString())

    const weekStats = {
      total: weekTasks?.length || 0,
      completed: weekTasks?.filter(t => t.status === 'done').length || 0
    }

    // Monthly progress
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { data: monthTasks } = await supabase
      .from('tasks')
      .select('status, created_at')
      .eq('assignee_id', user.id)
      .gte('created_at', monthAgo.toISOString())

    const monthStats = {
      total: monthTasks?.length || 0,
      completed: monthTasks?.filter(t => t.status === 'done').length || 0
    }

    const weekRate = weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0
    const monthRate = monthStats.total > 0 ? Math.round((monthStats.completed / monthStats.total) * 100) : 0

    const msg =
      `📈 *گزارش پیشرفت*\n\n` +
      `📅 *هفته گذشته:*\n` +
      `• ایجاد شده: ${weekStats.total}\n` +
      `• تکمیل شده: ${weekStats.completed}\n` +
      `• نرخ پیشرفت: ${weekRate}%\n\n` +
      `📊 *ماه گذشته:*\n` +
      `• ایجاد شده: ${monthStats.total}\n` +
      `• تکمیل شده: ${monthStats.completed}\n` +
      `• نرخ پیشرفت: ${monthRate}%\n\n` +
      `💡 *نکته:* برای بهترین عملکرد، روزانه حداقل ۳ وظیفه تکمیل کنید!`

    ctx.reply(msg, { parse_mode: 'Markdown' })
  } catch (e) {
    ctx.reply('خطا در دریافت گزارش پیشرفت')
  }
})

// دستور: جستجو در وظایف
bot.command('search', async (ctx) => {
  const query = ctx.message?.text?.replace('/search', '').trim()
  if (!query) return ctx.reply('کلمه جستجو را بعد از /search بنویسید\n\nمثال: `/search خرید`')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority')
      .eq('assignee_id', user.id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)

    if (!tasks?.length) return ctx.reply(`❌ هیچ وظیفه‌ای با کلمه "${query}" یافت نشد`)

    const msg = `🔍 نتایج جستجو برای "${query}":\n\n` +
      tasks.map(t => `#${t.id} ${t.title} (${t.status})`).join('\n')

    ctx.reply(msg, {
      reply_markup: {
        inline_keyboard: tasks.slice(0, 5).map(task => [{
          text: `📋 #${task.id} - ${task.title.slice(0, 20)}`,
          callback_data: `task_${task.id}`
        }])
      }
    })
  } catch (e) {
    ctx.reply('خطا در جستجو')
  }
})

// دستور: ویرایش عنوان وظیفه
bot.command('edit', async (ctx) => {
  const parts = ctx.message?.text?.split(' ')
  const id = Number(parts?.[1])
  const newTitle = parts?.slice(2).join(' ')

  if (!id || !newTitle) {
    return ctx.reply('استفاده صحیح: `/edit شماره_وظیفه عنوان_جدید`\n\nمثال: `/edit 1 خرید مواد غذایی تازه`')
  }

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: task, error } = await supabase
      .from('tasks')
      .update({ title: newTitle.trim() })
      .eq('id', id)
      .eq('assignee_id', user.id)
      .select()
      .single()

    if (error) return ctx.reply('وظیفه یافت نشد یا مال شما نیست')

    ctx.reply(`✅ عنوان وظیفه #${id} به "${task.title}" تغییر یافت`)
  } catch (e) {
    ctx.reply('خطا در ویرایش وظیفه')
  }
})

// دستور: تنظیم اولویت
bot.command('priority', async (ctx) => {
  const parts = ctx.message?.text?.split(' ')
  const id = Number(parts?.[1])
  const priority = parts?.[2]

  const validPriorities = ['urgent', 'high', 'medium', 'low']
  if (!id || !priority || !validPriorities.includes(priority)) {
    return ctx.reply(
      'استفاده صحیح: `/priority شماره اولویت`\n\n' +
      'اولویت‌های معتبر:\n' +
      '• `urgent` - فوری\n' +
      '• `high` - زیاد\n' +
      '• `medium` - متوسط\n' +
      '• `low` - کم\n\n' +
      'مثال: `/priority 1 urgent`'
    )
  }

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { error } = await supabase
      .from('tasks')
      .update({ priority })
      .eq('id', id)
      .eq('assignee_id', user.id)

    if (error) return ctx.reply('وظیفه یافت نشد یا مال شما نیست')

    const priorityText = priority === 'urgent' ? 'فوری' :
                        priority === 'high' ? 'زیاد' :
                        priority === 'medium' ? 'متوسط' : 'کم'

    ctx.reply(`🎯 اولویت وظیفه #${id} به "${priorityText}" تغییر یافت`)
  } catch (e) {
    ctx.reply('خطا در تغییر اولویت')
  }
})

// دستور: تنظیم تاریخ مهلت
bot.command('due', async (ctx) => {
  const parts = ctx.message?.text?.split(' ')
  const id = Number(parts?.[1])
  const dateStr = parts?.[2]
  const timeStr = parts?.[3]

  if (!id || !dateStr) {
    return ctx.reply(
      'استفاده صحیح: `/due شماره تاریخ [زمان]`\n\n' +
      'فرمت تاریخ: YYYY-MM-DD\n' +
      'فرمت زمان: HH:MM (اختیاری)\n\n' +
      'مثال‌ها:\n' +
      '• `/due 1 2025-12-25`\n' +
      '• `/due 1 2025-12-25 14:30`'
    )
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) {
    return ctx.reply('فرمت تاریخ صحیح نیست. از YYYY-MM-DD استفاده کنید\n\nمثال: 2025-12-25')
  }

  try {
    const user = await getOrCreateUser(ctx.from!)
    const updates: any = { due_date: dateStr }
    if (timeStr) updates.due_time = timeStr

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('assignee_id', user.id)

    if (error) return ctx.reply('وظیفه یافت نشد یا مال شما نیست')

    const dateObj = new Date(dateStr)
    const persianDate = dateObj.toLocaleDateString('fa-IR')
    const response = `📅 مهلت وظیفه #${id} تنظیم شد:\n${persianDate}${timeStr ? ` ساعت ${timeStr}` : ''}`

    ctx.reply(response)
  } catch (e) {
    ctx.reply('خطا در تنظیم مهلت')
  }
})

// دستور: اضافه کردن برچسب
bot.command('label', async (ctx) => {
  const parts = ctx.message?.text?.split(' ')
  const id = Number(parts?.[1])
  const labelName = parts?.slice(2).join(' ')

  if (!id || !labelName) {
    return ctx.reply('استفاده صحیح: `/label شماره_وظیفه نام_برچسب`\n\nمثال: `/label 1 frontend`')
  }

  try {
    const user = await getOrCreateUser(ctx.from!)

    // Find or create label
    let { data: existingLabel } = await supabase
      .from('task_labels')
      .select('id')
      .eq('name', labelName.trim())
      .single()

    if (!existingLabel) {
      const { data: newLabel } = await supabase
        .from('task_labels')
        .insert({
          name: labelName.trim(),
          color: '#3b82f6', // Default blue color
          workspace_id: null // Could be enhanced
        })
        .select()
        .single()
      existingLabel = newLabel
    }

    if (!existingLabel) return ctx.reply('خطا در ایجاد برچسب')

    // Check if task exists and belongs to user
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('assignee_id', user.id)
      .single()

    if (!task) return ctx.reply('وظیفه یافت نشد یا مال شما نیست')

    // Check if label is already attached
    const { data: existingLink } = await supabase
      .from('task_label_links')
      .select('id')
      .eq('task_id', id)
      .eq('label_id', existingLabel.id)
      .single()

    if (existingLink) return ctx.reply(`برچسب "${labelName}" قبلاً به این وظیفه اضافه شده`)

    // Add label to task
    const { error } = await supabase
      .from('task_label_links')
      .insert({
        task_id: id,
        label_id: existingLabel.id
      })

    if (error) return ctx.reply('خطا در اضافه کردن برچسب')

    ctx.reply(`🏷️ برچسب "${labelName}" به وظیفه #${id} اضافه شد`)
  } catch (e) {
    ctx.reply('خطا در اضافه کردن برچسب')
  }
})

// دستور: حذف وظیفه
bot.command('delete', async (ctx) => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('استفاده: `/delete شماره_وظیفه`\n\nمثال: `/delete 1`')

  try {
    const user = await getOrCreateUser(ctx.from!)

    // Get task info before deletion
    const { data: task } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', id)
      .eq('assignee_id', user.id)
      .single()

    if (!task) return ctx.reply('وظیفه یافت نشد یا مال شما نیست')

    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('assignee_id', user.id)

    if (error) return ctx.reply('خطا در حذف وظیفه')

    ctx.reply(`🗑️ وظیفه "${task.title}" (#${id}) حذف شد`)
  } catch (e) {
    ctx.reply('خطا در حذف وظیفه')
  }
})

// دستور: یادآوری وظایف
bot.command('remind', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)

    // Get overdue tasks
    const today = new Date().toISOString().split('T')[0]
    const { data: overdue } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority')
      .eq('assignee_id', user.id)
      .lt('due_date', today)
      .eq('status', 'todo')
      .limit(5)

    // Get today's tasks
    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('id, title, priority')
      .eq('assignee_id', user.id)
      .eq('due_date', today)
      .eq('status', 'todo')
      .limit(5)

    let msg = `🔔 *یادآوری وظایف*\n\n`

    if (overdue && overdue.length > 0) {
      msg += `⚠️ *وظایف معوق (${overdue.length}):*\n`
      overdue.forEach(task => {
        msg += `• #${task.id} ${task.title} (${task.due_date})\n`
      })
      msg += '\n'
    }

    if (todayTasks && todayTasks.length > 0) {
      msg += `📅 *وظایف امروز (${todayTasks.length}):*\n`
      todayTasks.forEach(task => {
        msg += `• #${task.id} ${task.title}\n`
      })
      msg += '\n'
    }

    if ((!overdue || overdue.length === 0) && (!todayTasks || todayTasks.length === 0)) {
      msg += `✅ هیچ وظیفه معوق یا امروز ندارید!\n\n`
    }

    msg += `💡 از دستورات زیر برای مدیریت استفاده کنید:\n`
    msg += `• \`/today\` - همه وظایف امروز\n`
    msg += `• \`/overdue\` - وظایف معوق\n`
    msg += `• \`/stats\` - آمار کلی`

    ctx.reply(msg, { parse_mode: 'Markdown' })
  } catch (e) {
    ctx.reply('خطا در دریافت یادآوری')
  }
})

// دستور: مدیریت دسته‌جمعی
bot.command('bulk', async (ctx) => {
  const action = ctx.message?.text?.split(' ')[1]
  const status = ctx.message?.text?.split(' ')[2]

  if (!action) {
    return ctx.reply(
      '📦 *مدیریت دسته‌جمعی وظایف*\n\n' +
      'دستورات:\n' +
      '• `/bulk done today` - تکمیل همه وظایف امروز\n' +
      '• `/bulk done all` - تکمیل همه وظایف (خطرناک!)\n' +
      '• `/bulk status todo` - تغییر وضعیت همه به در انتظار\n\n' +
      '⚠️ *هشدار:* برخی دستورات برگشت‌ناپذیر هستند!'
    , { parse_mode: 'Markdown' })
  }

  try {
    const user = await getOrCreateUser(ctx.from!)
    let query = supabase.from('tasks').eq('assignee_id', user.id)
    let description = ''

    if (action === 'done') {
      let bulkQuery = supabase.from('tasks').update({ status: 'done' }).eq('assignee_id', user.id).neq('status', 'done')

      if (status === 'today') {
        const today = new Date().toISOString().split('T')[0]
        bulkQuery = bulkQuery.eq('due_date', today)
        description = 'وظایف امروز'
      } else if (status === 'all') {
        description = 'همه وظایف'
      } else {
        return ctx.reply('پارامتر نامعتبر. استفاده: `/bulk done today` یا `/bulk done all`')
      }

      const { count, error } = await bulkQuery.select('*', { count: 'exact', head: true })

      if (error) throw error

      ctx.reply(`✅ ${count} ${description} به عنوان تکمیل شده علامت‌گذاری شدند`)
    }
    else if (action === 'status') {
      if (!['todo', 'inprogress', 'done'].includes(status)) {
        return ctx.reply('وضعیت نامعتبر. استفاده: todo, inprogress, done')
      }

      const { count, error } = await query
        .update({ status })
        .select('*', { count: 'exact', head: true })

      if (error) throw error

      const statusText = status === 'todo' ? 'در انتظار' :
                        status === 'inprogress' ? 'در حال انجام' : 'انجام شده'

      ctx.reply(`📊 وضعیت ${count} وظیفه به "${statusText}" تغییر یافت`)
    }
    else {
      ctx.reply('اقدام نامعتبر. از `/bulk` برای دیدن گزینه‌ها استفاده کنید')
    }
  } catch (e) {
    ctx.reply('خطا در عملیات دسته‌جمعی')
  }
})

// Callback query handlers for inline buttons
bot.on('callback_query', async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data
    if (callbackData?.startsWith('task_')) {
      ctx.answerCbQuery()

      const taskId = Number(callbackData.replace('task_', ''))

      // Get task details directly
      const user = await getOrCreateUser(ctx.from!)
      const { data: task } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, priority, due_date, due_time,
          labels:task_label_links(label:task_labels(name, color))
        `)
        .eq('id', taskId)
        .eq('assignee_id', user.id)
        .single()

      if (!task) {
        ctx.reply('وظیفه یافت نشد یا مال شما نیست')
        return
      }

      const labels = task.labels?.map((l: any) => l.label?.name).join(', ') || 'بدون برچسب'
      let msg = `📋 وظیفه #${task.id}: ${task.title}\n\n`
      if (task.description) msg += `📝 ${task.description}\n\n`
      msg += `🏷️ برچسب‌ها: ${labels}\n`
      msg += `🎯 اولویت: ${task.priority === 'urgent' ? 'فوری' : task.priority === 'high' ? 'زیاد' : task.priority === 'medium' ? 'متوسط' : 'کم'}\n`
      msg += `📊 وضعیت: ${task.status === 'todo' ? 'در انتظار' : task.status === 'inprogress' ? 'در حال انجام' : 'انجام شده'}`

      ctx.reply(msg)
    }
    else if (callbackData === 'progress_week') {
      ctx.answerCbQuery()

      const user = await getOrCreateUser(ctx.from!)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const { data: weekTasks } = await supabase
        .from('tasks')
        .select('status, created_at')
        .eq('assignee_id', user.id)
        .gte('created_at', weekAgo.toISOString())

      const weekStats = {
        total: weekTasks?.length || 0,
        completed: weekTasks?.filter(t => t.status === 'done').length || 0
      }

      const weekRate = weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0

      const msg = `📈 *پیشرفت هفته گذشته:*\n\n` +
        `• ایجاد شده: ${weekStats.total}\n` +
        `• تکمیل شده: ${weekStats.completed}\n` +
        `• نرخ پیشرفت: ${weekRate}%`

      ctx.reply(msg, { parse_mode: 'Markdown' })
    }
    else if (callbackData === 'priority_stats') {
      ctx.answerCbQuery()

      const user = await getOrCreateUser(ctx.from!)
      const { data: tasks } = await supabase
        .from('tasks')
        .select('priority')
        .eq('assignee_id', user.id)

      const priorityStats = {
        urgent: tasks?.filter(t => t.priority === 'urgent').length || 0,
        high: tasks?.filter(t => t.priority === 'high').length || 0,
        medium: tasks?.filter(t => t.priority === 'medium').length || 0,
        low: tasks?.filter(t => t.priority === 'low').length || 0
      }

      const msg = `🎯 *توزیع اولویت‌ها:*\n\n` +
        `🚨 فوری: ${priorityStats.urgent}\n` +
        `🔴 زیاد: ${priorityStats.high}\n` +
        `🟡 متوسط: ${priorityStats.medium}\n` +
        `🟢 کم: ${priorityStats.low}`

      ctx.reply(msg, { parse_mode: 'Markdown' })
    }
    else if (callbackData === 'today_tasks') {
      ctx.answerCbQuery()

      const user = await getOrCreateUser(ctx.from!)
      const today = new Date().toISOString().split('T')[0]
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('id, title, priority')
        .eq('assignee_id', user.id)
        .eq('due_date', today)
        .eq('status', 'todo')
        .limit(5)

      if (!todayTasks?.length) {
        ctx.reply('هیچ وظیفه‌ای برای امروز ندارید! ✅')
        return
      }

      const msg = `📅 *وظایف امروز (${todayTasks.length}):*\n\n` +
        todayTasks.map(t => `• #${t.id} ${t.title}`).join('\n')

      ctx.reply(msg, { parse_mode: 'Markdown' })
    }
    else if (callbackData === 'overdue_tasks') {
      ctx.answerCbQuery()

      const user = await getOrCreateUser(ctx.from!)
      const today = new Date().toISOString().split('T')[0]
      const { data: overdue } = await supabase
        .from('tasks')
        .select('id, title, due_date')
        .eq('assignee_id', user.id)
        .lt('due_date', today)
        .eq('status', 'todo')
        .limit(5)

      if (!overdue?.length) {
        ctx.reply('هیچ وظیفه معوق ندارید! 🎉')
        return
      }

      const msg = `⚠️ *وظایف معوق (${overdue.length}):*\n\n` +
        overdue.map(t => `• #${t.id} ${t.title} (${t.due_date})`).join('\n')

      ctx.reply(msg, { parse_mode: 'Markdown' })
    }
  } catch (e) {
    console.error('Callback error:', e)
    ctx.answerCbQuery('خطا در پردازش درخواست')
  }
})

// وب‌هوک
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
