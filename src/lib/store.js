import { supabase } from './supabase.js'

// ROUTING hash-based minimal
// routes : #/feed, #/trending, #/top3, #/profile, #/profile/:username, #/show/:id, #/auth

function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || '/feed'
  const parts = h.split('/').filter(Boolean)
  const name = parts[0] || 'feed'
  const params = parts.slice(1)
  return { name, params }
}

export function initStore(Alpine) {
  Alpine.store('app', {
    // --- Auth ---
    session: null,
    profile: null,
    authReady: false,

    // --- Routing ---
    route: parseHash(),

    // --- UI ---
    toast: null,

    async init() {
      // Session initiale
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      if (this.session) await this.loadProfile()
      this.authReady = true

      supabase.auth.onAuthStateChange(async (_event, session) => {
        this.session = session
        if (session) {
          await this.loadProfile()
        } else {
          this.profile = null
        }
      })

      window.addEventListener('hashchange', () => {
        this.route = parseHash()
        window.scrollTo({ top: 0, behavior: 'instant' })
      })

      // Redirection initiale si pas de hash
      if (!window.location.hash) {
        window.location.hash = this.session ? '#/feed' : '#/auth'
      }
    },

    async loadProfile() {
      if (!this.session) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.session.user.id)
        .maybeSingle()
      if (error) {
        console.warn('loadProfile error', error)
      }
      this.profile = data
      // Si pas de profil, on force l'onboarding
      if (!data) {
        window.location.hash = '#/onboarding'
      }
    },

    navigate(path) {
      window.location.hash = path
    },

    showToast(message, type = 'info') {
      this.toast = { message, type }
      setTimeout(() => { this.toast = null }, 3200)
    },

    async signOut() {
      await supabase.auth.signOut()
      window.location.hash = '#/auth'
    },

    get isAuthed() {
      return !!this.session
    }
  })
}
