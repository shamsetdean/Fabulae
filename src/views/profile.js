import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'
import { generateAlias } from '../lib/alias.js'

export const profileView = () => ({
  profile: null,
  currentTop: null,
  currentFlop: null,
  alias: null,
  counts: { followers: 0, following: 0 },
  isMe: false,
  isFollowing: false,
  loading: true,
  error: null,

  // Analyse des genres
  genreStats: [],          // [{name, count, percent, color}]
  genreNeverWatched: [],   // [{name, id}]
  totalSeriesAnalyzed: 0,
  analysisLoading: false,
  showAnalysis: false,
  togglingVisibility: false,

  async init() {
    this.loading = true
    this.error = null

    try {
      const store = window.Alpine.store('app')
      const me = store.session?.user?.id
      const route = store.route

      let targetUsername = null
      if (route?.name === 'u' && route.params?.[0]) {
        targetUsername = route.params[0]
      } else if (store.profile?.username) {
        targetUsername = store.profile.username
      } else if (me) {
        const { data: myProfile } = await supabase
          .from('profiles').select('username').eq('id', me).maybeSingle()
        if (myProfile?.username) targetUsername = myProfile.username
      }

      if (!targetUsername) {
        this.error = 'Profil introuvable'
        this.loading = false
        return
      }

      const { data: profile, error: pErr } = await supabase
        .from('profiles').select('*').eq('username', targetUsername).maybeSingle()

      if (pErr) throw pErr
      if (!profile) {
        this.error = 'Utilisateur inconnu'
        this.loading = false
        return
      }

      this.profile = profile
      this.isMe = profile.id === me

      // Top 3 + Flop 3
      const { data: currents } = await supabase
        .from('top_lists').select('*')
        .eq('user_id', profile.id).eq('is_current', true)

      const topList = (currents || []).find(l => l.kind === 'top')
      const flopList = (currents || []).find(l => l.kind === 'flop')

      if (topList) {
        const ids = [topList.position_1_tmdb_id, topList.position_2_tmdb_id, topList.position_3_tmdb_id]
        const shows = await Promise.all(ids.map(id =>
          tmdbApi.getShow(id).catch(() => null)
        ))
        const cards = shows.map(s => s ? {
          id: s.id,
          name: s.name || '',
          poster: s.poster_path ? tmdbApi.poster(s.poster_path, 'w154') : null,
          genres: Array.isArray(s.genres) ? s.genres : []
        } : null)
        this.currentTop = { ...topList, shows: cards }
        try { this.alias = generateAlias(cards.filter(Boolean)) } catch (e) { this.alias = null }
      }

      if (flopList) {
        const ids = [flopList.position_1_tmdb_id, flopList.position_2_tmdb_id, flopList.position_3_tmdb_id]
        const shows = await Promise.all(ids.map(id =>
          tmdbApi.getShow(id).catch(() => null)
        ))
        this.currentFlop = {
          ...flopList,
          shows: shows.map(s => s ? {
            id: s.id,
            name: s.name || '',
            poster: s.poster_path ? tmdbApi.poster(s.poster_path, 'w154') : null
          } : null)
        }
      }

      // Followers / following
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id)
      ])
      this.counts = {
        followers: followersRes.count || 0,
        following: followingRes.count || 0
      }

      if (me && !this.isMe) {
        const { data: f } = await supabase.from('follows').select('*')
          .eq('follower_id', me).eq('following_id', profile.id).maybeSingle()
        this.isFollowing = !!f
      }

      // Analyse visible si : c'est mon profil OU le profil est public
      this.showAnalysis = this.isMe || profile.library_public !== false
      if (this.showAnalysis) {
        this.computeGenreAnalysis()
      }
    } catch (e) {
      console.error('[Profile] init error', e)
      this.error = e.message || 'Erreur de chargement du profil'
    } finally {
      this.loading = false
    }
  },

  // Calcule la répartition des genres à partir de toutes les séries en bibliothèque
  async computeGenreAnalysis() {
    if (!this.profile) return
    this.analysisLoading = true
    try {
      const { data: items, error } = await supabase
        .from('library_items')
        .select('tmdb_id')
        .eq('user_id', this.profile.id)

      if (error) throw error
      this.totalSeriesAnalyzed = (items || []).length

      if (!items || items.length === 0) {
        this.genreStats = []
        this.genreNeverWatched = ALL_TV_GENRES.slice()
        return
      }

      // Récupération des détails de chaque série (cache TMDB déjà actif)
      const shows = await Promise.all(
        items.map(it => tmdbApi.getShow(it.tmdb_id).catch(() => null))
      )

      // Agrégation : compter chaque genre une seule fois par série
      const counts = {}
      const seen = new Set()
      for (const s of shows) {
        if (!s || !Array.isArray(s.genres)) continue
        const inThisShow = new Set()
        for (const g of s.genres) {
          if (!g?.id || inThisShow.has(g.id)) continue
          inThisShow.add(g.id)
          seen.add(g.id)
          counts[g.id] = counts[g.id] || { id: g.id, name: g.name, count: 0 }
          counts[g.id].count += 1
        }
      }

      const arr = Object.values(counts).sort((a, b) => b.count - a.count)
      const total = arr.reduce((sum, g) => sum + g.count, 0)
      const palette = ['#FF6B35', '#E63946', '#F4A261', '#E9B44C', '#B8A99A', '#8A7D70', '#5C534A', '#3F3A35', '#2A2724', '#1C1A17']
      this.genreStats = arr.map((g, i) => ({
        ...g,
        percent: total > 0 ? (g.count / total) * 100 : 0,
        color: palette[i % palette.length]
      }))

      // Genres jamais regardés = liste TMDB complète moins ceux vus
      this.genreNeverWatched = ALL_TV_GENRES.filter(g => !seen.has(g.id))
    } catch (e) {
      console.warn('[Profile] genre analysis error', e)
      this.genreStats = []
      this.genreNeverWatched = []
    } finally {
      this.analysisLoading = false
    }
  },

  async toggleVisibility() {
    if (!this.isMe || !this.profile) return
    this.togglingVisibility = true
    const next = !this.profile.library_public
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ library_public: next })
        .eq('id', this.profile.id)
      if (error) throw error
      this.profile.library_public = next
      window.Alpine.store('app').showToast(
        next ? 'Analyse visible par tous' : 'Analyse privée',
        'success'
      )
    } catch (e) {
      console.warn('[Profile] toggleVisibility error', e)
      window.Alpine.store('app').showToast('Erreur de sauvegarde')
    } finally {
      this.togglingVisibility = false
    }
  },

  // Génère le SVG du camembert avec slices animées
  // Retourne un tableau de paths SVG prêts à dessiner
  get pieSlices() {
    if (!this.genreStats.length) return []
    const cx = 100, cy = 100, r = 90
    let cumPercent = 0
    return this.genreStats.map(g => {
      const startPercent = cumPercent
      cumPercent += g.percent
      const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2
      const endAngle = (cumPercent / 100) * 2 * Math.PI - Math.PI / 2
      const x1 = cx + r * Math.cos(startAngle)
      const y1 = cy + r * Math.sin(startAngle)
      const x2 = cx + r * Math.cos(endAngle)
      const y2 = cy + r * Math.sin(endAngle)
      const largeArc = g.percent > 50 ? 1 : 0
      const path = g.percent >= 99.99
        ? `M ${cx-r},${cy} A ${r},${r} 0 1,1 ${cx+r},${cy} A ${r},${r} 0 1,1 ${cx-r},${cy} Z`
        : `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`
      return { path, color: g.color, name: g.name, percent: g.percent.toFixed(0), count: g.count }
    })
  },

  async toggleFollow() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me || this.isMe || !this.profile) return
    try {
      if (this.isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', me).eq('following_id', this.profile.id)
        this.isFollowing = false
        this.counts.followers = Math.max(0, this.counts.followers - 1)
      } else {
        await supabase.from('follows').insert({ follower_id: me, following_id: this.profile.id })
        this.isFollowing = true
        this.counts.followers += 1
      }
    } catch (e) {
      console.error('[Profile] toggleFollow error', e)
    }
  }
})

// Liste complète des genres TMDB pour les séries TV
// Utilisée pour identifier les "jamais regardés"
const ALL_TV_GENRES = [
  { id: 10759, name: 'Action & Aventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comédie' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentaire' },
  { id: 18, name: 'Drame' },
  { id: 10751, name: 'Familial' },
  { id: 10762, name: 'Enfants' },
  { id: 9648, name: 'Mystère' },
  { id: 10763, name: 'Actualité' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantastique' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk-show' },
  { id: 10768, name: 'Guerre & Politique' },
  { id: 37, name: 'Western' }
]
