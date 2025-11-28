// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// تعریف نوع برای global (برای TypeScript)
declare global {
  // eslint-disable-next-line no-var
  var supabase: ReturnType<typeof createClient> | undefined
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// فقط warning در build time
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing — client will be created at runtime.')
}

// ایجاد کلاینت با جلوگیری از چندبار ساختن در dev
export const supabase =
  global.supabase ||
  createClient(supabaseUrl, supabaseAnonKey)

// فقط در حالت dev (hot reload) یک بار می‌سازه
if (process.env.NODE_ENV !== 'production') {
  global.supabase = supabase
}