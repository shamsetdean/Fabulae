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
    window.addEventListener('library:updated', () => this.load())
  },

  async load() {
    this.loading = true
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; return }

    // Tri par date d'ajout DESC (les plus récentes en haut)
    const { data, error } = await supabase
      .from('library_items')
      .select('*')
      .eq('user_id', me)
      .order('created_at', { ascending: false })

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
