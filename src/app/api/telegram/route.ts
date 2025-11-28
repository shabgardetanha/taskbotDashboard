// src/app/api/telegram/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { Telegraf } from 'telegraf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TelegramUser {
  id: number
  username?: string
  first_name: string
  last_name?: string
}

interface Profile {
  id: string
  telegram_id: number
  username?: string | null
  full_name: string
}

async function getOrCreateUser(tgUser: TelegramUser): Promise<Profile> {
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, telegram_id, username, full_name')
    .eq('telegram_id', tgUser.id)
    .single()

  if (!profile) {
    const fullName = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() || 'کاربر ناشناس'

    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        telegram_id: tgUser.id,
        username: tgUser.username || null,
        full_name: fullName,
      })
      .select()
      .single()

    if (!newProfile) throw new Error('Failed to create profile')
    profile = newProfile
  }

  return profile as Profile
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

bot.start((ctx) =>
  ctx.reply('سلام! به ربات مدیریت وظایف خوش اومدی\nدستورات: /new, /mytasks, /done, /priority')
)

bot.command('new', async (ctx) => {
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بعد از /new بنویس')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        title: text,
        assignee_id: user.id,
        status: 'todo',
        priority: 'medium',
      })
      .select()
      .single()

    ctx.reply(`وظیفه جدید اضافه شد\n#${task?.id} | ${text}`)
  } catch (err) {
    console.error(err)
    ctx.reply('خطا در ایجاد وظیفه')
  }
})

bot.command('mytasks', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false })

    if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید!')

    const message = tasks
      .map((t) => `• #${t.id} | ${t.title}\n   وضعیت: ${t.status} | اولویت: ${t.priority}`)
      .join('\n\n')

    ctx.reply(`وظایف شما:\n\n${message}`)
  } catch {
    ctx.reply('خطا در دریافت وظایف')
  }
})

bot.command('done', async (ctx) => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id || isNaN(id)) return ctx.reply('استفاده: /done 1')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', id)
      .eq('assignee_id', user.id)

    if (error) throw error
    ctx.reply(`وظیفه #${id} انجام شد`)
  } catch {
    ctx.reply('وظیفه پیدا نشد یا مال شما نیست')
  }
})

bot.command('priority', async (ctx) => {
  const parts = ctx.message?.text?.split(' ')
  if (!parts || parts.length < 3) return ctx.reply('استفاده: /priority 1 urgent')

  const id = Number(parts[1])
  const priority = parts[2].toLowerCase()

  if (!id || !['low', 'medium', 'high', 'urgent'].includes(priority))
    return ctx.reply('آیدی یا اولویت اشتباهه')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { error } = await supabase
      .from('tasks')
      .update({ priority })
      .eq('id', id)
      .eq('assignee_id', user.id)

    if (error) throw error
    ctx.reply(`اولویت وظیفه #${id} به ${priority} تغییر کرد`)
  } catch {
    ctx.reply('خطا در تغییر اولویت')
  }
})

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