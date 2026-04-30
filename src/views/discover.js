import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'
import { generateRecommendations, invalidateProfileCache } from '../lib/recommender.js'

export const discoverView = () => ({
  // Recherche
  searchQuery: '',
  searchResults: [],
  searching: false,
  searchTimer: null,

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

  // Série sélectionnée pour classification (apparaît en haut)
  selectedShow: null,
  selStatus: 'watching',
  selRating: 0,
  selRecommendation: null,
  selSaving: false,

  async init() {
    await this.loadMyLibrary()
    // Lancement en parallèle — les recos n'attendent pas les tendances
    await Promise.all([
      this.loadTrending(),
      this.loadRecommendations()
    ])
    // Invalide le cache reco si la bibliothèque est mise à jour depuis une autre vue
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
          overview: r.overview || ''
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

  onSearchInput() {
    clearTimeout(this.searchTimer)
    const q = this.searchQuery.trim()
    if (q.length < 2) { this.searchResults = []; return }
    this.searching = true
    this.searchTimer = setTimeout(async () => {
      try {
        const data = await tmdbApi.searchTv(q)
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
        console.warn('[Discover] search error', e)
        this.searchResults = []
      } finally {
        this.searching = false
      }
    }, 300)
  },

  isInLibrary(tmdbId) {
    return this.myLibraryIds.has(tmdbId)
  },

  // Sélectionne une série → affichage modal de classification
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

      // Mise à jour locale instantanée
      this.myLibraryIds = new Set([...this.myLibraryIds, this.selectedShow.id])

      // Retire la série des trois listes
      const id = this.selectedShow.id
      this.searchResults   = this.searchResults.filter(s => s.id !== id)
      this.trendingShows   = this.trendingShows.filter(s => s.id !== id)
      this.recommendations = this.recommendations.filter(s => s.id !== id)

      // Invalide le cache profil si la série est bien notée (signal positif fort)
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
