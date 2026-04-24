import { supabase } from '../lib/supabase.js'
import { tmdbApi, getShowCard } from '../lib/tmdb.js'

/**
 * Composant embarqué dans la fiche série : gère l'ajout/modif dans la bibliothèque.
 * Usage : x-data="watchlistOnShow()"
 */
export const watchlistOnShow = () => ({
  entry: null,          // entrée existante en base (null si pas dans la biblio)
  loading: true,
  showEditor: false,    // affichage du panneau d'édition détaillé
  providers: [],        // providers TMDB + option "Autre"

  // Champs du formulaire
  form: {
    status: 'watching',
    current_season: 1,
    current_episode: 1,
    provider_id: null,
    provider_name: '',
    provider_logo_path: null,
    verdict: ''
  },

  async init() {
    const me = window.Alpine.store('app').session?.user?.id
    const tmdbId = parseInt(window.Alpine.store('app').route.params[0])
    if (!me || !tmdbId) { this.loading = false; return }

    // Charger l'entrée existante
    const { data } = await supabase
      .from('watchlist').select('*')
      .eq('user_id', me).eq('tmdb_id', tmdbId).maybeSingle()
    this.entry = data
    if (data) {
      this.form = {
        status: data.status,
        current_season: data.current_season || 1,
        current_episode: data.current_episode || 1,
        provider_id: data.provider_id,
        provider_name: data.provider_name || '',
        provider_logo_path: data.provider_logo_path,
        verdict: data.verdict || ''
      }
    }

    // Charger les providers FR pour pré-remplissage
    try {
      const prov = await tmdbApi.getProvidersFR(tmdbId)
      const seen = new Set()
      const list = []
      for (const key of ['flatrate', 'free', 'ads']) {
        for (const p of (prov?.[key] || [])) {
          if (!seen.has(p.provider_id)) {
            seen.add(p.provider_id)
            list.push({
              id: p.provider_id,
              name: p.provider_name,
              logo_path: p.logo_path
            })
          }
        }
      }
      this.providers = list
    } catch (e) {
      console.warn('Failed to load providers', e)
    }

    this.loading = false
  },

  // Ajout rapide avec status par défaut (sans ouvrir l'éditeur)
  async quickAdd(status) {
    const me = window.Alpine.store('app').session.user.id
    const tmdbId = parseInt(window.Alpine.store('app').route.params[0])
    if (status === 'watching') {
      // Pour "en cours", ouvrir l'éditeur pour saisir saison/épisode/plateforme
      this.form.status = 'watching'
      this.showEditor = true
      return
    }
    const payload = {
      user_id: me,
      tmdb_id: tmdbId,
      status,
      current_season: null,
      current_episode: null,
      provider_id: null,
      provider_name: null,
      provider_logo_path: null
    }
    const { data, error } = await supabase
      .from('watchlist').upsert(payload, { onConflict: 'user_id,tmdb_id' })
      .select().single()
    if (error) {
      window.Alpine.store('app').showToast('Erreur : ' + error.message)
      return
    }
    this.entry = data
    window.Alpine.store('app').showToast('Ajouté !', 'success')
  },

  // Soumission du formulaire détaillé (pour "en cours" ou édition)
  async saveDetailed() {
    const me = window.Alpine.store('app').session.user.id
    const tmdbId = parseInt(window.Alpine.store('app').route.params[0])

    const payload = {
      user_id: me,
      tmdb_id: tmdbId,
      status: this.form.status,
      current_season: this.form.status === 'watching' ? this.form.current_season : null,
      current_episode: this.form.status === 'watching' ? this.form.current_episode : null,
      provider_id: this.form.status === 'watching' ? this.form.provider_id : null,
      provider_name: this.form.status === 'watching' ? (this.form.provider_name || null) : null,
      provider_logo_path: this.form.status === 'watching' ? this.form.provider_logo_path : null,
      verdict: this.form.status === 'finished' ? (this.form.verdict || null) : null
    }

    const { data, error } = await supabase
      .from('watchlist').upsert(payload, { onConflict: 'user_id,tmdb_id' })
      .select().single()
    if (error) {
      window.Alpine.store('app').showToast('Erreur : ' + error.message)
      return
    }
    this.entry = data
    this.showEditor = false
    window.Alpine.store('app').showToast('Enregistré', 'success')
  },

  async remove() {
    if (!confirm('Retirer de la bibliothèque ?')) return
    const me = window.Alpine.store('app').session.user.id
    const tmdbId = parseInt(window.Alpine.store('app').route.params[0])
    await supabase.from('watchlist').delete().eq('user_id', me).eq('tmdb_id', tmdbId)
    this.entry = null
    window.Alpine.store('app').showToast('Retiré')
  },

  selectProvider(p) {
    if (p === null) {
      // "Autre"
      this.form.provider_id = null
      this.form.provider_logo_path = null
      this.form.provider_name = ''
    } else {
      this.form.provider_id = p.id
      this.form.provider_logo_path = p.logo_path
      this.form.provider_name = p.name
    }
  },

  get statusLabel() {
    return {
      want: '📌 À voir',
      watching: '📺 En cours',
      finished: '✓ Terminée',
      abandoned: '✕ Abandonnée'
    }[this.entry?.status] || 'Ajouter à ma bibliothèque'
  }
})

/**
 * Section "Bibliothèque" dans le profil : affiche par onglet (want/watching/finished/abandoned)
 * Usage : x-data="libraryView()"
 */
export const libraryView = () => ({
  tab: 'watching',
  entries: { want: [], watching: [], finished: [], abandoned: [] },
  loading: true,
  userId: null,
  isMe: false,

  async init() {
    // On récupère le userId du profil affiché (pas forcément le user connecté)
    const me = window.Alpine.store('app').session?.user?.id
    const route = window.Alpine.store('app').route
    let targetUsername = route.name === 'u' ? route.params[0] : window.Alpine.store('app').profile?.username
    if (!targetUsername) { this.loading = false; return }

    const { data: profile } = await supabase
      .from('profiles').select('id').eq('username', targetUsername).maybeSingle()
    if (!profile) { this.loading = false; return }
    this.userId = profile.id
    this.isMe = profile.id === me

    await this.load()
  },

  async load() {
    this.loading = true
    const { data } = await supabase
      .from('watchlist').select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })

    const bucket = { want: [], watching: [], finished: [], abandoned: [] }
    const hydrated = await Promise.all((data || []).map(async e => {
      const show = await getShowCard(e.tmdb_id)
      return show ? { ...e, show } : null
    }))
    for (const row of hydrated) {
      if (row && bucket[row.status]) bucket[row.status].push(row)
    }
    this.entries = bucket
    this.loading = false
  },

  // Incrément rapide d'épisode (+1). Ne gère pas auto le passage de saison
  // (trop risqué sans connaître le nb d'épisodes par saison).
  async incrementEpisode(entry) {
    if (!this.isMe || entry.status !== 'watching') return
    const newEp = (entry.current_episode || 0) + 1
    const { error } = await supabase
      .from('watchlist')
      .update({ current_episode: newEp })
      .eq('id', entry.id)
    if (!error) {
      entry.current_episode = newEp
    }
  },

  get currentEntries() {
    return this.entries[this.tab] || []
  },

  providerLogoUrl(path) {
    return path ? `https://image.tmdb.org/t/p/w92${path}` : null
  },

  /**
   * Deep link vers la plateforme (recherche directe sur leur site)
   * Simpliste mais efficace : la plupart des plateformes gèrent une recherche par titre
   */
  providerLink(providerName, showName) {
    if (!providerName) return null
    const q = encodeURIComponent(showName)
    const links = {
      'Netflix': `https://www.netflix.com/search?q=${q}`,
      'Amazon Prime Video': `https://www.primevideo.com/search?phrase=${q}`,
      'Prime Video': `https://www.primevideo.com/search?phrase=${q}`,
      'Disney Plus': `https://www.disneyplus.com/fr-fr/search?q=${q}`,
      'Disney+': `https://www.disneyplus.com/fr-fr/search?q=${q}`,
      'Apple TV+': `https://tv.apple.com/fr/search?term=${q}`,
      'Apple TV Plus': `https://tv.apple.com/fr/search?term=${q}`,
      'Canal+': `https://www.canalplus.com/recherche/?q=${q}`,
      'Paramount Plus': `https://www.paramountplus.com/fr/search/?q=${q}`,
      'Max': `https://www.max.com/fr/fr/search?q=${q}`,
      'OCS': `https://www.ocs.fr/recherche?q=${q}`,
      'Arte': `https://www.arte.tv/fr/search/?q=${q}`,
      'France TV': `https://www.france.tv/recherche/?q=${q}`,
      'MyTF1': `https://www.tf1.fr/recherche?q=${q}`
    }
    return links[providerName] || null
  }
})
