// src/app/api/telegram/route.ts
import { NextRequest } from 'next/server'
import { Telegraf from 'telegraf'

// این دو تا فقط موقع runtime (وقتی وب‌هوک میاد) چک می‌شن
const token = process.env.TELEGRAM_BOT_TOKEN
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!token || !supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables')
}

// فقط وقتی وب‌هوک صدا زده بشه ساخته می‌شه — نه در build time
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(supabaseUrl, supabaseKey)

const bot = new Telegraf(token)

// === بقیه کد ربات دقیقاً مثل قبل (کپی-پیست کن) ===
interface Profile { id: string; telegram_id: number; username?: string | null; full_name: string }

async function getOrCreateUser(tgUser: any): Promise<Profile> {
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, telegram_id, username, full_name')
    .eq('telegram_id', tgUser.id)
    .single()

  if (!profile) {
    const fullName = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() || 'کاربر ناشناس'
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ telegram_id: tgUser.id, username: tgUser.username || null, full_name: fullName })
      .select()
      .single()
    profile = newProfile
  }

  if (!profile) throw new Error('User creation failed')
  return profile
}

bot.start(ctx => ctx.reply('سلام! به ربات مدیریت وظایف خوش اومدی\nدستورات: /new, /mytasks, /done, /priority'))

bot.command('new', async ctx => {
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بنویس')

  const user = await getOrCreateUser(ctx.from!)
  const { data: task } = await supabase
    .from('tasks')
    .insert({ title: text, assignee_id: user.id, status: 'todo', priority: 'medium' })
    .select()
    .single()

  ctx.reply(task ? `وظیفه #${task.id} اضافه شد` : 'خطا')
})

bot.command('mytasks', async ctx => {
  const user = await getOrCreateUser(ctx.from!)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority')
    .eq('assignee_id', user.id)

  if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید')

  const msg = tasks.map(t => `• #${t.id} | ${t.title}\n   وضعیت: ${t.status} | اولویت: ${t.priority}`).join('\n\n')
  ctx.reply(`وظایف شما:\n\n${msg}`)
})

bot.command('done', async ctx => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('/done 1')

  const user = await getOrCreateUser(ctx.from!)
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', id)
    .eq('assignee_id', user.id)

  ctx.reply(error ? 'خطا یا وظیفه مال شما نیست' : `وظیفه #${id} انجام شد`)
})

// می‌تونی بقیه دستورات رو هم اضافه کنی...

// === وب‌هوک ===
export async function POST(req: NextRequest) {
  try {
   const body = await req.json()
   await bot.handleUpdate(body)
   return new Response('OK', { status: 200 })
 } catch (e) {
   console.error(e)
   return new Response('Error', { status: 500 })
 }
}

export const dynamic = 'force-dynamic'