import { createClient } from '@supabase/supabase-js'

// We use env variables to connect to Skip Cloud / Supabase.
// If the environment is not configured, it will fallback gracefully.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
