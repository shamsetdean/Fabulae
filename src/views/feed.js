import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export function formatDate(iso) {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return Math.floor(diff / 60) + ' min'
  if (diff < 86400) return Math.floor(diff / 3600) + ' h'
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' j'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export const feedView = () => ({
  // Entrées regroupées : 1 par utilisateur, contient { user_id, username, top, flop, latestDate, like_count, liked_by_me }
  entries: [],
  loading: true,
  error: null,
  filter: 'all',     // 'all' | 'following'

  formatDate,

  async init() {
    await this.load()
  },

  async load() {
    this.loading = true
    this.error = null
    try {
      let query = supabase
        .from('top_lists_with_profile')
        .select('*')
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(80)

      if (this.filter === 'following') {
        const me = window.Alpine.store('app').session?.user?.id
        if (me) {
          const { data: follows } = await supabase
            .from('follows').select('following_id').eq('follower_id', me)
          const ids = (follows ?? []).map(f => f.following_id)
          if (ids.length === 0) {
            this.entries = []
            this.loading = false
            return
          }
          query = query.in('user_id', ids)
        }
      }

      const { data, error } = await query
      if (error) throw error

      // Regrouper par user_id : 1 entrée par user, contenant top et/ou flop
      const grouped = new Map()
      for (const list of (data || [])) {
        const key = list.user_id
        if (!grouped.has(key)) {
          grouped.set(key, {
            user_id: list.user_id,
            username: list.username,
            top: null,
            flop: null,
            latestDate: list.created_at
          })
        }
        const entry = grouped.get(key)
        if (list.kind === 'top') entry.top = list
        if (list.kind === 'flop') entry.flop = list
        // Conserve la date la plus récente entre top et flop
        if (new Date(list.created_at) > new Date(entry.latestDate)) {
          entry.latestDate = list.created_at
        }
      }

      // Hydrater chaque entrée avec les séries TMDB
      const list = Array.from(grouped.values())
      const hydrated = await Promise.all(list.map(async (entry) => {
        if (entry.top) {
          const [s1, s2, s3] = await Promise.all([
            getShowCard(entry.top.position_1_tmdb_id),
            getShowCard(entry.top.position_2_tmdb_id),
            getShowCard(entry.top.position_3_tmdb_id)
          ])
          entry.top.shows = [s1, s2, s3]
        }
        if (entry.flop) {
          const [s1, s2, s3] = await Promise.all([
            getShowCard(entry.flop.position_1_tmdb_id),
            getShowCard(entry.flop.position_2_tmdb_id),
            getShowCard(entry.flop.position_3_tmdb_id)
          ])
          entry.flop.shows = [s1, s2, s3]
        }
        return entry
      }))

      // Trier par date la plus récente
      hydrated.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate))
      this.entries = hydrated
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  },

  // Like sur le top OU le flop d'une entrée
  async toggleLike(list) {
    if (!list) return
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) return
    if (list.liked_by_me) {
      await supabase.from('likes').delete().eq('user_id', me).eq('top_list_id', list.id)
      list.liked_by_me = false
      list.like_count = Math.max(0, list.like_count - 1)
    } else {
      const { error } = await supabase.from('likes').insert({ user_id: me, top_list_id: list.id })
      if (!error) {
        list.liked_by_me = true
        list.like_count = (list.like_count || 0) + 1
      }
    }
  },

  setFilter(f) { this.filter = f; this.load() }
})
