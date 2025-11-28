// src/app/api/telegram/route.ts
import { NextRequest } from 'next/server'
import { Telegraf } from 'telegraf'

const token = process.env.TELEGRAM_BOT_TOKEN!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// فقط در runtime ایمپورت می‌شه — build time هیچ مشکلی نداره
let bot: Telegraf
let supabase: any

async function initBotAndSupabase() {
  if (bot && supabase) return

  const { createClient } = await import('@supabase/supabase-js')
  supabase = createClient(supabaseUrl, supabaseKey)
  bot = new Telegraf(token)
}

interface Profile {
  id: string
  telegram_id: number
  username?: string | null
  full_name: string
}

async function getOrCreateUser(tgUser: any): Promise<Profile> {
  await initBotAndSupabase()
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
    profile = newProfile!
  }

  return profile
}

// دستورات ربات
bot = new Telegraf(token) // موقت برای تعریف دستورات (init واقعی در runtime)

bot.start((ctx) => ctx.reply('سلام! به ربات مدیریت وظایف خوش اومدی\nدستورات: /new, /mytasks, /done'))

bot.command('new', async (ctx) => {
  await initBotAndSupabase()
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بعد از /new بنویس')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: task } = await supabase
      .from('tasks')
      .insert({ title: text, assignee_id: user.id, status: 'todo', priority: 'medium' })
      .select()
      .single()

    ctx.reply(task ? `وظیفه #${task.id} اضافه شد` : 'خطا')
  } catch (e) {
    ctx.reply('خطا در ایجاد وظیفه')
  }
})

bot.command('mytasks', async (ctx) => {
  await initBotAndSupabase()
  try {
    const user = await getOrCreateUser(ctx.from!)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('assignee_id', user.id)

    if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید')

    const msg = tasks.map((t: any) => `• #${t.id} | ${t.title}\n   وضعیت: ${t.status} | اولویت: ${t.priority}`).join('\n\n')
    ctx.reply(`وظایف شما:\n\n${msg}`)
  } catch {
    ctx.reply('خطا')
  }
})

bot.command('done', async (ctx) => {
  await initBotAndSupabase()
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('/done 1')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', id)
      .eq('assignee_id', user.id)

    ctx.reply(error ? 'خطا' : `وظیفه #${id} انجام شد`)
  } catch {
    ctx.reply('خطا')
  }
})

// وب‌هوک
export async function POST(req: NextRequest) {
  await initBotAndSupabase()
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'