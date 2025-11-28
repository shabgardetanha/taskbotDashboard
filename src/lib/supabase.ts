// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // فقط در build time خطا نده — در runtime چک می‌شه
  console.warn('Supabase env vars missing. Client will be created at runtime.')
}

// در runtime (وقتی کاربر وارد می‌شه) دوباره می‌سازه
export const supabase = global.supabase || createClient(supabaseUrl || '', supabaseAnonKey || '')

// برای جلوگیری از چندبار ساختن در dev
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  global.supabase = supabase
}