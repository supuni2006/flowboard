import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // This only warns at build/dev time — it won't crash the app, but
  // nothing that talks to the database will work until you set
  // NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
  console.warn(
    'Supabase env vars are missing. Copy .env.local.example to .env.local and fill in your project credentials.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
