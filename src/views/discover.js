import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'
import { generateRecommendations, invalidateProfileCache, buildUserProfile, computeCompatibility } from '../lib/recommender.js'

export const discoverView = () => ({
  // Recherche
  searchQuery: '',
  searchResults: [],
  searching: false,
  _searchTimer: null,
  _searchAbort: null,

  // Profil utilisateur pour calcul de compatibilité
  _userProfile: null,

  // Genres TMDB disponibles dans Discover
  genres: [
    { id: null,  name: 'Tout' },
    { id: 35,    name: 'Comédie' },
    { id: 18,    name: 'Drame' },
    { id: 80,    name: 'Crime' },
    { id: 10765, name: 'Sci-Fi' },
    { id: 9648,  name: 'Mystère' },
    { id: 10759, name: 'Action' },
    { id: 10768, name: 'Guerre' },
    { id: 16,    name: 'Animation' },
    { id: 99,    name: 'Documentaire' },
  ],

  // Tendances par défaut
  trendingShows: [],
  trendingLoading: true,

  // Recommandations personnalisées
  recommendations: [],
  recoLoading: false,
  recoLoaded: false,
  recoReason: null,

  // État
  myLibraryIds: new Set(),

  // Série sélectionnée pour classification
  selectedShow: null,
  selStatus: 'watching',
  selRating: 0,
  selRecommendation: null,
  selSaving: false,

  async init() {
    await this.loadMyLibrary()
    // Charge le profil utilisateur pour le calcul de compatibilité (sans bloquer)
    const me = window.Alpine.store('app').session?.user?.id
    if (me) {
      buildUserProfile(me).then(p => { this._userProfile = p }).catch(() => {})
    }
    await Promise.all([
      this.loadTrending(),
      this.loadRecommendations()
    ])
    window.addEventListener('library:updated', () => {
      const userId = window.Alpine.store('app').session?.user?.id
      if (userId) invalidateProfileCache(userId)
      this.recoLoaded = false
      this.recommendations = []
      this.loadRecommendations()
    })
  },

  async loadMyLibrary() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) return
    try {
      const { data } = await supabase
        .from('library_items')
        .select('tmdb_id')
        .eq('user_id', me)
      this.myLibraryIds = new Set((data || []).map(i => i.tmdb_id))
    } catch (e) {
      console.warn('[Discover] loadMyLibrary error', e)
    }
  },

  async loadTrending() {
    this.trendingLoading = true
    try {
      const data = await tmdbApi.getTrending()
      this.trendingShows = (data?.results || [])
        .filter(r => !this.myLibraryIds.has(r.id))
        .slice(0, 20)
        .map(r => ({
          id: r.id,
          name: r.name,
          year: r.first_air_date ? r.first_air_date.slice(0, 4) : '',
          poster: r.poster_path ? tmdbApi.poster(r.poster_path, 'w342') : null,
          overview: r.overview || '',
          genre_ids: r.genre_ids || []
        }))
    } catch (e) {
      console.warn('[Discover] loadTrending error', e)
      this.trendingShows = []
    } finally {
      this.trendingLoading = false
    }
  },

  async loadRecommendations() {
    if (this.recoLoading || this.recoLoaded) return
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) return

    this.recoLoading = true
    try {
      const { results, reason } = await generateRecommendations(me, { limit: 3 })
      this.recommendations = results
      this.recoReason = reason
      this.recoLoaded = true
    } catch (e) {
      console.warn('[Discover] loadRecommendations error', e)
      this.recommendations = []
      this.recoReason = 'error'
      this.recoLoaded = true
    } finally {
      this.recoLoading = false
    }
  },

  // ─── Recherche debounced + cancellable ─────────────────────────────────
  // Pattern complet :
  //  1. clearTimeout : annule le prochain appel programmé
  //  2. abort() : annule la requête réseau en cours (évite race condition)
  //  3. nouveau setTimeout 300ms : démarre la nouvelle recherche

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
    // Vérifie que la query est toujours d'actualité (l'utilisateur a pu effacer)
    if (this.searchQuery.trim() !== q) return

    const controller = new AbortController()
    this._searchAbort = controller

    try {
      const data = await tmdbApi.searchTv(q, { signal: controller.signal })

      // Vérifie une seconde fois : la requête a pu prendre du temps,
      // l'utilisateur a peut-être déjà tapé autre chose
      if (this.searchQuery.trim() !== q) return

      this.searchResults = (data?.results || [])
        .filter(r => !this.myLibraryIds.has(r.id))
        .slice(0, 20)
        .map(r => ({
          id: r.id,
          name: r.name,
          year: r.first_air_date ? r.first_air_date.slice(0, 4) : '',
          poster: r.poster_path ? tmdbApi.poster(r.poster_path, 'w342') : null,
          overview: r.overview || ''
        }))
    } catch (e) {
      if (e.name === 'AbortError') return // Annulation normale, silencieux
      console.warn('[Discover] search error', e)
      this.searchResults = []
    } finally {
      // Ne désactive le spinner que si on est toujours sur la même query
      if (this.searchQuery.trim() === q) {
        this.searching = false
      }
      if (this._searchAbort === controller) {
        this._searchAbort = null
      }
    }
  },

  isInLibrary(tmdbId) {
    return this.myLibraryIds.has(tmdbId)
  },

  // Recommandations enrichies avec % de compatibilité
  get recommendationsWithScore() {
    if (!this.recommendations.length) return []
    return this.recommendations.slice(0, 3).map(show => {
      const compat = this._userProfile
        ? computeCompatibility(show, this._userProfile)
        : null
      return { ...show, compatibility: compat }
    })
  },

  // Tendances filtrées par genre sélectionné
  get trendingFiltered() {
    if (!this.genreFilter) return this.trendingShows
    return this.trendingShows.filter(s =>
      (s.genre_ids || []).includes(this.genreFilter)
    )
  },

  select(show) {
    this.selectedShow = show
    this.selStatus = 'watching'
    this.selRating = 0
    this.selRecommendation = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },

  cancelSelection() {
    this.selectedShow = null
    this.selStatus = 'watching'
    this.selRating = 0
    this.selRecommendation = null
  },

  setRating(n) {
    this.selRating = this.selRating === n ? 0 : n
  },

  async saveSelection() {
    if (!this.selectedShow || this.selSaving) return
    this.selSaving = true
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.selSaving = false; return }

    try {
      const payload = {
        user_id: me,
        tmdb_id: this.selectedShow.id,
        status: this.selStatus,
        rating: this.selRating > 0 ? this.selRating : null,
        recommendation: this.selRecommendation
      }
      const { error } = await supabase.from('library_items').insert(payload)
      if (error) throw error

      this.myLibraryIds = new Set([...this.myLibraryIds, this.selectedShow.id])

      const id = this.selectedShow.id
      this.searchResults   = this.searchResults.filter(s => s.id !== id)
      this.trendingShows   = this.trendingShows.filter(s => s.id !== id)
      this.recommendations = this.recommendations.filter(s => s.id !== id)

      if (this.selRating >= 5) {
        invalidateProfileCache(me)
        this.recoLoaded = false
      }

      window.dispatchEvent(new CustomEvent('library:updated'))

      this.selectedShow = null
      this.selStatus = 'watching'
      this.selRating = 0
      this.selRecommendation = null
    } catch (e) {
      console.warn('[Discover] saveSelection error', e)
      alert("Erreur lors de l'ajout : " + (e.message || ''))
    } finally {
      this.selSaving = false
    }
  }
})
