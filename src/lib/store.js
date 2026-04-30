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
    _profileLoadAttempted: false,
    _profileLoading: false,
    route: parseHash(),
    toast: null,
    unreadCount: 0,
    _unreadInterval: null,

    // PWA : nouvelle version disponible
    updateAvailable: false,
    applyingUpdate: false,

    async init() {
      const localSession = readSessionFromLocalStorage()
      if (localSession) this.session = localSession

      this.authReady = true
      this.route = parseHash()

      window.addEventListener('hashchange', () => {
        this.route = parseHash()
        window.scrollTo({ top: 0, behavior: 'instant' })
        if (this.session) this.refreshUnreadCount()
      })

      if (this.session) {
        await this.loadProfile()
        this.refreshUnreadCount()
        if (!this._unreadInterval) {
          this._unreadInterval = setInterval(() => this.refreshUnreadCount(), 30000)
        }
      } else {
        this.profileReady = true
        this._profileLoadAttempted = true
      }

      this._enforceGuardsOnce()

      if (!window.location.hash) {
        window.location.hash = this.session ? '#/feed' : '#/auth'
      }

      supabase.auth.getSession()
        .then(r => {
          const s = r?.data?.session
          if (s && (!this.session || s.access_token !== this.session.access_token)) {
            this.session = s
          }
        })
        .catch(() => {})

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.session = session
          this.loadProfile().then(() => {
            this.refreshUnreadCount()
            if (!this._unreadInterval) {
              this._unreadInterval = setInterval(() => this.refreshUnreadCount(), 30000)
            }
          }).catch(() => {})
        } else if (event === 'SIGNED_OUT') {
          this.session = null
          this.profile = null
          this.profileReady = true
          this._profileLoadAttempted = true
          this.unreadCount = 0
          if (this._unreadInterval) {
            clearInterval(this._unreadInterval)
            this._unreadInterval = null
          }
          if (window.location.hash !== '#/auth') {
            window.location.hash = '#/auth'
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          this.session = session
        }
      })
    },

    _enforceGuardsOnce() {
      const r = this.route.name

      if (!this.session && !PUBLIC_ROUTES.includes(r)) {
        if (window.location.hash !== '#/auth') window.location.hash = '#/auth'
        return
      }

      if (this.session && this._profileLoadAttempted && !this.profile && !PROFILE_EXEMPT_ROUTES.includes(r)) {
        if (window.location.hash !== '#/onboarding') window.location.hash = '#/onboarding'
        return
      }

      if (this.session && this.profile && r === 'onboarding') {
        if (window.location.hash !== '#/feed') window.location.hash = '#/feed'
      }
    },

    async loadProfile() {
      if (!this.session) {
        this.profile = null
        this.profileReady = true
        this._profileLoadAttempted = true
        return
      }

      if (this._profileLoading) return
      this._profileLoading = true

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', this.session.user.id)
          .maybeSingle()

        if (error) {
          console.warn('[Store] loadProfile error', error)
          this.profile = null
        } else {
          this.profile = data || null
        }
      } catch (e) {
        console.warn('[Store] loadProfile exception', e)
        this.profile = null
      } finally {
        this._profileLoading = false
        this.profileReady = true
        this._profileLoadAttempted = true
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

    // PWA : application de la mise à jour (skipWaiting + reload contrôlé)
    applyUpdate() {
      if (this.applyingUpdate) return
      this.applyingUpdate = true
      if (typeof window.__applyPWAUpdate === 'function') {
        window.__applyPWAUpdate()
      } else {
        location.reload()
      }
    },

    dismissUpdate() {
      this.updateAvailable = false
    },

    async signOut() {
      if (this._unreadInterval) {
        clearInterval(this._unreadInterval)
        this._unreadInterval = null
      }
      try { await supabase.auth.signOut() } catch (e) {}
      try {
        Object.keys(localStorage)
          .filter(k => /^sb-.*-auth-token$/.test(k))
          .forEach(k => localStorage.removeItem(k))
      } catch (e) {}
      this.session = null
      this.profile = null
      this.profileReady = true
      this._profileLoadAttempted = true
      window.location.hash = '#/auth'
    },

    get isAuthed() { return !!this.session }
  })
}
