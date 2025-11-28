// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// اگر env نباشه، فقط warning بده — نه crash
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing — client will be empty until runtime')
}

// کلاینت خالی می‌سازیم تا build time کرش نکنه
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder'
)