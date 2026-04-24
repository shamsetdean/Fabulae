import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'

export const top3View = () => ({
  // Type de liste en cours d'édition : 'top' ou 'flop'
  kind: 'top',

  query: '',
  results: [],
  searching: false,
  selection: [null, null, null],
  activeSlot: 0,
  comment: '',
  saving: false,
  error: null,
  debounceTimer: null,

  async init() {
    // Si l'utilisateur a déjà un Top 3 ou Flop 3 courant, on pré-remplit pour édition
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) return
    const { data } = await supabase
      .from('top_lists').select('*')
      .eq('user_id', me).eq('is_current', true).eq('kind', this.kind)
      .maybeSingle()
    if (data) {
      // Hydrater les 3 séries depuis TMDB pour pré-remplir la sélection
      const ids = [data.position_1_tmdb_id, data.position_2_tmdb_id, data.position_3_tmdb_id]
      const shows = await Promise.all(ids.map(async id => {
        const show = await tmdbApi.getShow(id).catch(() => null)
        return show ? {
          id: show.id,
          name: show.name,
          year: show.first_air_date ? show.first_air_date.slice(0, 4) : '',
          poster: tmdbApi.poster(show.poster_path, 'w154'),
          overview: show.overview
        } : null
      }))
      this.selection = shows
      this.comment = data.comment || ''
    }
  },

  async switchKind(newKind) {
    this.kind = newKind
    this.selection = [null, null, null]
    this.comment = ''
    this.activeSlot = 0
    this.error = null
    await this.init()
  },

  async onSearch() {
    clearTimeout(this.debounceTimer)
    const q = this.query.trim()
    if (q.length < 2) { this.results = []; return }
    this.debounceTimer = setTimeout(async () => {
      this.searching = true
      try {
        const data = await tmdbApi.searchTv(q)
        this.results = (data.results || []).slice(0, 12).map(r => ({
          id: r.id,
          name: r.name,
          year: r.first_air_date ? r.first_air_date.slice(0, 4) : '',
          poster: tmdbApi.poster(r.poster_path, 'w154'),
          overview: r.overview
        }))
      } catch (e) {
        this.error = e.message
      } finally {
        this.searching = false
      }
    }, 300)
  },

  pickSlot(i) { this.activeSlot = i },

  addToSlot(show) {
    if (this.selection.some(s => s?.id === show.id)) {
      window.Alpine.store('app').showToast('Déjà dans ton classement')
      return
    }
    this.selection[this.activeSlot] = show
    const next = this.selection.findIndex(s => !s)
    if (next !== -1) this.activeSlot = next
    this.query = ''
    this.results = []
  },

  removeSlot(i) { this.selection[i] = null; this.activeSlot = i },

  get isComplete() {
    return this.selection.every(s => s !== null)
  },

  get label() {
    return this.kind === 'flop' ? 'Flop 3' : 'Top 3'
  },

  async publish() {
    if (!this.isComplete) { this.error = 'Choisis 3 séries.'; return }
    this.saving = true
    this.error = null
    const me = window.Alpine.store('app').session.user.id
    try {
      // Marquer l'ancien de ce kind comme non-current
      await supabase.from('top_lists')
        .update({ is_current: false })
        .eq('user_id', me).eq('is_current', true).eq('kind', this.kind)

      const { error } = await supabase.from('top_lists').insert({
        user_id: me,
        kind: this.kind,
        position_1_tmdb_id: this.selection[0].id,
        position_2_tmdb_id: this.selection[1].id,
        position_3_tmdb_id: this.selection[2].id,
        comment: this.comment.trim() || null,
        is_current: true
      })
      if (error) throw error
      window.Alpine.store('app').showToast(this.label + ' publié !', 'success')
      window.location.hash = '#/feed'
    } catch (e) {
      this.error = e.message
    } finally {
      this.saving = false
    }
  }
})
