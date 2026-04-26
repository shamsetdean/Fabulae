import { supabase } from '../lib/supabase.js'
import { getShowCard, tmdbApi } from '../lib/tmdb.js'

export const libraryView = () => ({
  filter: 'all',
  search: '',
  items: [],
  loading: true,
  error: null,

  // Recherche TMDB pour ajouter une série
  searchQuery: '',
  searchResults: [],
  searching: false,
  searchTimer: null,
  searchOpen: false,

  counts: {
    all: 0,
    watching: 0,
    finished: 0,
    recommended: 0,
    not_recommended: 0,
    abandoned: 0,
    wishlist: 0
  },

  async init() {
    await this.load()
    window.addEventListener('library:updated', () => this.load())
  },

  async load() {
    this.loading = true
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; return }

    const { data, error } = await supabase
      .from('library_items')
      .select('*')
      .eq('user_id', me)
      .order('updated_at', { ascending: false })

    if (error) {
      this.error = error.message
      this.loading = false
      return
    }

    const hydrated = await Promise.all((data || []).map(async (it) => {
      const show = await getShowCard(it.tmdb_id)
      return show ? { ...it, show } : null
    }))
    const all = hydrated.filter(Boolean)
    this.items = all

    this.counts = {
      all: all.length,
      watching: all.filter(i => i.status === 'watching').length,
      finished: all.filter(i => i.status === 'finished').length,
      recommended: all.filter(i => i.recommendation === 'recommended').length,
      not_recommended: all.filter(i => i.recommendation === 'not_recommended').length,
      abandoned: all.filter(i => i.status === 'abandoned').length,
      wishlist: all.filter(i => i.status === 'wishlist').length
    }

    this.loading = false
  },

  setFilter(f) { this.filter = f },

  get filtered() {
    let list = (this.items || []).filter(i => i && i.id && i.show)
    switch (this.filter) {
      case 'watching':
        list = list.filter(i => i.status === 'watching'); break
      case 'finished':
        list = list.filter(i => i.status === 'finished'); break
      case 'abandoned':
        list = list.filter(i => i.status === 'abandoned'); break
      case 'wishlist':
        list = list.filter(i => i.status === 'wishlist'); break
      case 'recommended':
        list = list.filter(i => i.recommendation === 'recommended'); break
      case 'not_recommended':
        list = list.filter(i => i.recommendation === 'not_recommended'); break
    }
    if (this.search.trim()) {
      const q = this.search.trim().toLowerCase()
      list = list.filter(i => i.show?.name?.toLowerCase().includes(q))
    }
    return list
  },

  // Ouvre/ferme la barre de recherche TMDB
  toggleSearch() {
    this.searchOpen = !this.searchOpen
    if (!this.searchOpen) {
      this.searchQuery = ''
      this.searchResults = []
    } else {
      // Focus auto sur l'input après ouverture
      setTimeout(() => {
        const input = document.getElementById('library-search-input')
        if (input) input.focus()
      }, 100)
    }
  },

  closeSearch() {
    this.searchOpen = false
    this.searchQuery = ''
    this.searchResults = []
  },

  // Recherche TMDB avec debounce
  onSearchInput() {
    clearTimeout(this.searchTimer)
    const q = this.searchQuery.trim()
    if (q.length < 2) {
      this.searchResults = []
      this.searching = false
      return
    }
    this.searching = true
    this.searchTimer = setTimeout(async () => {
      try {
        const data = await tmdbApi.searchTv(q)
        this.searchResults = (data?.results || []).slice(0, 12).map(r => ({
          id: r.id,
          name: r.name,
          year: r.first_air_date ? r.first_air_date.slice(0, 4) : '',
          poster: r.poster_path ? tmdbApi.poster(r.poster_path, 'w154') : null,
          overview: r.overview
        }))
      } catch (e) {
        console.warn('[Library search]', e)
        this.searchResults = []
      } finally {
        this.searching = false
      }
    }, 300)
  },

  // Détecte si une série est déjà en bibliothèque
  isInLibrary(tmdbId) {
    return this.items.some(i => i.tmdb_id === tmdbId)
  },

  // Clic sur un résultat → ouvre directement le modal de classement
  pickResult(show) {
    if (window.openClassifier) {
      window.openClassifier(show.id, {
        id: show.id,
        name: show.name,
        poster_path: show.poster ? show.poster.replace('https://image.tmdb.org/t/p/w154', '') : null,
        first_air_date: show.year ? show.year + '-01-01' : null
      })
    }
    this.closeSearch()
  },

  async incrementEpisode(item) {
    const newEp = (item.current_episode || 0) + 1
    const { error } = await supabase
      .from('library_items')
      .update({ current_episode: newEp })
      .eq('id', item.id)
    if (!error) item.current_episode = newEp
  },

  providerLogoUrl(path) {
    return path ? `https://image.tmdb.org/t/p/w92${path}` : null
  }
})
