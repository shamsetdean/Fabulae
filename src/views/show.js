import { tmdbApi } from '../lib/tmdb.js'
import { supabase } from '../lib/supabase.js'

export const showView = () => ({
  show: null,
  providers: null,
  loading: true,
  error: null,
  myEntry: null,            // entrée library_items pour cette série, si existante
  followedRecommenders: [], // utilisateurs suivis qui ont recommandé cette série

  async init() {
    const id = window.Alpine.store('app').route.params[0]
    if (!id) { this.error = 'ID manquant'; this.loading = false; return }
    const tmdbId = parseInt(id)
    const me = window.Alpine.store('app').session?.user?.id

    try {
      const [show, providers, myEntry, recommenders] = await Promise.all([
        tmdbApi.getShow(tmdbId),
        tmdbApi.getProvidersFR(tmdbId),
        me ? supabase.from('library_items').select('*').eq('user_id', me).eq('tmdb_id', tmdbId).maybeSingle() : Promise.resolve({ data: null }),
        me ? this.fetchFollowedRecommenders(me, tmdbId) : Promise.resolve([])
      ])
      this.show = show
      this.providers = providers
      this.myEntry = myEntry?.data || null
      this.followedRecommenders = recommenders
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }

    // Réagir aux mises à jour de la biblio (refresh myEntry)
    window.addEventListener('library:updated', this._refresh)
  },

  _refresh: async function() {
    const id = window.Alpine.store('app').route.params[0]
    const me = window.Alpine.store('app').session?.user?.id
    if (!me || !id) return
    const { data } = await supabase
      .from('library_items').select('*').eq('user_id', me).eq('tmdb_id', parseInt(id))
      .maybeSingle()
    this.myEntry = data
  },

  async fetchFollowedRecommenders(userId, tmdbId) {
    // Récupérer les IDs des comptes suivis
    const { data: follows } = await supabase
      .from('follows').select('following_id').eq('follower_id', userId)
    const followedIds = (follows || []).map(f => f.following_id)
    if (followedIds.length === 0) return []

    // Trouver ceux qui ont recommandé cette série
    const { data } = await supabase
      .from('followed_recommendations')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .in('recommender_id', followedIds)
      .limit(10)

    return data || []
  },

  classify() {
    if (window.openClassifier) {
      window.openClassifier(this.show.id, this.show)
    }
  },

  get statusLabel() {
    if (!this.myEntry) return 'Classer'
    return {
      wishlist: 'À voir',
      watching: 'En cours',
      finished: 'Terminée',
      abandoned: 'Abandonnée'
    }[this.myEntry.status] || 'Classer'
  },

  get rentOrBuy() {
    if (!this.providers) return []
    return [...(this.providers.rent || []), ...(this.providers.buy || [])]
  },

  get freeOrAds() {
    if (!this.providers) return []
    return [...(this.providers.free || []), ...(this.providers.ads || [])]
  },

  get allProviders() {
    if (!this.providers) return []
    const byId = new Map()
    for (const key of ['flatrate', 'free', 'ads', 'rent', 'buy']) {
      for (const p of (this.providers[key] || [])) {
        if (!byId.has(p.provider_id)) byId.set(p.provider_id, p)
      }
    }
    return [...byId.values()]
  }
})
