import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

interface User {
  id: number
  username?: string
  first_name: string
  last_name?: string
}

// ذخیره یا دریافت کاربر
async function getOrCreateUser(tgUser: User) {
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', tgUser.id)
    .single()

  if (!profile) {
    const { data } = await supabase
      .from('profiles')
      .insert({
        telegram_id: tgUser.id,
        username: tgUser.username,
        full_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim()
      })
      .select()
      .single()
    profile = data
  }
  return profile
}

bot.start((ctx) => ctx.reply('به سیستم مدیریت وظایف خوش آمدید!\nدستورات:\n/new عنوان\n/mytasks\n/done 123\n/priority 123 high'))

bot.command('new', async (ctx) => {
  const text = ctx.message.text.replace('/new', '').trim()
  if (!text) return ctx.reply('عنوان وظیفه رو بنویسید! مثال: /new خرید سرور جدید')

  const user = await getOrCreateUser(ctx.from)
  const { data } = await supabase
    .from('tasks')
    .insert({ title: text, assignee_id: user.id })
    .select()
    .single()

  ctx.reply(`وظیفه #${data.id} اضافه شد`)
})

bot.command('mytasks', async (ctx) => {
  const user = await getOrCreateUser(ctx.from)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority')
    .eq('assignee_id', user.id)
    .order('created_at', { ascending: false })

  if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید!')

  const message = tasks.map(t =>
    `• #${t.id} | ${t.title}\n   وضعیت: ${t.status} | اولویت: ${t.priority}`
  ).join('\n\n')

  ctx.reply(`وظایف شما:\n\n${message}`)
})

bot.command('done (.+)', async (ctx) => {
  const match = ctx.match[1]
  const taskId = parseInt(match)
  const user = await getOrCreateUser(ctx.from)

  const { data: task } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('id', taskId)
    .eq('assignee_id', user.id)
    .single()

  if (!task) return ctx.reply('وظیفه پیدا نشد یا مال شما نیست!')

  await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId)
  ctx.reply(`وظیفه #${taskId} انجام شد`)
})

bot.command('priority', async (ctx) => {
  const args = ctx.message.text.split(' ')
  if (args.length < 3) return ctx.reply('مثال: /priority 123 high')

  const taskId = parseInt(args[1])
  const priority = args[2].toLowerCase()
  if (!['low','medium','high','urgent'].includes(priority)) {
    return ctx.reply('اولویت معتبر: low, medium, high, urgent')
  }

  await supabase.from('tasks').update({ priority }).eq('id', taskId)
  ctx.reply(`اولویت وظیفه #${taskId} به ${priority} تغییر کرد`)
})


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return NextResponse.json({ status: 'OK' })
  } catch (error) {
    console.error('Telegram handler error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}