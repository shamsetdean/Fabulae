import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export const feedView = () => ({
  // ── Fil d'activité ────────────────────────────────────────────────────────
  entries: [],
  loading: true,
  error: null,
  filter: 'all', // 'all' | 'recommended' | 'not_recommended'

  // ── Nouveaux membres ──────────────────────────────────────────────────────
  newMembers: [],
  newMembersLoading: false,
  followingIds: new Set(),
  followingInProgress: new Set(),

  async init() {
    await Promise.all([
      this.load(),
      this.loadNewMembers()
    ])
  },

  // ── Chargement du fil ─────────────────────────────────────────────────────

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

  // ── Nouveaux membres ──────────────────────────────────────────────────────

  async loadNewMembers() {
    this.newMembersLoading = true
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.newMembersLoading = false; return }
    try {
      // Abonnements actuels pour état initial des boutons
      const { data: myFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', me)
      this.followingIds = new Set((myFollows || []).map(f => f.following_id))

      // Membres inscrits dans les 14 derniers jours, hors soi-même
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio, created_at')
        .neq('id', me)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(12)

      this.newMembers = profiles || []
    } catch (e) {
      console.warn('[Feed] loadNewMembers error', e)
      this.newMembers = []
    } finally {
      this.newMembersLoading = false
    }
  },

  // ── Follow / Unfollow inline ──────────────────────────────────────────────

  async toggleFollow(userId) {
    if (this.followingInProgress.has(userId)) return
    const me = window.Alpine.store('app').session?.user?.id
    if (!me || userId === me) return

    this.followingInProgress = new Set([...this.followingInProgress, userId])
    const wasFollowing = this.followingIds.has(userId)

    // Optimistic update
    if (wasFollowing) {
      this.followingIds.delete(userId)
    } else {
      this.followingIds.add(userId)
    }
    this.followingIds = new Set(this.followingIds)

    try {
      if (wasFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', me)
          .eq('following_id', userId)
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: me, following_id: userId })
      }
    } catch (e) {
      console.warn('[Feed] toggleFollow error', e)
      // Rollback
      if (wasFollowing) {
        this.followingIds.add(userId)
      } else {
        this.followingIds.delete(userId)
      }
      this.followingIds = new Set(this.followingIds)
    } finally {
      this.followingInProgress.delete(userId)
      this.followingInProgress = new Set(this.followingInProgress)
    }
  },

  // ── Helpers ───────────────────────────────────────────────────────────────

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
    if (minutes < 1) return "à l'instant"
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
