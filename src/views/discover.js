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
      this.trendingShows = (data?.results || []).slice(0, 20).map(r => ({
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
        this.searchResults = (data?.results || []).slice(0, 20).map(r => ({
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
    // Ouvre le modal classifier global (déjà existant dans l'app)
    const store = window.Alpine.store('app')
    store.openClassifier({
      tmdb_id: show.id,
      show: {
        id: show.id,
        name: show.name,
        poster: show.poster,
        year: show.year,
        overview: show.overview
      },
      onSaved: () => {
        // Une fois ajoutée, on met à jour notre set local
        this.myLibraryIds.add(show.id)
        this.myLibraryIds = new Set(this.myLibraryIds)
      }
    })
  }
})
