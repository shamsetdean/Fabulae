import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export const libraryView = () => ({
  filter: 'all',  // 'all' | 'watching' | 'finished' | 'recommended' | 'not_recommended' | 'abandoned' | 'wishlist'
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

    // Hydrater toutes les séries depuis TMDB
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
    let list = this.items
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

  // Incrémenter rapidement un épisode pour les séries en cours
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
