import { tmdbApi } from '../lib/tmdb.js'

export const showView = () => ({
  show: null,
  providers: null,
  loading: true,
  error: null,

  async init() {
    const id = window.Alpine.store('app').route.params[0]
    if (!id) { this.error = 'ID manquant'; this.loading = false; return }
    try {
      const [show, providers] = await Promise.all([
        tmdbApi.getShow(id),
        tmdbApi.getProvidersFR(id)
      ])
      this.show = show
      this.providers = providers
    } catch (e) {
      this.error = e.message
    } finally {
      this.loading = false
    }
  },

  get allProviders() {
    if (!this.providers) return []
    const byId = new Map()
    for (const key of ['flatrate', 'free', 'ads', 'rent', 'buy']) {
      for (const p of (this.providers[key] || [])) {
        if (!byId.has(p.provider_id)) {
          byId.set(p.provider_id, { ...p, type: key })
        }
      }
    }
    return [...byId.values()]
  },

  get rentOrBuy() {
    if (!this.providers) return []
    return [...(this.providers.rent || []), ...(this.providers.buy || [])]
  },

  get freeOrAds() {
    if (!this.providers) return []
    return [...(this.providers.free || []), ...(this.providers.ads || [])]
  }
})
