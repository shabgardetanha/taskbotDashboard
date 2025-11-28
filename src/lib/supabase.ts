// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// کلاینت عمومی — برای کلاینت و سرور هر دو کار می‌کنه
export const supabase = createClient(supabaseUrl, supabaseAnonKey)