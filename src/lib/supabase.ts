// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

// فقط برای کلاینت (در کامپوننت‌ها و page.tsx)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// برای API routes جداگانه استفاده کن (مثل route.ts)
export const createSupabaseServerClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}