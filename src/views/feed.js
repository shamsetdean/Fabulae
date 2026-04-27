import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export const feedView = () => ({
  entries: [],
  loading: true,
  error: null,
  filter: 'all', // 'all' | 'recommended' | 'not_recommended'

  async init() {
    await this.load()
  },

  async load() {
    this.loading = true
    this.error = null
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; return }

    try {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', me)

      const userIds = [me, ...(follows || []).map(f => f.following_id)]

      const { data, error } = await supabase
        .from('feed_recent_additions')
        .select('*')
        .in('user_id', userIds)
        .limit(80)

      if (error) throw error

      const hydrated = await Promise.all((data || []).map(async (row) => {
        const show = await getShowCard(row.tmdb_id)
        return show ? { ...row, show } : null
      }))

      this.entries = hydrated.filter(Boolean)
    } catch (e) {
      console.warn('[Feed] load error', e)
      this.error = e.message
    } finally {
      this.loading = false
    }
  },

  get filtered() {
    const list = (this.entries || []).filter(e => e && e.show)
    if (this.filter === 'recommended') return list.filter(e => e.recommendation === 'recommended')
    if (this.filter === 'not_recommended') return list.filter(e => e.recommendation === 'not_recommended')
    return list
  },

  formatRelativeDate(dateStr) {
    if (!dateStr) return ''
    const now = Date.now()
    const then = new Date(dateStr).getTime()
    const diff = now - then
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "a l'instant"
    if (minutes < 60) return 'il y a ' + minutes + ' min'
    if (hours < 24) return 'il y a ' + hours + 'h'
    if (days < 7) return 'il y a ' + days + 'j'
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }
})

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}
