import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export const profileView = () => ({
  profile: null,
  currentTop: null,
  history: [],
  counts: { followers: 0, following: 0 },
  isMe: false,
  isFollowing: false,
  loading: true,
  error: null,

  async init() {
    const me = window.Alpine.store('app').session?.user?.id
    const route = window.Alpine.store('app').route
    let targetUsername = null

    if (route.name === 'u') {
      targetUsername = route.params[0]
    } else {
      const myProfile = window.Alpine.store('app').profile
      targetUsername = myProfile?.username
    }

    if (!targetUsername) { this.error = 'Profil introuvable'; this.loading = false; return }

    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles').select('*').eq('username', targetUsername).maybeSingle()
      if (pErr) throw pErr
      if (!profile) throw new Error('Utilisateur inconnu')
      this.profile = profile
      this.isMe = profile.id === me

      const { data: currentTopList } = await supabase
        .from('top_lists').select('*').eq('user_id', profile.id).eq('is_current', true).maybeSingle()
      if (currentTopList) {
        const shows = await Promise.all([
          getShowCard(currentTopList.position_1_tmdb_id),
          getShowCard(currentTopList.position_2_tmdb_id),
          getShowCard(currentTopList.position_3_tmdb_id)
        ])
        this.currentTop = { ...currentTopList, shows }
      }

      const { data: hist } = await supabase
        .from('top_lists').select('*').eq('user_id', profile.id).eq('is_current', false)
        .order('created_at', { ascending: false }).limit(10)
      this.history = hist || []

      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id)
      ])
      this.counts = { followers: followers || 0, following: following || 0 }

      if (me && !this.isMe) {
        const { data: f } = await supabase.from('follows').select('*')
          .eq('follower_id', me).eq('following_id', profile.id).maybeSingle()
        this.isFollowing = !!f
      }
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  },

  async toggleFollow() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me || this.isMe) return
    if (this.isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', me).eq('following_id', this.profile.id)
      this.isFollowing = false
      this.counts.followers = Math.max(0, this.counts.followers - 1)
    } else {
      await supabase.from('follows').insert({ follower_id: me, following_id: this.profile.id })
      this.isFollowing = true
      this.counts.followers += 1
    }
  }
})
