import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'

export const top3View = () => ({
  query: '',
  results: [],
  searching: false,
  selection: [null, null, null],
  activeSlot: 0,
  comment: '',
  saving: false,
  error: null,
  debounceTimer: null,

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
      window.Alpine.store('app').showToast('Déjà dans ton top')
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

  async publish() {
    if (!this.isComplete) { this.error = 'Choisis 3 séries.'; return }
    this.saving = true
    this.error = null
    const me = window.Alpine.store('app').session.user.id
    try {
      await supabase.from('top_lists').update({ is_current: false }).eq('user_id', me).eq('is_current', true)

      const { error } = await supabase.from('top_lists').insert({
        user_id: me,
        position_1_tmdb_id: this.selection[0].id,
        position_2_tmdb_id: this.selection[1].id,
        position_3_tmdb_id: this.selection[2].id,
        comment: this.comment.trim() || null,
        is_current: true
      })
      if (error) throw error
      window.Alpine.store('app').showToast('Top 3 publié !', 'success')
      window.location.hash = '#/feed'
    } catch (e) {
      this.error = e.message
    } finally {
      this.saving = false
    }
  }
})
