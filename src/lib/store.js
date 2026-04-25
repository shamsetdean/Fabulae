import { supabase } from './supabase.js'
import { fetchUnreadCount } from '../views/notifications.js'

function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || '/feed'
  const parts = h.split('/').filter(Boolean)
  const name = parts[0] || 'feed'
  const params = parts.slice(1)
  return { name, params }
}

// Routes publiques accessibles sans authentification
const PUBLIC_ROUTES = ['auth', 'legal']
// Routes qui n'exigent pas un profil complet
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
      // 1. Marquer authReady IMMÉDIATEMENT pour débloquer le rendu UI
      // Le splash screen disparaît dès que authReady = true
      // La session sera chargée en arrière-plan
      this._removeSplash()

      // 2. Lancer la résolution de session sans bloquer le rendu
      this._loadSessionAsync()

      // 3. Listener sur les changements d'auth
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

      // 4. Routing
      window.addEventListener('hashchange', () => {
        this.route = parseHash()
        window.scrollTo({ top: 0, behavior: 'instant' })
        if (this.session) this.refreshUnreadCount()
      })

      // 5. Redirection initiale si hash vide (dépend de session, donc en post-load)
      if (!window.location.hash) {
        // On attend juste 1 tick pour laisser la session se résoudre
        await Promise.resolve()
        window.location.hash = this.session ? '#/feed' : '#/auth'
      }
    },

    // Charge la session de manière non-bloquante
    async _loadSessionAsync() {
      try {
        const { data } = await supabase.auth.getSession()
        this.session = data.session
        if (this.session) {
          await this.loadProfile()
          this.refreshUnreadCount()
          this._unreadInterval = setInterval(() => this.refreshUnreadCount(), 30000)
        }
      } catch (e) {
        console.warn('[Store] init session error', e)
      } finally {
        this.authReady = true
        this._enforceGuards()
      }
    },

    _removeSplash() {
      // Retire le splash screen HTML après le premier rendu
      requestAnimationFrame(() => {
        document.body.classList.add('app-ready')
        const splash = document.getElementById('initial-splash')
        if (splash) {
          // Le splash a déjà sa propre animation fadeOut, on le retire physiquement après
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
      } catch (e) {
        // Silencieux : ne casse pas l'app
      }
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
