import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export const libraryView = () => ({
  filter: 'all',
  search: '',
  items: [],
  loading: true,
  error: null,
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
    window.addEventListener('library:updated', () => {
      // Quand la bibliothèque change ailleurs, on invalide le cache et on recharge
      const me = window.Alpine.store('app').session?.user?.id
      if (me) window.Alpine.store('app').cacheInvalidate(`library:${me}`)
      this.load()
    })
  },

  async load() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; return }

    const cacheKey = `library:${me}`
    const store = window.Alpine.store('app')

    try {
      const data = await store.cached(
        cacheKey,
        async () => this._fetchLibrary(me),
        60_000,
        (fresh) => {
          this.items = fresh
          this.counts = this._computeCounts(fresh)
        }
      )
      this.items = data
      this.counts = this._computeCounts(data)
    } catch (e) {
      console.warn('[Library] load error', e)
      this.error = e.message
    } finally {
      this.loading = false
    }
  },

  async _fetchLibrary(me) {
    const { data, error } = await supabase
      .from('library_items')
      .select('*')
      .eq('user_id', me)
      .order('created_at', { ascending: false })

    if (error) throw error

    const hydrated = await Promise.all((data || []).map(async (it) => {
      const show = await getShowCard(it.tmdb_id)
      return show ? { ...it, show } : null
    }))
    return hydrated.filter(Boolean)
  },

  _computeCounts(items) {
    return {
      all: items.length,
      watching: items.filter(i => i.status === 'watching').length,
      finished: items.filter(i => i.status === 'finished').length,
      recommended: items.filter(i => i.recommendation === 'recommended').length,
      not_recommended: items.filter(i => i.recommendation === 'not_recommended').length,
      abandoned: items.filter(i => i.status === 'abandoned').length,
      wishlist: items.filter(i => i.status === 'wishlist').length
    }
  },

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
      list = list.filter(i => (i.show?.name || '').toLowerCase().includes(q))
    }
    return list
  },

  statusLabel(status) {
    switch (status) {
      case 'watching': return 'En cours'
      case 'finished': return 'Terminée'
      case 'abandoned': return 'Abandonnée'
      case 'wishlist': return 'À voir'
      default: return status
    }
  },

  statusColor(status) {
    switch (status) {
      case 'watching': return 'text-flame-400'
      case 'finished': return 'text-green-400'
      case 'abandoned': return 'text-red-400'
      case 'wishlist': return 'text-cream-300/70'
      default: return 'text-cream-300/60'
    }
  }
})
