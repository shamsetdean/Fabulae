import { supabase } from './supabase.js'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p'
const CACHE_TTL_HOURS = 24
const MEM_CACHE = new Map()
const SEARCH_CACHE = new Map()

function getToken() {
  return import.meta.env.VITE_TMDB_TOKEN
}

async function tmdbFetch(path, params = {}, options = {}) {
  const url = new URL(TMDB_BASE + path)
  url.searchParams.set('language', 'fr-FR')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    },
    signal: options.signal
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

// ─── Cache Supabase ──────────────────────────────────────────────────────────

async function getFromSupabaseCache(tmdbId) {
  try {
    const { data } = await supabase
      .from('tmdb_cache')
      .select('data, cached_at')
      .eq('tmdb_id', String(tmdbId))
      .maybeSingle()

    if (!data) return null
    const ageHours = (Date.now() - new Date(data.cached_at).getTime()) / 3600000
    if (ageHours > CACHE_TTL_HOURS) return null
    return data.data
  } catch (e) {
    return null
  }
}

async function writeToSupabaseCache(tmdbId, data) {
  try {
    await supabase.from('tmdb_cache').upsert({
      tmdb_id: String(tmdbId),
      data,
      cached_at: new Date().toISOString()
    }, { onConflict: 'tmdb_id' })
  } catch (e) {
    // Silencieux — le cache est optionnel
  }
}

// ─── Tailles d'images ────────────────────────────────────────────────────────
// Mapping contexte d'affichage → taille TMDB optimale
//   thumb  : listes 1 colonne (Bibliothèque, Feed) — affichage ~50-60px
//   card   : grilles 2-3 colonnes (Profile/Discover) — affichage ~120-180px
//   detail : page détail série — affichage ~280px
//   hero   : backdrops plein écran
//
// Sources : posters TMDB sont en ratio 2:3, donc w154 = 154x231, w185 = 185x278, etc.

const POSTER_SIZES = {
  thumb: 'w154',
  card: 'w185',
  detail: 'w342',
  hero: 'w500'
}

const BACKDROP_SIZES = {
  card: 'w300',
  hero: 'w780',
  full: 'w1280'
}

export function posterFor(path, context = 'card') {
  if (!path) return null
  const size = POSTER_SIZES[context] || POSTER_SIZES.card
  return `${TMDB_IMAGE}/${size}${path}`
}

export function backdropFor(path, context = 'hero') {
  if (!path) return null
  const size = BACKDROP_SIZES[context] || BACKDROP_SIZES.hero
  return `${TMDB_IMAGE}/${size}${path}`
}

// ─── API principale ──────────────────────────────────────────────────────────

export const tmdbApi = {
  // Conserve l'API legacy pour compatibilité
  poster(path, size = 'w342') {
    if (!path) return null
    return `${TMDB_IMAGE}/${size}${path}`
  },

  // Nouvelle API recommandée : pose le contexte plutôt que la taille brute
  posterFor,
  backdropFor,

  // Lecture synchrone du cache mémoire — zéro appel réseau
  getCached(id) {
    return MEM_CACHE.get(`show_${id}`) ?? null
  },

  async getShow(id) {
    if (!id) return null
    const key = `show_${id}`

    if (MEM_CACHE.has(key)) return MEM_CACHE.get(key)

    const cached = await getFromSupabaseCache(key)
    if (cached) {
      MEM_CACHE.set(key, cached)
      return cached
    }

    try {
      const data = await tmdbFetch(`/tv/${id}`, {
        append_to_response: 'keywords,watch/providers'
      })
      MEM_CACHE.set(key, data)
      writeToSupabaseCache(key, data)
      return data
    } catch (e) {
      console.warn('[TMDB] getShow error', id, e)
      return null
    }
  },

  async searchTv(query, options = {}) {
    if (!query?.trim()) return { results: [] }
    const q = query.trim().toLowerCase()
    const cacheKey = `search_${q}`

    // Cache court 60s sur les recherches identiques
    const cached = SEARCH_CACHE.get(cacheKey)
    if (cached && (Date.now() - cached.ts) < 60_000) {
      return cached.data
    }

    try {
      const data = await tmdbFetch('/search/tv', { query: query.trim() }, options)
      SEARCH_CACHE.set(cacheKey, { data, ts: Date.now() })
      // Nettoyage : garde au max 30 recherches récentes
      if (SEARCH_CACHE.size > 30) {
        const oldest = [...SEARCH_CACHE.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
        if (oldest) SEARCH_CACHE.delete(oldest[0])
      }
      return data
    } catch (e) {
      // AbortError n'est pas une vraie erreur — on la propage proprement
      if (e.name === 'AbortError') throw e
      console.warn('[TMDB] search error', e)
      return { results: [] }
    }
  },

  async getTrending() {
    const key = 'trending_tv'
    if (MEM_CACHE.has(key)) return MEM_CACHE.get(key)

    const cached = await getFromSupabaseCache(key)
    if (cached) {
      MEM_CACHE.set(key, cached)
      return cached
    }

    try {
      const data = await tmdbFetch('/trending/tv/week')
      MEM_CACHE.set(key, data)
      writeToSupabaseCache(key, data)
      return data
    } catch (e) {
      console.warn('[TMDB] trending error', e)
      return { results: [] }
    }
  },

  async getProvidersFR(tmdbId) {
    const show = await this.getShow(tmdbId)
    if (!show) return { flatrate: [], free: [] }
    if (show.flatrate !== undefined) return { flatrate: show.flatrate || [], free: show.free || [] }
    const fr = show['watch/providers']?.results?.FR || {}
    return { flatrate: fr.flatrate || [], free: fr.free || [] }
  },

  async getPopular() {
    const key = 'popular_tv'
    if (MEM_CACHE.has(key)) return MEM_CACHE.get(key)

    const cached = await getFromSupabaseCache(key)
    if (cached) {
      MEM_CACHE.set(key, cached)
      return cached
    }

    try {
      const data = await tmdbFetch('/tv/popular')
      MEM_CACHE.set(key, data)
      writeToSupabaseCache(key, data)
      return data
    } catch (e) {
      console.warn('[TMDB] popular error', e)
      return { results: [] }
    }
  },

  async getRecommendations(id) {
    if (!id) return []
    const key = `reco_${id}`

    if (MEM_CACHE.has(key)) return MEM_CACHE.get(key)

    const cached = await getFromSupabaseCache(key)
    if (cached) {
      MEM_CACHE.set(key, cached)
      return cached
    }

    try {
      const data = await tmdbFetch(`/tv/${id}/recommendations`)
      const results = data?.results ?? []
      MEM_CACHE.set(key, results)
      writeToSupabaseCache(key, results)
      return results
    } catch (e) {
      console.warn('[TMDB] getRecommendations error', id, e)
      return []
    }
  }
}

// ─── Helper : providers FR (compatibilité avec l'ancien code) ────────────────

export function getProvidersFR(show) {
  if (!show) return { flatrate: [], free: [] }
  if (show.flatrate !== undefined) return { flatrate: show.flatrate || [], free: show.free || [] }
  const fr = show['watch/providers']?.results?.FR || {}
  return { flatrate: fr.flatrate || [], free: fr.free || [] }
}

// ─── Helper : carte série normalisée avec multi-tailles ─────────────────────
// L'objet retourné contient plusieurs tailles de poster : thumb, card, detail
// Les vues utilisent celle qui correspond à leur contexte d'affichage
// `card.poster` reste rétro-compatible (alias de card.posterCard)

const SHOW_CARD_CACHE = new Map()

export async function getShowCard(id) {
  if (!id) return null
  if (SHOW_CARD_CACHE.has(id)) return SHOW_CARD_CACHE.get(id)

  const show = await tmdbApi.getShow(id)
  if (!show) return null

  const providers = show['watch/providers']?.results?.FR
  const posterPath = show.poster_path
  const backdropPath = show.backdrop_path

  const card = {
    id: show.id,
    name: show.name || '',
    // Multi-tailles : chaque vue prend ce qu'elle utilise réellement
    posterThumb: posterFor(posterPath, 'thumb'),
    posterCard: posterFor(posterPath, 'card'),
    posterDetail: posterFor(posterPath, 'detail'),
    // Alias rétro-compatible : ancien `poster` = card (taille moyenne)
    // Les vues qui utilisent `item.show.poster` continuent de marcher
    poster: posterFor(posterPath, 'card'),
    backdrop: backdropFor(backdropPath, 'hero'),
    overview: show.overview || '',
    genres: Array.isArray(show.genres) ? show.genres : [],
    vote_average: show.vote_average || 0,
    first_air_date: show.first_air_date || '',
    number_of_seasons: show.number_of_seasons || 0,
    status: show.status || '',
    networks: Array.isArray(show.networks) ? show.networks : [],
    flatrate: providers?.flatrate || [],
    free: providers?.free || []
  }

  // Compat : `year` simple à utiliser dans les templates
  card.year = card.first_air_date ? card.first_air_date.slice(0, 4) : ''

  SHOW_CARD_CACHE.set(id, card)
  return card
}
