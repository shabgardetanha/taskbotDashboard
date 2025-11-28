// src/app/api/telegram/route.ts
import { NextRequest } from 'next/server'
import { Telegraf } from 'telegraf'

const token = process.env.TELEGRAM_BOT_TOKEN!
if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing')

// فقط در runtime ساخته می‌شه
const bot = new Telegraf(token)

// Supabase در runtime
async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// دستورات
bot.start(ctx => ctx.reply('سلام! ربات فعال شد 🚀\nدستورات: /new, /mytasks, /done'))

bot.command('new', async ctx => {
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بنویس!')

  const supabase = await getSupabase()
  const user = { id: ctx.from!.id, first_name: ctx.from!.first_name ?? 'کاربر' }

  // کاربر رو بساز یا بگیر
  let { data: profile } = await supabase.from('profiles').select('id').eq('telegram_id', user.id).single()
  if (!profile) {
    const { data } = await supabase.from('profiles').insert({
      telegram_id: user.id,
      full_name: user.first_name,
      username: ctx.from!.username || null
    }).select().single()
    profile = data!
  }

  const { data: task } = await supabase.from('tasks').insert({
    title: text,
    assignee_id: profile.id,
    status: 'todo',
    priority: 'medium'
  }).select().single()

  ctx.reply(task ? `وظیفه #${task.id} اضافه شد ✅` : 'خطا!')
})

bot.command('mytasks', async ctx => {
  const supabase = await getSupabase()
  const { data: profile } = await supabase.from('profiles').select('id').eq('telegram_id', ctx.from!.id).single()
  if (!profile) return ctx.reply('اول /start بزن!')

  const { data: tasks } = await supabase.from('tasks')
    .select('id, title, status, priority')
    .eq('assignee_id', profile.id)
    .order('created_at', { ascending: false })

  if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای نداری!')

  const list = tasks.map(t => `• #${t.id} | ${t.title} [${t.status}] ${t.priority === 'urgent' ? '🔥' : ''}`).join('\n')
  ctx.reply(`وظایف تو:\n\n${list}`)
})

bot.command('done', async ctx => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('مثال: /done 3')

  const supabase = await getSupabase()
  const { data: profile } = await supabase.from('profiles').select('id').eq('telegram_id', ctx.from!.id).single()
  if (!profile) return ctx.reply('کاربر پیدا نشد!')

  const { error } = await supabase.from('tasks')
    .update({ status: 'done' })
    .eq('id', id)
    .eq('assignee_id', profile.id)

  ctx.reply(error ? 'وظیفه پیدا نشد یا مال تو نیست!' : `وظیفه #${id} انجام شد ✅`)
})

// وب‌هوک
export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    await bot.handleUpdate(update)
    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'