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

// ============================================================================
// CACHE TTL en mémoire avec stale-while-revalidate
// ============================================================================
const _cache = new Map()
const _inflight = new Map()

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

    // PWA
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
          this.cacheClear()
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

    // ========================================================================
    // CACHE API : stale-while-revalidate
    // ========================================================================
    //
    // Usage dans une vue :
    //   const data = await this.$store.app.cached('feed:user123', fetcher, 60_000, (fresh) => {
    //     this.entries = fresh   // callback déclenché si le refresh a changé les données
    //   })
    //
    //  - Si cache hit + fresh → retourne immédiatement, pas de fetch
    //  - Si cache hit + stale (TTL dépassé) → retourne le cache, refresh en arrière-plan
    //  - Si cache miss → fetch normal
    //  - Coalescing : si plusieurs appels simultanés sur la même clé, un seul fetch est lancé
    //
    async cached(key, fetcher, ttl = 60_000, onRevalidate = null) {
      const now = Date.now()
      const entry = _cache.get(key)

      // Cache hit + frais : retour immédiat, pas de revalidation
      if (entry && (now - entry.ts) < ttl) {
        return entry.data
      }

      // Cache hit mais stale : retour immédiat + revalidation silencieuse en arrière-plan
      if (entry) {
        if (!_inflight.has(key)) {
          const p = Promise.resolve()
            .then(() => fetcher())
            .then(fresh => {
              _cache.set(key, { data: fresh, ts: Date.now() })
              if (onRevalidate && JSON.stringify(fresh) !== JSON.stringify(entry.data)) {
                try { onRevalidate(fresh) } catch (e) { console.warn('[Cache] onRevalidate error', e) }
              }
              return fresh
            })
            .catch(e => {
              console.warn('[Cache] revalidate error for', key, e)
            })
            .finally(() => _inflight.delete(key))
          _inflight.set(key, p)
        }
        return entry.data
      }

      // Cache miss : fetch normal, coalescing si plusieurs appels parallèles
      if (_inflight.has(key)) {
        return _inflight.get(key)
      }
      const p = Promise.resolve()
        .then(() => fetcher())
        .then(fresh => {
          _cache.set(key, { data: fresh, ts: Date.now() })
          return fresh
        })
        .finally(() => _inflight.delete(key))
      _inflight.set(key, p)
      return p
    },

    // Invalide une clé ou toutes les clés correspondant à un préfixe
    cacheInvalidate(keyOrPrefix) {
      if (!keyOrPrefix) return
      if (_cache.has(keyOrPrefix)) {
        _cache.delete(keyOrPrefix)
        return
      }
      for (const k of _cache.keys()) {
        if (k.startsWith(keyOrPrefix)) _cache.delete(k)
      }
    },

    cacheClear() {
      _cache.clear()
      _inflight.clear()
    },

    // PWA
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
      this.cacheClear()
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
