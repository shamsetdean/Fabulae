import { supabase } from '../lib/supabase.js'
import { tmdbApi, getShowCard } from '../lib/tmdb.js'
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
  _routeKey: null,

  // Onglets
  activeTab: 'top', // 'top' | 'library' | 'followers' | 'following'

  // Bibliothèque
  library: [],
  libraryLoading: false,
  libraryFilter: 'all',
  libraryVisible: false,

  // Réseau
  followers: [],
  following: [],
  followersLoading: false,
  followingLoading: false,
  networkLoaded: false,

  // Séries en commun
  commonSeriesCount: null,
  commonSeriesLoading: false,

  // Analyse genres
  genreStats: [],
  genreNeverWatched: [],
  totalSeriesAnalyzed: 0,
  analysisLoading: false,
  showAnalysis: false,
  togglingVisibility: false,

  // Upload avatar
  uploadingAvatar: false,

  // Suppression item bibliothèque
  pendingDeleteId: null,
  deleting: false,

  // Suppression de compte
  showDeleteAccountModal: false,
  deletingAccount: false,
  deleteConfirmText: '',

  // Signalement
  showReportModal: false,
  reportCategory: 'inappropriate',
  reportReason: '',
  reportSending: false,
  reportSent: false,

  async init() {
    // Surveille les changements de route param pour réinitialiser sur navigation entre profils
    if (this.$watch) {
      this.$watch('$store.app.route', (newRoute) => {
        if (newRoute.name === 'u' || newRoute.name === 'profile') {
          const newKey = newRoute.params?.[0] || 'me'
          if (newKey !== this._routeKey) {
            this._load()
          }
        }
      })
    }
    this._load()
  },

  async _load() {
    const store = window.Alpine.store('app')
    const currentKey = store.route?.params?.[0] || 'me'
    if (this._routeKey === currentKey && this.profile) return
    this._routeKey = currentKey

    this.loading = true
    this.error = null
    this.profile = null
    this.currentTop = null
    this.currentFlop = null
    this.library = []
    this.followers = []
    this.following = []
    this.networkLoaded = false
    this.commonSeriesCount = null
    this.activeTab = 'top'  // Reset tab only on actual navigation change

    try {
      const me = store.session?.user?.id
      const route = store.route

      let profile = null

      if (route?.name === 'u' && route.params?.[0]) {
        // Profil d'un autre utilisateur — recherche par username
        const targetUsername = route.params[0]
        const { data, error: pErr } = await supabase
          .from('profiles').select('*').eq('username', targetUsername).maybeSingle()
        if (pErr) throw pErr
        if (!data) { this.error = 'Utilisateur introuvable'; this.loading = false; return }
        profile = data
      } else if (me) {
        // Mon propre profil — recherche directe par id (plus fiable, pas de race condition)
        // Attend que le store ait chargé le profil si possible
        if (store.profile?.id === me) {
          profile = store.profile
        } else {
          const { data, error: pErr } = await supabase
            .from('profiles').select('*').eq('id', me).maybeSingle()
          if (pErr) throw pErr
          profile = data
        }
        if (!profile) { this.error = 'Profil introuvable'; this.loading = false; return }
      } else {
        this.error = 'Non connecté'
        this.loading = false
        return
      }

      this.profile = profile
      this.isMe = profile.id === me

      // Top + Flop calculés depuis library_items (nouveau système)
      // Top = toutes les séries marquées "Je recommande", triées par note ↓ puis date ↓
      // Flop = toutes les séries marquées "Je déconseille", même tri
      const { data: ratedItems } = await supabase
        .from('library_items')
        .select('tmdb_id, recommendation, rating, created_at')
        .eq('user_id', profile.id)
        .not('recommendation', 'is', null)

      const sortByRatingThenDate = (a, b) => {
        const ra = a.rating || 0, rb = b.rating || 0
        if (rb !== ra) return rb - ra
        return new Date(b.created_at) - new Date(a.created_at)
      }

      const recommended = (ratedItems || [])
        .filter(i => i.recommendation === 'recommended')
        .sort(sortByRatingThenDate)
      const notRecommended = (ratedItems || [])
        .filter(i => i.recommendation === 'not_recommended')
        .sort(sortByRatingThenDate)

      // Hydrate avec TMDB
      const hydrate = async (items) => {
        const shows = await Promise.all(items.map(async (i) => {
          const s = await tmdbApi.getShow(i.tmdb_id)
          if (!s) return null
          return {
            id: s.id,
            name: s.name || '',
            poster: s.poster_path ? tmdbApi.poster(s.poster_path, 'w154') : null,
            genres: Array.isArray(s.genres) ? s.genres : [],
            rating: i.rating
          }
        }))
        return shows.filter(Boolean)
      }

      const topShows = await hydrate(recommended)
      const flopShows = await hydrate(notRecommended)

      this.currentTop = topShows.length > 0 ? { shows: topShows } : null
      this.currentFlop = flopShows.length > 0 ? { shows: flopShows } : null

      try {
        if (topShows.length > 0) this.alias = generateAlias(topShows.slice(0, 3))
      } catch (e) { this.alias = null }

      // Compteurs followers/following
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id)
      ])
      this.counts = { followers: followersRes.count || 0, following: followingRes.count || 0 }

      if (me && !this.isMe) {
        const { data: f } = await supabase.from('follows').select('*')
          .eq('follower_id', me).eq('following_id', profile.id).maybeSingle()
        this.isFollowing = !!f
        this.computeCommonSeries(me, profile.id)
      }

      this.showAnalysis = this.isMe || profile.library_public !== false
      if (this.showAnalysis) {
        this.loadLibrary()
        this.computeGenreAnalysis()
      }

      if (this.isMe) this.loadNetwork()

    } catch (e) {
      console.error('[Profile] init error', e)
      this.error = e.message || 'Erreur de chargement du profil'
    } finally {
      this.loading = false
    }
  },

  setTab(tab) {
    this.activeTab = tab
    if ((tab === 'followers' || tab === 'following') && !this.networkLoaded) {
      this.loadNetwork()
    }
  },

  // ─── AVATAR ────────────────────────────────────────────────────────────────

  async uploadAvatar(event) {
    const file = event.target.files?.[0]
    if (!file || !this.profile) return
    if (file.size > 2 * 1024 * 1024) {
      window.Alpine.store('app').showToast('Image trop lourde (max 2 Mo)', 'error')
      return
    }

    this.uploadingAvatar = true
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${this.profile.id}/avatar.${ext}`

      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = publicUrl + '?t=' + Date.now()

      const { error: updateErr } = await supabase
        .from('profiles').update({ avatar_url: avatarUrl }).eq('id', this.profile.id)
      if (updateErr) throw updateErr

      this.profile = { ...this.profile, avatar_url: avatarUrl }
      window.Alpine.store('app').profile = { ...window.Alpine.store('app').profile, avatar_url: avatarUrl }
      window.Alpine.store('app').showToast('Photo mise à jour', 'success')
    } catch (e) {
      console.warn('[Profile] uploadAvatar error', e)
      window.Alpine.store('app').showToast('Erreur lors de l\'upload', 'error')
    } finally {
      this.uploadingAvatar = false
    }
  },

  get avatarUrl() {
    return this.profile?.avatar_url || null
  },

  get avatarInitial() {
    return (this.profile?.username || '?').charAt(0).toUpperCase()
  },

  // ─── RÉSEAU ─────────────────────────────────────────────────────────────────

  async loadNetwork() {
    if (this.networkLoaded || !this.profile) return
    this.networkLoaded = true
    const profileId = this.profile.id

    this.followersLoading = true
    try {
      const { data } = await supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, library_public)')
        .eq('following_id', profileId)
      this.followers = (data || []).map(f => f.profiles).filter(Boolean)
    } catch (e) { console.warn('[Profile] followers error', e) }
    finally { this.followersLoading = false }

    this.followingLoading = true
    try {
      const { data } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, library_public)')
        .eq('follower_id', profileId)
      this.following = (data || []).map(f => f.profiles).filter(Boolean)
    } catch (e) { console.warn('[Profile] following error', e) }
    finally { this.followingLoading = false }
  },

  goToProfile(username) { window.location.hash = '#/u/' + username },

  // ─── SÉRIES EN COMMUN ───────────────────────────────────────────────────────

  async computeCommonSeries(myId, theirId) {
    this.commonSeriesLoading = true
    try {
      const { data, error } = await supabase.rpc('common_series_count', {
        uid_a: myId < theirId ? myId : theirId,
        uid_b: myId < theirId ? theirId : myId
      })
      if (!error) this.commonSeriesCount = data || 0
    } catch (e) { this.commonSeriesCount = 0 }
    finally { this.commonSeriesLoading = false }
  },

  get canChat() { return this.commonSeriesCount !== null && this.commonSeriesCount >= 5 },

  // ─── BIBLIOTHÈQUE ───────────────────────────────────────────────────────────

  async loadLibrary() {
    if (!this.profile) return
    if (this._libraryLoading) return  // Guard contre appels concurrents
    this._libraryLoading = true
    this.libraryLoading = true
    try {
      const { data, error } = await supabase
        .from('library_items').select('*')
        .eq('user_id', this.profile.id)
        .order('updated_at', { ascending: false })
      if (error) throw error

      const hydrated = await Promise.all((data || []).map(async item => {
        const show = await getShowCard(item.tmdb_id).catch(() => null)
        return show ? { ...item, show } : null
      }))
      this.library = hydrated.filter(Boolean)
    } catch (e) {
      console.warn('[Profile] loadLibrary error', e)
      this.library = []
    } finally {
      this.libraryLoading = false
      this._libraryLoading = false
    }
  },

  get libraryFiltered() {
    const lib = (this.library || []).filter(i => i && i.id && i.show)
    if (this.libraryFilter === 'all') return lib
    return lib.filter(i => i.status === this.libraryFilter)
  },

  get libraryCounts() {
    const lib = (this.library || []).filter(Boolean)
    return {
      all: lib.length,
      watching: lib.filter(i => i.status === 'watching').length,
      finished: lib.filter(i => i.status === 'finished').length,
      wishlist: lib.filter(i => i.status === 'wishlist').length,
      abandoned: lib.filter(i => i.status === 'abandoned').length,
    }
  },

  statusLabel(status) {
    return { watching: 'En cours', finished: 'Terminée', wishlist: 'À voir', abandoned: 'Abandonnée' }[status] || status
  },

  statusColor(status) {
    return { watching: 'text-flame-500', finished: 'text-green-400', wishlist: 'text-cream-300/60', abandoned: 'text-red-400' }[status] || 'text-cream-300/60'
  },

  // ─── SUPPRESSION ────────────────────────────────────────────────────────────

  confirmDelete(itemId) { this.pendingDeleteId = itemId },
  cancelDelete() { this.pendingDeleteId = null },

  async confirmAndDelete() {
    if (!this.pendingDeleteId) return
    this.deleting = true
    try {
      const { error } = await supabase.from('library_items').delete().eq('id', this.pendingDeleteId)
      if (!error) {
        this.library = this.library.filter(i => i.id !== this.pendingDeleteId)
        window.Alpine.store('app').showToast('Série supprimée', 'success')
      }
    } catch (e) { console.warn('[Profile] delete error', e) }
    finally { this.deleting = false; this.pendingDeleteId = null }
  },

  // ─── SWIPE ──────────────────────────────────────────────────────────────────

  swipeCard(item) {
    if (!item) {
      // Guard : retourne un objet inerte si item null (évite crash Alpine)
      return {
        _item: null,
        startX: 0, currentX: 0, swiping: false, THRESHOLD: 80,
        get offset() { return 0 },
        get swipePercent() { return 0 },
        get isRight() { return false },
        get isLeft() { return false },
        onTouchStart() {}, onTouchMove() {}, onTouchEnd() {}
      }
    }
    return {
      _item: item,
      startX: 0,
      currentX: 0,
      swiping: false,
      THRESHOLD: 80,
      get offset() { return this.currentX },
      get swipePercent() { return Math.min(Math.abs(this.currentX) / this.THRESHOLD, 1) },
      get isRight() { return this.currentX > 20 },
      get isLeft() { return this.currentX < -20 },
      onTouchStart(e) { this.startX = e.touches[0].clientX; this.currentX = 0; this.swiping = true },
      onTouchMove(e) {
        if (!this.swiping) return
        this.currentX = Math.max(-120, Math.min(120, e.touches[0].clientX - this.startX))
      },
      onTouchEnd(profileView) {
        this.swiping = false
        if (this.currentX >= this.THRESHOLD) {
          this.currentX = 0
          if (window.openClassifier) window.openClassifier(this._item.tmdb_id, {
            id: this._item.tmdb_id,
            name: this._item.show?.name,
            poster_path: this._item.show?.poster?.replace('https://image.tmdb.org/t/p/w154', '') || null
          })
        } else if (this.currentX <= -this.THRESHOLD) {
          this.currentX = 0
          profileView.confirmDelete(this._item.id)
        } else {
          this.currentX = 0
        }
      }
    }
  },

  // ─── ANALYSE GENRES ─────────────────────────────────────────────────────────

  async computeGenreAnalysis() {
    if (!this.profile) return
    this.analysisLoading = true
    try {
      const { data: items, error } = await supabase
        .from('library_items').select('tmdb_id').eq('user_id', this.profile.id)
      if (error) throw error
      this.totalSeriesAnalyzed = (items || []).length
      if (!items || items.length === 0) {
        this.genreStats = []; this.genreNeverWatched = ALL_TV_GENRES.slice(); return
      }
      const shows = await Promise.all(items.map(it => tmdbApi.getShow(it.tmdb_id).catch(() => null)))
      const counts = {}; const seen = new Set()
      for (const s of shows) {
        if (!s || !Array.isArray(s.genres)) continue
        const inThisShow = new Set()
        for (const g of s.genres) {
          if (!g?.id || inThisShow.has(g.id)) continue
          inThisShow.add(g.id); seen.add(g.id)
          counts[g.id] = counts[g.id] || { id: g.id, name: g.name, count: 0 }
          counts[g.id].count += 1
        }
      }
      const arr = Object.values(counts).sort((a, b) => b.count - a.count)
      const total = arr.reduce((sum, g) => sum + g.count, 0)
      const palette = ['#FF6B35','#E63946','#F4A261','#E9B44C','#B8A99A','#8A7D70','#5C534A','#3F3A35','#2A2724','#1C1A17']
      this.genreStats = arr.map((g, i) => ({ ...g, percent: total > 0 ? (g.count / total) * 100 : 0, color: palette[i % palette.length] }))
      this.genreNeverWatched = ALL_TV_GENRES.filter(g => !seen.has(g.id))
    } catch (e) { this.genreStats = []; this.genreNeverWatched = [] }
    finally { this.analysisLoading = false }
  },

  async toggleVisibility() {
    if (!this.isMe || !this.profile) return
    this.togglingVisibility = true
    const next = !this.profile.library_public
    try {
      const { error } = await supabase.from('profiles').update({ library_public: next }).eq('id', this.profile.id)
      if (error) throw error
      this.profile = { ...this.profile, library_public: next }
      window.Alpine.store('app').showToast(next ? 'Bibliothèque publique' : 'Bibliothèque privée', 'success')
    } catch (e) { window.Alpine.store('app').showToast('Erreur de sauvegarde') }
    finally { this.togglingVisibility = false }
  },

  get pieSvgHtml() {
    if (!this.genreStats.length) return ''
    const cx = 100, cy = 100, r = 90
    let cumPercent = 0
    const paths = this.genreStats.map(g => {
      const startPercent = cumPercent; cumPercent += g.percent
      const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2
      const endAngle = (cumPercent / 100) * 2 * Math.PI - Math.PI / 2
      const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
      const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
      const largeArc = g.percent > 50 ? 1 : 0
      const d = g.percent >= 99.99
        ? `M ${cx-r},${cy} A ${r},${r} 0 1,1 ${cx+r},${cy} A ${r},${r} 0 1,1 ${cx-r},${cy} Z`
        : `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`
      return `<path d="${d}" fill="${g.color}" stroke="#0A0908" stroke-width="1.5"><title>${g.name} : ${g.percent.toFixed(0)}%</title></path>`
    }).join('')
    return `<svg viewBox="0 0 200 200" width="120" height="120"><g>${paths}</g><circle cx="${cx}" cy="${cy}" r="40" fill="#0A0908"/><text x="${cx}" y="95" text-anchor="middle" fill="#F5ECE3" font-family="Instrument Serif, Georgia, serif" font-style="italic" font-size="22">${this.genreStats.length}</text><text x="${cx}" y="115" text-anchor="middle" fill="#B8A99A" font-size="9" letter-spacing="1">GENRES</text></svg>`
  },

  // ─── SUPPRESSION DE COMPTE ──────────────────────────────────────────────────

  async deleteAccount() {
    if (this.deleteConfirmText !== 'SUPPRIMER') return
    this.deletingAccount = true
    try {
      const session = window.Alpine.store('app').session
      const { error } = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      ).then(r => r.json()).then(data => ({ error: data.error || null }))

      if (error) throw new Error(error)

      // Nettoyer et rediriger
      localStorage.clear()
      window.location.hash = '#/auth'
      window.location.reload()
    } catch (e) {
      console.error('[Profile] deleteAccount error', e)
      window.Alpine.store('app').showToast('Erreur lors de la suppression', 'error')
    } finally {
      this.deletingAccount = false
      this.showDeleteAccountModal = false
    }
  },

  // ─── SIGNALEMENT ─────────────────────────────────────────────────────────────

  async submitReport() {
    if (!this.reportReason.trim() || !this.profile) return
    this.reportSending = true
    try {
      const me = window.Alpine.store('app').session?.user?.id
      const { error } = await supabase.from('reports').insert({
        reporter_id: me,
        reported_user_id: this.profile.id,
        category: this.reportCategory,
        reason: this.reportReason.trim()
      })
      if (error) throw error
      this.reportSent = true
      setTimeout(() => {
        this.showReportModal = false
        this.reportSent = false
        this.reportReason = ''
        this.reportCategory = 'inappropriate'
      }, 2000)
    } catch (e) {
      console.warn('[Profile] report error', e)
      window.Alpine.store('app').showToast('Erreur lors du signalement', 'error')
    } finally {
      this.reportSending = false
    }
  },

  async toggleFollow() {
    const me = window.Alpine.store('app').session?.user?.id
    if (!me || this.isMe || !this.profile) return
    try {
      if (this.isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', me).eq('following_id', this.profile.id)
        this.isFollowing = false
        this.counts.followers = Math.max(0, this.counts.followers - 1)
      } else {
        await supabase.from('follows').insert({ follower_id: me, following_id: this.profile.id })
        this.isFollowing = true
        this.counts.followers += 1
      }
    } catch (e) { console.error('[Profile] toggleFollow error', e) }
  }
})

const ALL_TV_GENRES = [
  { id: 10759, name: 'Action & Aventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comédie' }, { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentaire' }, { id: 18, name: 'Drame' },
  { id: 10751, name: 'Familial' }, { id: 10762, name: 'Enfants' },
  { id: 9648, name: 'Mystère' }, { id: 10763, name: 'Actualité' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantastique' },
  { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk-show' },
  { id: 10768, name: 'Guerre & Politique' }, { id: 37, name: 'Western' }
]
