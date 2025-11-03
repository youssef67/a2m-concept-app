import { createClient } from '@supabase/supabase-js'
import { customStorage } from './customStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    storageKey: 'supabase-auth-pwa',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    }
  }
})

// Wait for client to be ready
let initPromise = null
export async function waitForSupabaseReady() {
  if (!initPromise) {
    initPromise = supabase.auth.getSession()
  }
  return initPromise
}
