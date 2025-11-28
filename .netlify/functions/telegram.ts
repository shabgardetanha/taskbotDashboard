import { Handler } from '@netlify/functions'
import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // فقط در سرور استفاده می‌شه، امن
)

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

async function getOrCreateUser(tgUser: any) {
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
  return profile!
}

// تمام دستورات تلگرام (همون کد قبلی)
bot.command('new' ... بقیه دستورات هم اینجا کپی کن
// فقط آخرش bot.launch() رو حذف کن چون در Netlify کار نمی‌کنه

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405 }
  }

  try {
    const update = JSON.parse(event.body!)
    await bot.handleUpdate(update)
    return { statusCode: 200, body: 'OK' }
  } catch (error) {
    console.error(error)
    return { statusCode: 500, body: 'Error' }
  }
}