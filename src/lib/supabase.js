import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Storage personnalisé qui désactive le lock interne de gotrue-js
// Le lock est inutile dans une SPA mono-onglet et provoque des timeouts en cascade
const customStorage = {
  getItem: (key) => {
    try { return globalThis.localStorage?.getItem(key) ?? null }
    catch { return null }
  },
  setItem: (key, value) => {
    try { globalThis.localStorage?.setItem(key, value) }
    catch {}
  },
  removeItem: (key) => {
    try { globalThis.localStorage?.removeItem(key) }
    catch {}
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'sb-zkfnfsixqhoaoxjwyjii-auth-token',
    flowType: 'implicit',
    // Désactive le lock interne (cause des warnings et timeouts en SPA mono-onglet)
    lock: async (_name, _acquireTimeout, fn) => fn()
  },
  global: {
    headers: { 'X-Client-Info': 'fabulae-web' }
  }
})
