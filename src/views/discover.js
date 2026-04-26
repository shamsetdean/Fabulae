import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'

export const discoverView = () => ({
  // Recherche
  searchQuery: '',
  searchResults: [],
  searching: false,
  searchTimer: null,

  // Tendances par défaut
  trendingShows: [],
  trendingLoading: true,

  // État
  myLibraryIds: new Set(),

  async init() {
    await this.loadMyLibrary()
    await this.loadTrending()
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

  classify(show) {
    if (window.openClassifier) {
      window.openClassifier(show.id, {
        id: show.id,
        name: show.name,
        poster: show.poster,
        year: show.year,
        overview: show.overview
      })
      // Une fois le modal classifier fermé après ajout, on rafraîchit la
      // bibliothèque locale et on retire la série des listes affichées
      setTimeout(async () => {
        await this.loadMyLibrary()
        this.searchResults = this.searchResults.filter(s => !this.myLibraryIds.has(s.id))
        this.trendingShows = this.trendingShows.filter(s => !this.myLibraryIds.has(s.id))
      }, 800)
    }
  }
})
