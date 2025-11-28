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
  'سلام به TaskBot Persian خوش اومدی!\n\n' +
  'دستورات:\n' +
  '/new متن ← وظیفه جدید\n' +
  '/mytasks ← وظایف شما\n' +
  '/done 1 ← تمام کردن\n' +
  '/overdue ← وظایف معوق\n' +
  '/today ← وظایف امروز\n' +
  '/dashboard → وب‌اپ حرفه‌ای'
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
      .select('id, title, status, priority')
      .eq('assignee_id', user.id)
      .eq('due_date', today)

    if (!todayTasks?.length) return ctx.reply('هیچ وظیفه برای امروز نیست!')

    const msg = todayTasks.map(t => `#${t.id} | ${t.title} (${t.status}) | ${t.priority}`).join('\n')
    ctx.reply(`📅 وظایف امروز (${todayTasks.length}):\n${msg}`)
  } catch (e) {
    ctx.reply('خطا')
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