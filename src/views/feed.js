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
  lists: [],
  loading: true,
  error: null,
  filter: 'all',       // 'all' | 'following'
  kindFilter: 'all',   // 'all' | 'top' | 'flop'

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
        .limit(40)

      if (this.kindFilter !== 'all') {
        query = query.eq('kind', this.kindFilter)
      }

      if (this.filter === 'following') {
        const me = window.Alpine.store('app').session?.user?.id
        if (me) {
          const { data: follows } = await supabase
            .from('follows').select('following_id').eq('follower_id', me)
          const ids = (follows ?? []).map(f => f.following_id)
          if (ids.length === 0) {
            this.lists = []
            this.loading = false
            return
          }
          query = query.in('user_id', ids)
        }
      }

      const { data, error } = await query
      if (error) throw error

      const hydrated = await Promise.all((data || []).map(async (list) => {
        const [s1, s2, s3] = await Promise.all([
          getShowCard(list.position_1_tmdb_id),
          getShowCard(list.position_2_tmdb_id),
          getShowCard(list.position_3_tmdb_id)
        ])
        return { ...list, shows: [s1, s2, s3] }
      }))
      this.lists = hydrated
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  },

  async toggleLike(list) {
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

  setFilter(f) { this.filter = f; this.load() },
  setKindFilter(k) { this.kindFilter = k; this.load() }
})
