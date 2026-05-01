import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'

export const onboardingView = () => ({
  step: 1,
  totalSteps: 4,

  // Étape 1 — Profil
  username: '',
  bio: '',
  saving: false,
  error: null,

  // Étape 2 — Chercher des séries
  searchQuery: '',
  searchResults: [],
  searching: false,
  _searchTimer: null,
  _searchAbort: null,
  addedShows: [],
  addingId: null,

  // Étape 3 — Suivre des utilisateurs
  suggestedUsers: [],
  loadingUsers: false,
  followedIds: new Set(),
  followingId: null,

  get progressPercent() {
    return Math.round(((this.step - 1) / this.totalSteps) * 100)
  },

  get canProceedStep1() {
    return this.username.trim().length >= 3
  },

  get canProceedStep2() { return true },
  get canProceedStep3() { return true },

  async init() {
    const store = window.Alpine.store('app')
    if (store.profile?.username) {
      this.username = store.profile.username
      this.bio = store.profile.bio || ''
    }
    if (store.profile?.onboarding_done) {
      window.location.hash = '#/feed'
    }
  },

  // ─── ÉTAPE 1 : Profil ───────────────────────────────────────────────────

  async saveProfile() {
    if (!this.canProceedStep1) return
    this.saving = true
    this.error = null

    const store = window.Alpine.store('app')
    const me = store.session?.user?.id
    if (!me) { this.error = 'Session expirée'; this.saving = false; return }

    const cleanUsername = this.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleanUsername.length < 3) {
      this.error = 'Pseudo invalide (3 caractères min, lettres/chiffres/_)'
      this.saving = false
      return
    }

    try {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('username', cleanUsername).maybeSingle()

      if (existing && existing.id !== me) {
        this.error = 'Ce pseudo est déjà pris'
        this.saving = false
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: me, username: cleanUsername, bio: this.bio.trim() }, { onConflict: 'id' })
        .select().maybeSingle()

      if (error) throw error

      store.profile = data
      this.step = 2
      this.loadSuggestedUsers()
    } catch (e) {
      this.error = e.message || 'Erreur lors de la sauvegarde'
    } finally {
      this.saving = false
    }
  },

  // ─── ÉTAPE 2 : Recherche debounced + cancellable ─────────────────────────

  onSearchInput() {
    clearTimeout(this._searchTimer)
    if (this._searchAbort) {
      this._searchAbort.abort()
      this._searchAbort = null
    }

    const q = this.searchQuery.trim()
    if (q.length < 2) {
      this.searchResults = []
      this.searching = false
      return
    }

    this.searching = true
    this._searchTimer = setTimeout(() => this._runSearch(q), 300)
  },

  async _runSearch(q) {
    if (this.searchQuery.trim() !== q) return

    const controller = new AbortController()
    this._searchAbort = controller

    try {
      const data = await tmdbApi.searchTv(q, { signal: controller.signal })

      if (this.searchQuery.trim() !== q) return

      this.searchResults = (data?.results || []).slice(0, 8).map(r => ({
        id: r.id,
        name: r.name,
        year: r.first_air_date ? r.first_air_date.slice(0, 4) : '',
        poster: r.poster_path ? tmdbApi.poster(r.poster_path, 'w154') : null
      }))
    } catch (e) {
      if (e.name === 'AbortError') return
      console.warn('[Onboarding] search error', e)
      this.searchResults = []
    } finally {
      if (this.searchQuery.trim() === q) {
        this.searching = false
      }
      if (this._searchAbort === controller) {
        this._searchAbort = null
      }
    }
  },

  isAdded(showId) {
    return this.addedShows.some(s => s.id === showId)
  },

  async addShow(show) {
    if (this.isAdded(show.id)) return
    this.addingId = show.id
    const me = window.Alpine.store('app').session?.user?.id
    try {
      const { error } = await supabase.from('library_items').insert({
        user_id: me,
        tmdb_id: show.id,
        status: 'watching'
      })
      if (!error) this.addedShows.push(show)
    } catch (e) {
      console.warn('[Onboarding] addShow error', e)
    } finally {
      this.addingId = null
    }
  },

  proceedStep2() { this.step = 3 },

  // ─── ÉTAPE 3 : Suivre des utilisateurs ──────────────────────────────────

  async loadSuggestedUsers() {
    this.loadingUsers = true
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .neq('id', window.Alpine.store('app').session?.user?.id)
        .not('username', 'is', null)
        .limit(12)

      this.suggestedUsers = data || []
    } catch (e) {
      console.warn('[Onboarding] loadSuggestedUsers error', e)
    } finally {
      this.loadingUsers = false
    }
  },

  isFollowed(userId) { return this.followedIds.has(userId) },

  async toggleFollowUser(userId) {
    this.followingId = userId
    const me = window.Alpine.store('app').session?.user?.id
    try {
      if (this.isFollowed(userId)) {
        await supabase.from('follows').delete()
          .eq('follower_id', me).eq('following_id', userId)
        this.followedIds.delete(userId)
        this.followedIds = new Set(this.followedIds)
      } else {
        await supabase.from('follows').insert({ follower_id: me, following_id: userId })
        this.followedIds.add(userId)
        this.followedIds = new Set(this.followedIds)
      }
    } catch (e) {
      console.warn('[Onboarding] followUser error', e)
    } finally {
      this.followingId = null
    }
  },

  proceedStep3() { this.step = 4 },

  // ─── ÉTAPE 4 : Terminer ─────────────────────────────────────────────────

  async finish(goToTop3 = false) {
    const me = window.Alpine.store('app').session?.user?.id
    try {
      await supabase.from('profiles')
        .update({ onboarding_done: true })
        .eq('id', me)
      if (window.Alpine.store('app').profile) {
        window.Alpine.store('app').profile.onboarding_done = true
      }
    } catch (e) {
      console.warn('[Onboarding] finish error', e)
    }
    window.location.hash = goToTop3 ? '#/top3' : '#/feed'
  }
})
