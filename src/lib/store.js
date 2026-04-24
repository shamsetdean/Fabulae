import { supabase } from './supabase.js'
import { fetchUnreadCount } from '../views/notifications.js'

function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || '/feed'
  const parts = h.split('/').filter(Boolean)
  const name = parts[0] || 'feed'
  const params = parts.slice(1)
  return { name, params }
}

export function initStore(Alpine) {
  Alpine.store('app', {
    session: null,
    profile: null,
    authReady: false,
    route: parseHash(),
    toast: null,
    unreadCount: 0,

    async init() {
      const { data } = await supabase.auth.getSession()
      this.session = data.session
      if (this.session) {
        await this.loadProfile()
        this.refreshUnreadCount()
        // Rafraîchir toutes les 30 sec
        setInterval(() => this.refreshUnreadCount(), 30000)
      }
      this.authReady = true

      supabase.auth.onAuthStateChange(async (_event, session) => {
        this.session = session
        if (session) {
          await this.loadProfile()
          this.refreshUnreadCount()
        } else {
          this.profile = null
          this.unreadCount = 0
        }
      })

      window.addEventListener('hashchange', () => {
        this.route = parseHash()
        window.scrollTo({ top: 0, behavior: 'instant' })
        // Rafraîchir le badge quand on change de page
        if (this.session) this.refreshUnreadCount()
      })

      if (!window.location.hash) {
        window.location.hash = this.session ? '#/feed' : '#/auth'
      }
    },

    async loadProfile() {
      if (!this.session) return
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', this.session.user.id).maybeSingle()
      if (error) console.warn('loadProfile error', error)
      this.profile = data
      if (!data) window.location.hash = '#/onboarding'
    },

    async refreshUnreadCount() {
      try {
        this.unreadCount = await fetchUnreadCount()
      } catch (e) {
        console.warn('unreadCount error', e)
      }
    },

    navigate(path) { window.location.hash = path },

    showToast(message, type = 'info') {
      this.toast = { message, type }
      setTimeout(() => { this.toast = null }, 3200)
    },

    async signOut() {
      await supabase.auth.signOut()
      window.location.hash = '#/auth'
    },

    get isAuthed() { return !!this.session }
  })
}
