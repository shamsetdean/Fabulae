import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export const feedView = () => ({
  // ── Fil d'activité ────────────────────────────────────────────────────────
  entries: [],
  loading: true,
  error: null,
  filter: 'all',

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
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; return }

    this.error = null
    const cacheKey = `feed:${me}`
    const store = window.Alpine.store('app')

    try {
      const data = await store.cached(
        cacheKey,
        async () => this._fetchFeed(me),
        60_000,
        (fresh) => {
          // Revalidation : mise à jour silencieuse si les données ont changé
          this.entries = fresh
        }
      )
      this.entries = data
    } catch (e) {
      console.warn('[Feed] load error', e)
      this.error = e.message
    } finally {
      this.loading = false
    }
  },

  async _fetchFeed(me) {
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
    return hydrated.filter(Boolean)
  },

  // ── Nouveaux membres ──────────────────────────────────────────────────────

  async loadNewMembers() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.newMembersLoading = false; return }

    const cacheKey = `newMembers:${me}`
    const store = window.Alpine.store('app')

    try {
      const data = await store.cached(
        cacheKey,
        async () => this._fetchNewMembers(me),
        120_000, // 2 min : les nouveaux membres ne changent pas tous les instants
        (fresh) => {
          this.newMembers = fresh.profiles
          this.followingIds = new Set(fresh.followingIds)
        }
      )
      this.newMembers = data.profiles
      this.followingIds = new Set(data.followingIds)
    } catch (e) {
      console.warn('[Feed] loadNewMembers error', e)
      this.newMembers = []
    } finally {
      this.newMembersLoading = false
    }
  },

  async _fetchNewMembers(me) {
    const { data: myFollows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', me)
    const followingIds = (myFollows || []).map(f => f.following_id)

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio, created_at')
      .neq('id', me)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(12)

    return { profiles: profiles || [], followingIds }
  },

  // ── Follow / Unfollow inline ──────────────────────────────────────────────

  async toggleFollow(userId) {
    if (this.followingInProgress.has(userId)) return
    const me = window.Alpine.store('app').session?.user?.id
    if (!me || userId === me) return

    this.followingInProgress = new Set([...this.followingInProgress, userId])
    const wasFollowing = this.followingIds.has(userId)

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
      // Invalide les caches dépendants des follows
      const store = window.Alpine.store('app')
      store.cacheInvalidate(`feed:${me}`)
      store.cacheInvalidate(`newMembers:${me}`)
    } catch (e) {
      console.warn('[Feed] toggleFollow error', e)
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
