import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'

/**
 * Modal universel pour classer une série dans la bibliothèque.
 * Usage : x-data="classifierModal()" + open(tmdbId) depuis l'extérieur
 */
export const classifierModal = () => ({
  open: false,
  loading: false,
  saving: false,
  error: null,

  tmdbId: null,
  showInfo: null,        // { name, poster_path, year } pour affichage
  entry: null,           // ligne library_items existante (null si nouvelle)
  providers: [],

  form: {
    status: 'wishlist',
    rating: null,
    recommendation: null,
    current_season: 1,
    current_episode: 1,
    provider_id: null,
    provider_name: '',
    provider_logo_path: null,
    verdict: ''
  },

  async openModal(tmdbId, showInfoOptional) {
    this.tmdbId = parseInt(tmdbId)
    this.open = true
    this.loading = true
    this.error = null

    if (showInfoOptional) this.showInfo = showInfoOptional

    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; this.open = false; return }

    // Charger série + entrée existante + providers en parallèle
    const [showRes, entryRes, prov] = await Promise.all([
      this.showInfo ? Promise.resolve(this.showInfo) : tmdbApi.getShow(this.tmdbId).catch(() => null),
      supabase.from('library_items').select('*').eq('user_id', me).eq('tmdb_id', this.tmdbId).maybeSingle(),
      tmdbApi.getProvidersFR(this.tmdbId).catch(() => null)
    ])

    if (showRes) this.showInfo = showRes
    this.entry = entryRes.data

    // Pré-remplir le formulaire
    if (this.entry) {
      this.form = {
        status: this.entry.status,
        rating: this.entry.rating,
        recommendation: this.entry.recommendation,
        current_season: this.entry.current_season || 1,
        current_episode: this.entry.current_episode || 1,
        provider_id: this.entry.provider_id,
        provider_name: this.entry.provider_name || '',
        provider_logo_path: this.entry.provider_logo_path,
        verdict: this.entry.verdict || ''
      }
    } else {
      this.form = {
        status: 'wishlist', rating: null, recommendation: null,
        current_season: 1, current_episode: 1,
        provider_id: null, provider_name: '', provider_logo_path: null,
        verdict: ''
      }
    }

    // Construire la liste des providers FR
    const seen = new Set()
    const list = []
    if (prov) {
      for (const key of ['flatrate', 'free', 'ads']) {
        for (const p of (prov[key] || [])) {
          if (!seen.has(p.provider_id)) {
            seen.add(p.provider_id)
            list.push({ id: p.provider_id, name: p.provider_name, logo_path: p.logo_path })
          }
        }
      }
    }
    this.providers = list

    this.loading = false
  },

  closeModal() {
    this.open = false
    this.error = null
  },

  // Règle métier : on ne peut noter / donner un avis que sur status finished ou abandoned
  get canRate() {
    return ['finished', 'abandoned'].includes(this.form.status)
  },

  selectProvider(p) {
    if (p === null) {
      this.form.provider_id = null
      this.form.provider_logo_path = null
      this.form.provider_name = ''
    } else {
      this.form.provider_id = p.id
      this.form.provider_logo_path = p.logo_path
      this.form.provider_name = p.name
    }
  },

  setStatus(s) {
    this.form.status = s
    if (!this.canRate) {
      this.form.rating = null
      this.form.recommendation = null
      this.form.verdict = ''
    }
  },

  setRating(n) {
    this.form.rating = this.form.rating === n ? null : n
  },

  setRecommendation(r) {
    this.form.recommendation = this.form.recommendation === r ? null : r
  },

  async save() {
    this.saving = true
    this.error = null
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.error = 'Non connecté'; this.saving = false; return }

    const payload = {
      user_id: me,
      tmdb_id: this.tmdbId,
      status: this.form.status,
      rating: this.canRate ? this.form.rating : null,
      recommendation: this.canRate ? this.form.recommendation : null,
      current_season: this.form.status === 'watching' ? this.form.current_season : null,
      current_episode: this.form.status === 'watching' ? this.form.current_episode : null,
      provider_id: this.form.status === 'watching' ? this.form.provider_id : null,
      provider_name: this.form.status === 'watching' ? (this.form.provider_name || null) : null,
      provider_logo_path: this.form.status === 'watching' ? this.form.provider_logo_path : null,
      verdict: this.canRate ? (this.form.verdict?.trim() || null) : null
    }

    const { error } = await supabase
      .from('library_items')
      .upsert(payload, { onConflict: 'user_id,tmdb_id' })

    if (error) {
      this.error = error.message
      this.saving = false
      return
    }

    this.saving = false
    this.closeModal()
    window.Alpine.store('app').showToast('Enregistré', 'success')

    // Rafraîchir la biblio si on est dessus
    window.dispatchEvent(new CustomEvent('library:updated'))
  },

  async remove() {
    if (!this.entry) return
    if (!confirm('Retirer de ta bibliothèque ?')) return
    this.saving = true
    const me = window.Alpine.store('app').session?.user?.id
    await supabase.from('library_items').delete().eq('user_id', me).eq('tmdb_id', this.tmdbId)
    this.saving = false
    this.closeModal()
    window.Alpine.store('app').showToast('Retiré')
    window.dispatchEvent(new CustomEvent('library:updated'))
  }
})

// Helper pour ouvrir le modal depuis n'importe quel composant
window.openClassifier = function(tmdbId, showInfo) {
  const ev = new CustomEvent('classifier:open', { detail: { tmdbId, showInfo } })
  window.dispatchEvent(ev)
}
