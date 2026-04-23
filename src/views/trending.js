import { supabase } from '../lib/supabase.js'
import { getShowCard, tmdbApi } from '../lib/tmdb.js'

export const trendingView = () => ({
  tab: 'community',
  communityRanking: [],
  tmdbTrending: [],
  loading: true,
  error: null,

  async init() {
    await Promise.all([this.loadCommunity(), this.loadTmdb()])
    this.loading = false
  },

  async loadCommunity() {
    try {
      const { data, error } = await supabase
        .from('community_trending')
        .select('*')
        .limit(20)
      if (error) throw error

      const hydrated = await Promise.all((data || []).map(async row => {
        const show = await getShowCard(row.tmdb_id)
        return show ? { ...show, mentions: row.mentions, weighted_score: row.weighted_score } : null
      }))
      this.communityRanking = hydrated.filter(Boolean)
    } catch (e) {
      console.warn('Community trending failed:', e)
    }
  },

  async loadTmdb() {
    try {
      const data = await tmdbApi.trending('week')
      this.tmdbTrending = (data.results || []).slice(0, 20).map(r => ({
        id: r.id,
        name: r.name,
        poster: tmdbApi.poster(r.poster_path),
        year: r.first_air_date ? r.first_air_date.slice(0, 4) : '',
        vote: r.vote_average
      }))
    } catch (e) {
      this.error = e.message
    }
  }
})
