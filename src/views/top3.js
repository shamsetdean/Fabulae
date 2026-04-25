import { supabase } from '../lib/supabase.js'
import { tmdbApi } from '../lib/tmdb.js'
import { generateAlias } from '../lib/alias.js'

export const top3View = () => ({
  kind: 'top',         // 'top' | 'flop'
  pool: [],            // séries éligibles (recommandées ou non recommandées)
  selection: [null, null, null],
  activeSlot: 0,
  comment: '',
  saving: false,
  error: null,
  loading: true,
  alias: null,         // alias dynamique généré

  async init() {
    await this.loadPool()
    await this.loadCurrent()
  },

  async switchKind(newKind) {
    this.kind = newKind
    this.selection = [null, null, null]
    this.comment = ''
    this.activeSlot = 0
    this.error = null
    this.alias = null
    await this.loadPool()
    await this.loadCurrent()
  },

  // Charge les séries éligibles depuis la bibliothèque
  // Top 3 → status='finished' ET recommendation='recommended'
  // Flop 3 → status in ('finished','abandoned') ET recommendation='not_recommended'
  async loadPool() {
    this.loading = true
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) { this.loading = false; return }

    let q = supabase
      .from('library_items')
      .select('*')
      .eq('user_id', me)
      .order('rating', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (this.kind === 'top') {
      q = q.eq('recommendation', 'recommended')
    } else {
      q = q.eq('recommendation', 'not_recommended')
    }

    const { data, error } = await q
    if (error) { this.error = error.message; this.loading = false; return }

    // Hydrater chaque entrée avec les détails complets de la série (pour les genres)
    const hydrated = await Promise.all((data || []).map(async (it) => {
      const show = await tmdbApi.getShow(it.tmdb_id).catch(() => null)
      if (!show) return null
      return {
        id: show.id,
        name: show.name,
        year: show.first_air_date ? show.first_air_date.slice(0, 4) : '',
        poster: tmdbApi.poster(show.poster_path, 'w154'),
        rating: it.rating,
        genres: show.genres || []
      }
    }))
    this.pool = hydrated.filter(Boolean)
    this.loading = false
  },

  // Pré-remplir avec le top/flop courant si déjà publié
  async loadCurrent() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me) return
    const { data } = await supabase
      .from('top_lists').select('*')
      .eq('user_id', me).eq('is_current', true).eq('kind', this.kind)
      .maybeSingle()
    if (!data) return
    const ids = [data.position_1_tmdb_id, data.position_2_tmdb_id, data.position_3_tmdb_id]
    this.selection = ids.map(id => this.pool.find(p => p.id === id) || null)
    this.comment = data.comment || ''
    this.recomputeAlias()
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
    this.recomputeAlias()
  },

  removeSlot(i) {
    this.selection[i] = null
    this.activeSlot = i
    this.recomputeAlias()
  },

  recomputeAlias() {
    if (this.kind !== 'top') { this.alias = null; return }
    const filled = this.selection.filter(Boolean)
    if (filled.length === 3) this.alias = generateAlias(filled)
    else this.alias = null
  },

  get isComplete() {
    return this.selection.every(s => s !== null)
  },

  get label() {
    return this.kind === 'flop' ? 'Flop 3' : 'Top 3'
  },

  get canPublish() {
    return this.pool.length >= 3
  },

  async publish() {
    if (!this.isComplete) { this.error = 'Choisis 3 séries.'; return }
    this.saving = true
    this.error = null
    const me = window.Alpine.store('app').session.user.id
    try {
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
      window.Alpine.store('app').showToast(this.label + ' publié', 'success')
      window.location.hash = '#/feed'
    } catch (e) {
      this.error = e.message
    } finally {
      this.saving = false
    }
  }
})
