// src/app/api/telegram/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { Telegraf } from 'telegraf'

// وب‌هوک
export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN missing')
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const bot = new Telegraf(token)

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

      return profile as Profile
    }

    // دستورات ربات
    bot.start((ctx) => ctx.reply(
      '🤖 *TaskBot Persian* - دستیار هوشمند مدیریت وظایف\n\n' +
      '📋 *مدیریت وظایف:*\n' +
      '• `/new متن` ← ایجاد وظیفه جدید\n' +
      '• `/task شماره` ← جزئیات تک وظیفه\n' +
      '• `/edit شماره` ← ویرایش وظیفه\n' +
      '• `/done شماره` ← تکمیل وظیفه\n' +
      '• `/delete شماره` ← حذف وظیفه\n\n' +
      '📊 *گزارش‌ها و جستجو:*\n' +
      '• `/today` ← وظایف امروز\n' +
      '• `/week` ← وظایف این هفته\n' +
      '• `/overdue` ← وظایف معوق\n' +
      '• `/stats` ← آمار کلی\n' +
      '• `/search کلمه` ← جستجو در وظایف\n\n' +
      '⚙️ *تنظیمات پیشرفته:*\n' +
      '• `/priority شماره سطح` ← تغییر اولویت\n' +
      '• `/due شماره YYYY-MM-DD` ← تنظیم مهلت\n' +
      '• `/label شماره برچسب` ← اضافه کردن برچسب\n' +
      '• `/assign شماره @username` ← تخصیص به عضو\n\n' +
      '💻 `/dashboard` ← وب‌اپ حرفه‌ای\n\n' +
      '*مثال:* `/new خرید مواد غذایی`',
      { parse_mode: 'Markdown' }
    ))

    // دستور dashboard
    bot.command('dashboard', (ctx) => {
      ctx.reply('داشبورد حرفه‌ای شما', {
        reply_markup: {
          inline_keyboard: [[
            { text: 'باز کردن داشبورد', web_app: { url: 'https://taskbotdashboard-production.up.railway.app/webapp' } }
          ]]
        }
      })
    })

    // سایر دستورات...
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
      return
    })

    const body = await req.json()
    await bot.handleUpdate(body)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Error', { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
