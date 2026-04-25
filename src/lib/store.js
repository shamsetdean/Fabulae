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

function readSessionFromLocalStorage() {
  try {
    const keys = Object.keys(localStorage)
    const tokenKey = keys.find(k => /^sb-.*-auth-token$/.test(k))
    if (!tokenKey) return null
    const raw = localStorage.getItem(tokenKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.access_token || !parsed.user) return null
    if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) return null
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      expires_at: parsed.expires_at,
      user: parsed.user
    }
  } catch (e) {
    return null
  }
}

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
    _profileLoading: false,
    _profileLastLoadedFor: null,
    _redirectInProgress: false,
    _lastRedirectTarget: null,
    _redirectCount: 0,
    _redirectResetTimer: null,

    async init() {
      const localSession = readSessionFromLocalStorage()
      if (localSession) this.session = localSession

      this.authReady = true
      this.route = parseHash()

      window.addEventListener('hashchange', () => {
        this.route = parseHash()
        window.scrollTo({ top: 0, behavior: 'instant' })
        if (this.session) this.refreshUnreadCount()
        // Évalue les guards uniquement après changement de route effectif
        // (ne déclenche pas de nouvelle redirection si pas nécessaire)
        this._enforceGuards()
      })

      if (this.session) {
        this._loadProfileSafe()
      } else {
        this.profileReady = true
        this._enforceGuards()
      }

      supabase.auth.getSession()
        .then(r => {
          const s = r?.data?.session
          if (s && (!this.session || s.access_token !== this.session.access_token)) {
            this.session = s
            this._loadProfileSafe()
          }
        })
        .catch(() => {})

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          this.session = session
          this._loadProfileSafe()
        } else if (event === 'SIGNED_OUT') {
          this.session = null
          this.profile = null
          this.profileReady = true
          this.unreadCount = 0
          if (this._unreadInterval) {
            clearInterval(this._unreadInterval)
            this._unreadInterval = null
          }
          this._safeRedirect('#/auth')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          this.session = session
        }
      })

      if (!window.location.hash) {
        const target = this.session ? '#/feed' : '#/auth'
        this._safeRedirect(target)
      }
    },

    _loadProfileSafe() {
      // Évite les rechargements concurrents pour la même session
      const userId = this.session?.user?.id
      if (!userId) return
      if (this._profileLastLoadedFor === userId && this.profile) {
        this.profileReady = true
        this._enforceGuards()
        return
      }
      this.loadProfile()
        .then(() => {
          this.refreshUnreadCount()
          if (!this._unreadInterval) {
            this._unreadInterval = setInterval(() => this.refreshUnreadCount(), 30000)
          }
        })
        .catch(e => console.warn('[Store] loadProfile failed', e))
    },

    // Redirection sécurisée : empêche les boucles infinies
    _safeRedirect(target) {
      if (this._redirectInProgress) return
      const current = window.location.hash || ''
      if (current === target) return

      // Détection de boucle : si on redirige plus de 3 fois vers la même cible en 2s, on stoppe
      if (this._lastRedirectTarget === target) {
        this._redirectCount++
        if (this._redirectCount > 3) {
          console.warn('[Store] redirect loop detected, stopping at', target)
          return
        }
      } else {
        this._lastRedirectTarget = target
        this._redirectCount = 1
      }

      clearTimeout(this._redirectResetTimer)
      this._redirectResetTimer = setTimeout(() => {
        this._redirectCount = 0
        this._lastRedirectTarget = null
      }, 2000)

      this._redirectInProgress = true
      window.location.hash = target
      // Libère le verrou après le tick suivant
      setTimeout(() => { this._redirectInProgress = false }, 50)
    },

    _enforceGuards() {
      // Ne fait rien tant que profileReady n'est pas vrai (évite redirections prématurées)
      if (!this.authReady) return

      const r = this.route.name

      if (!this.session && !PUBLIC_ROUTES.includes(r)) {
        this._safeRedirect('#/auth')
        return
      }

      if (this.session && this.profileReady && !this.profile && !PROFILE_EXEMPT_ROUTES.includes(r)) {
        this._safeRedirect('#/onboarding')
        return
      }

      if (this.session && this.profile && r === 'onboarding') {
        this._safeRedirect('#/feed')
      }
    },

    async loadProfile() {
      if (!this.session) {
        this.profile = null
        this.profileReady = true
        this._enforceGuards()
        return
      }

      if (this._profileLoading) return
      this._profileLoading = true
      const userId = this.session.user.id

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.warn('[Store] loadProfile error', error)
          this.profile = null
        } else {
          this.profile = data || null
          this._profileLastLoadedFor = userId
        }
      } catch (e) {
        console.warn('[Store] loadProfile exception', e)
        this.profile = null
      } finally {
        this._profileLoading = false
        this.profileReady = true
        this._enforceGuards()
      }
    },

    async refreshUnreadCount() {
      try {
        this.unreadCount = await fetchUnreadCount()
      } catch (e) {}
    },

    navigate(path) { this._safeRedirect(path) },

    showToast(message, type = 'info') {
      this.toast = { message, type }
      setTimeout(() => { this.toast = null }, 3200)
    },

    async signOut() {
      if (this._unreadInterval) {
        clearInterval(this._unreadInterval)
        this._unreadInterval = null
      }
      try {
        await supabase.auth.signOut()
      } catch (e) {}
      try {
        const keys = Object.keys(localStorage)
        keys.filter(k => /^sb-.*-auth-token$/.test(k)).forEach(k => localStorage.removeItem(k))
      } catch (e) {}
      this.session = null
      this.profile = null
      this.profileReady = true
      this._profileLastLoadedFor = null
      this._safeRedirect('#/auth')
    },

    get isAuthed() { return !!this.session }
  })
}
