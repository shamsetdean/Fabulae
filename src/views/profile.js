import { supabase } from '../lib/supabase.js'
import { getShowCard } from '../lib/tmdb.js'

export const profileView = () => ({
  profile: null,
  currentTop: null,
  currentFlop: null,
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

      // Récupérer Top 3 ET Flop 3 courants
      const { data: currents } = await supabase
        .from('top_lists').select('*')
        .eq('user_id', profile.id).eq('is_current', true)

      const topList = (currents || []).find(l => l.kind === 'top')
      const flopList = (currents || []).find(l => l.kind === 'flop')

      if (topList) {
        const shows = await Promise.all([
          getShowCard(topList.position_1_tmdb_id),
          getShowCard(topList.position_2_tmdb_id),
          getShowCard(topList.position_3_tmdb_id)
        ])
        this.currentTop = { ...topList, shows }
      }
      if (flopList) {
        const shows = await Promise.all([
          getShowCard(flopList.position_1_tmdb_id),
          getShowCard(flopList.position_2_tmdb_id),
          getShowCard(flopList.position_3_tmdb_id)
        ])
        this.currentFlop = { ...flopList, shows }
      }

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
