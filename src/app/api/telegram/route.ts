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
    .select('id')
    .eq('telegram_id', tgUser.id)
    .single()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({ telegram_id: tgUser.id, full_name: tgUser.first_name })
      .select()
      .single()
    profile = newProfile!
  }

  return profile
}

// دستورات ربات — مستقیم روی bot اصلی
bot.start((ctx) => ctx.reply('سلام! ربات مدیریت وظایف فعال شد\nدستورات: /new خرید نون\n/mytasks\n/done 1'))

bot.command('new', async (ctx) => {
  const text = ctx.message?.text?.replace('/new', '').trim()
  if (!text) return ctx.reply('متن وظیفه رو بنویس')

  const user = await getOrCreateUser(ctx.from!)
  const { data: task } = await supabase
    .from('tasks')
    .insert({ title: text, assignee_id: user.id })
    .select()
    .single()

  ctx.reply(task ? `وظیفه #${task.id} اضافه شد ✅` : 'خطا')
})

bot.command('mytasks', async (ctx) => {
  const user = await getOrCreateUser(ctx.from!)
  const { data: tasks } = await supabase.from('tasks').select('id, title, status').eq('assignee_id', user.id)

  if (!tasks?.length) return ctx.reply('هیچ وظیفه‌ای ندارید')

  const msg = tasks.map(t => `#${t.id} | ${t.title} (${t.status})`).join('\n')
  ctx.reply(`وظایف شما:\n${msg}`)
})

bot.command('done', async (ctx) => {
  const id = Number(ctx.message?.text?.split(' ')[1])
  if (!id) return ctx.reply('/done 1')

  const user = await getOrCreateUser(ctx.from!)
  const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', id).eq('assignee_id', user.id)

  ctx.reply(error ? 'خطا یا وظیفه مال شما نیست' : `وظیفه #${id} انجام شد ✅`)
})

// وب‌هوک
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return new Response('OK')
  } catch (e) {
    console.error(e)
    return new Response('Error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'