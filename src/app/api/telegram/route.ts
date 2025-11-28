// src/app/api/telegram/route.ts
import { NextRequest } from 'next/server'
import { Telegraf } from 'telegraf'

const token = process.env.TELEGRAM_BOT_TOKEN
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!token || !supabaseUrl || !supabaseKey) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

// فقط در runtime ایمپورت می‌شه → build time هیچ مشکلی نداره
const bot = new Telegraf(token)

// فقط وقتی درخواست میاد ساخته می‌شه
async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseKey)
}

interface Profile {
  id: string
  telegram_id: number
  username?: string | null
  full_name: string
}

async function getOrCreateUser(tgUser: any): Promise<Profile> {
  const supabase = await getSupabase()
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
bot.start((ctx) => ctx.reply('سلام! به ربات مدیریت وظایف خوش اومدی\nدستورات: /new, /mytasks, /done'))

bot.command('new', async (ctx) => {
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بعد از /new بنویس')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const supabase = await getSupabase()
    const { data: task } = await supabase
      .from('tasks')
      .insert({ title: text, assignee_id: user.id, status: 'todo', priority: 'medium' })
      .select()
      .single()

    ctx.reply(task ? `وظیفه #${task.id} اضافه شد` : 'خطا در ایجاد وظیفه')
  } catch (e) {
    console.error(e)
    ctx.reply('خطا در ایجاد وظیفه')
  }
})

bot.command('mytasks', async (ctx) => {
  try {
    const user = await getOrCreateUser(ctx.from!)
    const supabase = await getSupabase()
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false })

    if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید!')

    const msg = tasks
      .map((t: any) => `• #${t.id} | ${t.title}\n   وضعیت: ${t.status} | اولویت: ${t.priority}`)
      .join('\n\n')

    ctx.reply(`وظایف شما:\n\n${msg}`)
  } catch (e) {
    ctx.reply('خطا در دریافت وظایف')
  }
})

bot.command('done', async (ctx) => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id || isNaN(id)) return ctx.reply('استفاده: /done 1')

  try {
    const user = await getOrCreateUser(ctx.from!)
    const supabase = await getSupabase()
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', id)
      .eq('assignee_id', user.id)

    ctx.reply(error ? 'وظیفه پیدا نشد یا مال شما نیست' : `وظیفه #${id} انجام شد`)
  } catch {
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