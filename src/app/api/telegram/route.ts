// src/app/api/telegram/route.ts
import { NextRequest } from 'next/server'
import { Telegraf, Context } from 'telegraf'
import { createClient } from '@supabase/supabase-js'

// === Supabase Server Client (API Route) ===
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // فقط در سرور — امن
)

// === Types ===
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

// === Helper: get or create user ===
async function getOrCreateUser(tgUser: TelegramUser): Promise<Profile> {
  let { data = await supabase
    .from('profiles')
    .select('id, telegram_id, username, full_name')
    .eq('telegram_id', tgUser.id)
    .single()
    .then(res => res.data)

  if (!data) {
    const fullName = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim()
    const insertRes = await supabase
      .from('profiles')
      .insert({
        telegram_id: tgUser.id,
        username: tgUser.username || null,
        full_name: fullName || 'کاربر ناشناس',
      })
      .select()
      .single()

    data = insertRes.data
  }

  // اگر به هر دلیلی null بود (خیلی نادر)، خطا می‌دیم
  if (!data) throw new Error('Failed to create or fetch user profile')

  return data as Profile
}

// === Bot Setup ===
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

bot.start(ctx => ctx.reply('سلام! به ربات مدیریت وظایف خوش اومدی 🚀\nدستورات: /new, /mytasks, /done, /priority'))

bot.command('new', async ctx => {
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بعد از /new بنویس')

  try {
    const user = await getOrCreateUser(ctx.from as TelegramUser)

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

    ctx.reply(`وظیفه جدید اضافه شد ✅\n#${task.data.id} | ${text}`)
  } catch (error) {
    ctx.reply('خطا در اضافه کردن وظیفه')
    console.error(error)
  }
})

bot.command('mytasks', async ctx => {
  try {
    const user = await getOrCreateUser(ctx.from as TelegramUser)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false })

    if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید!'))

    const message = tasks
      .map(t => `• #${t.id} | ${t.title}\n   وضعیت: ${t.status} | اولویت: ${t.priority}`)
      .join('\n\n')

    ctx.reply(`وظایف شما:\n\n${message}`)
  } catch (error) {
    ctx.reply('خطا در دریافت وظایف')
  }
})

bot.command('done', async ctx => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('آیدی وظیفه رو بنویس: /done 1')

  try {
    const user = await getOrCreateUser(ctx.from as TelegramUser)
    const { data } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', id)
      .eq('assignee_id', user.id)

    if (data) ctx.reply(`وظیفه #${id} انجام شد!`)
    else ctx.reply('وظیفه پیدا نشد یا مال شما نیست')
  } catch {
    ctx.reply('خطا در انجام وظیفه')
  }
})

bot.command('priority', async ctx => {
  const parts = ctx.message?.text?.split(' ')
  if (parts.length < 3) return ctx.reply('استفاده: /priority 1 urgent')

  const [_, idStr, priority] = parts
  const id = Number(idStr)

  if (!id || !['low', 'medium', 'high', 'urgent'].includes(priority))
    return ctx.reply('آیدی یا اولویت اشتباهه')

  try {
    const user = await getOrCreateUser(ctx.from as TelegramUser)
    const { data } = await supabase
      .from('tasks')
      .update({ priority })
      .eq('id', id)
      .eq('assignee_id', user.id)

    if (data) ctx.reply(`اولویت وظیفه #${id} به ${priority} تغییر کرد`)
    else ctx.reply('وظیفه پیدا نشد')
  } catch {
    ctx.reply('خطا')
  }
})

// === Next.js API Route Handler ===
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}

// برای جلوگیری از cold start در بعضی پلتفرم‌ها
export const dynamic = 'force-dynamic'