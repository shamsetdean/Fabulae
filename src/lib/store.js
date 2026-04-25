import { supabase } from './supabase.js'
import { fetchUnreadCount } from '../views/notifications.js'

function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || '/feed'
  const parts = h.split('/').filter(Boolean)
  const name = parts[0] || 'feed'
  const params = parts.slice(1)
  return { name, params }
}

const PUBLIC_ROUTES = ['auth', 'legal']
const PROFILE_EXEMPT_ROUTES = ['auth', 'onboarding', 'legal']

export function initStore(Alpine) {
  Alpine.store('app', {
    session: null,
    profile: null,
    authReady: false,
    profileReady: false,
    route: parseHash(),
    toast: null,
    unreadCount: 0,
    _unreadInterval: null,

    async init() {
      // Listeners installés AVANT la résolution de session
      supabase.auth.onAuthStateChange(async (_event, session) => {
        this.session = session
        if (session) {
          await this.loadProfile()
          this.refreshUnreadCount()
          if (!this._unreadInterval) {
            this._unreadInterval = setInterval(() => this.refreshUnreadCount(), 30000)
          }
        } else {
          this.profile = null
          this.profileReady = false
          this.unreadCount = 0
          if (this._unreadInterval) {
            clearInterval(this._unreadInterval)
            this._unreadInterval = null
          }
        }
      })

      window.addEventListener('hashchange', () => {
        this.route = parseHash()
        window.scrollTo({ top: 0, behavior: 'instant' })
        if (this.session) this.refreshUnreadCount()
      })

      // Résolution de session : on attend mais on garantit que authReady passe à true
      try {
        const { data } = await supabase.auth.getSession()
        this.session = data.session
      } catch (e) {
        console.warn('[Store] getSession error', e)
        this.session = null
      }

      // CRITIQUE : authReady DOIT passer à true même si tout le reste plante
      this.authReady = true
      this._removeSplash()

      // Charge le profil si on a une session, mais ne bloque rien
      if (this.session) {
        this.loadProfile()
          .then(() => {
            this.refreshUnreadCount()
            this._unreadInterval = setInterval(() => this.refreshUnreadCount(), 30000)
          })
          .catch(e => console.warn('[Store] loadProfile failed', e))
      } else {
        this.profileReady = true
      }

      // Redirection initiale
      if (!window.location.hash) {
        window.location.hash = this.session ? '#/feed' : '#/auth'
      } else {
        this._enforceGuards()
      }
    },

    _removeSplash() {
      requestAnimationFrame(() => {
        document.body.classList.add('app-ready')
        const splash = document.getElementById('initial-splash')
        if (splash) {
          setTimeout(() => splash.remove(), 700)
        }
      })
    },

    _enforceGuards() {
      const r = this.route.name

      if (!this.session && !PUBLIC_ROUTES.includes(r)) {
        window.location.hash = '#/auth'
        return
      }

      if (this.session && this.profileReady && !this.profile && !PROFILE_EXEMPT_ROUTES.includes(r)) {
        window.location.hash = '#/onboarding'
        return
      }

      if (this.session && this.profile && r === 'onboarding') {
        window.location.hash = '#/feed'
      }
    },

    async loadProfile() {
      if (!this.session) {
        this.profile = null
        this.profileReady = true
        return
      }
      try {
        const { data, error } = await supabase
          .from('profiles').select('*')
          .eq('id', this.session.user.id)
          .maybeSingle()
        if (error) {
          console.warn('[Store] loadProfile error', error)
          this.profile = null
        } else {
          this.profile = data
        }
      } catch (e) {
        console.warn('[Store] loadProfile exception', e)
        this.profile = null
      } finally {
        this.profileReady = true
        this._enforceGuards()
      }
    },

    async refreshUnreadCount() {
      try {
        this.unreadCount = await fetchUnreadCount()
      } catch (e) {}
    },

    navigate(path) { window.location.hash = path },

    showToast(message, type = 'info') {
      this.toast = { message, type }
      setTimeout(() => { this.toast = null }, 3200)
    },

    async signOut() {
      if (this._unreadInterval) {
        clearInterval(this._unreadInterval)
        this._unreadInterval = null
      }
      await supabase.auth.signOut()
      window.location.hash = '#/auth'
    },

    get isAuthed() { return !!this.session }
  })
}
