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
  '🤖 سلام به TaskBot Persian خوش اومدی!\n\n' +
  '📋 دستورات مدیریت وظایف:\n' +
  '/new متن ← ایجاد وظیفه جدید\n' +
  '/mytasks ← نمایش همه وظایف\n' +
  '/task شماره ← جزئیات تک وظیفه\n' +
  '/done شماره ← تکمیل وظیفه\n\n' +
  '📊 دستورات گزارش‌گیری:\n' +
  '/today ← وظایف امروز\n' +
  '/week ← وظایف این هفته\n' +
  '/overdue ← وظایف معوق\n' +
  '/stats ← آمار کلی\n\n' +
  '💻 /dashboard ← وب‌اپ حرفه‌ای\n\n' +
  'مثال: /new خرید مواد غذایی'
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
      .select('status, priority, due_date')
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

    const msg =
      `📊 آمار وظایف شما:\n\n` +
      `📋 کل: ${stats.total}\n` +
      `⏳ در انتظار: ${stats.todo}\n` +
      `🔄 در حال انجام: ${stats.inprogress}\n` +
      `✅ انجام شده: ${stats.done}\n` +
      `🚨 فوری: ${stats.urgent}\n` +
      `⚠️ معوق: ${stats.overdue}\n\n` +
      `برای جزئیات بیشتر از /mytasks استفاده کنید`

    ctx.reply(msg)
  } catch (e) {
    ctx.reply('خطا در دریافت آمار')
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
