import { supabase } from './supabase.js'
import { fetchUnreadCount } from '../views/notifications.js'

function parseHash() {
  const h = window.location.hash.replace(/^#/, '') || '/feed'
  const parts = h.split('/').filter(Boolean)
  const name = parts[0] || 'feed'
  const params = parts.slice(1)
  return { name, params }
}

// Routes qui n'exigent pas de profil complet
const PROFILE_EXEMPT_ROUTES = ['auth', 'onboarding', 'legal']

export function initStore(Alpine) {
  Alpine.store('app', {
    session: null,
    profile: null,
    authReady: false,
    profileReady: false,     // nouveau : permet de distinguer "pas de profil" vs "en cours de chargement"
    route: parseHash(),
    toast: null,
    unreadCount: 0,
    _unreadInterval: null,

    async init() {
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
      }

      // Listener sur les changements d'auth
      supabase.auth.onAuthStateChange(async (event, session) => {
        this.session = session
        if (session) {
          await this.loadProfile()
          this.refreshUnreadCount()
        } else {
          this.profile = null
          this.profileReady = false
          this.unreadCount = 0
          if (this._unreadInterval) clearInterval(this._unreadInterval)
        }
      })

      window.addEventListener('hashchange', () => {
        this.route = parseHash()
        window.scrollTo({ top: 0, behavior: 'instant' })
        if (this.session) this.refreshUnreadCount()
      })

      // Redirection initiale (une seule fois au démarrage)
      if (!window.location.hash) {
        window.location.hash = this.session ? '#/feed' : '#/auth'
      } else {
        // Gestion cohérente des redirections après chargement initial
        this._enforceGuards()
      }
    },

    /**
     * Force la bonne route selon l'état auth/profil.
     * N'intervient que si on est bloqué dans un état incohérent.
     */
    _enforceGuards() {
      const r = this.route.name

      // Non authentifié → forcer auth sauf pour routes publiques
      if (!this.session && !['auth', 'legal'].includes(r)) {
        window.location.hash = '#/auth'
        return
      }

      // Authentifié mais sans profil → forcer onboarding sauf si déjà dessus ou sur legal
      if (this.session && this.profileReady && !this.profile && !['onboarding', 'legal', 'auth'].includes(r)) {
        window.location.hash = '#/onboarding'
        return
      }

      // Authentifié + profil OK mais sur onboarding → rediriger vers feed
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
        // Après chargement, on applique les guards si besoin
        this._enforceGuards()
      }
    },

    async refreshUnreadCount() {
      try {
        this.unreadCount = await fetchUnreadCount()
      } catch (e) {
        // Silencieux : ne casse pas l'app si les notifs échouent
      }
    },

    navigate(path) { window.location.hash = path },

    showToast(message, type = 'info') {
      this.toast = { message, type }
      setTimeout(() => { this.toast = null }, 3200)
    },

    async signOut() {
      if (this._unreadInterval) clearInterval(this._unreadInterval)
      await supabase.auth.signOut()
      window.location.hash = '#/auth'
    },

    get isAuthed() { return !!this.session }
  })
}
