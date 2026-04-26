import { supabase } from './supabase.js'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE = 'https://image.tmdb.org/t/p'
const CACHE_TTL_HOURS = 24
const MEM_CACHE = new Map()

function getToken() {
  return import.meta.env.VITE_TMDB_TOKEN
}

async function tmdbFetch(path, params = {}) {
  const url = new URL(TMDB_BASE + path)
  url.searchParams.set('language', 'fr-FR')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json'
    }
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

// ─── Cache Supabase ─────────────────────────────────────────────────────────

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

// ─── API principale ─────────────────────────────────────────────────────────

export const tmdbApi = {
  poster(path, size = 'w342') {
    if (!path) return null
    return `${TMDB_IMAGE}/${size}${path}`
  },

  async getShow(id) {
    if (!id) return null
    const key = `show_${id}`

    // 1. Cache mémoire (instantané)
    if (MEM_CACHE.has(key)) return MEM_CACHE.get(key)

    // 2. Cache Supabase (serveur, ~60% des cas après première visite)
    const cached = await getFromSupabaseCache(key)
    if (cached) {
      MEM_CACHE.set(key, cached)
      return cached
    }

    // 3. Fetch TMDB
    try {
      const data = await tmdbFetch(`/tv/${id}`, {
        append_to_response: 'watch/providers'
      })
      MEM_CACHE.set(key, data)
      writeToSupabaseCache(key, data) // fire-and-forget
      return data
    } catch (e) {
      console.warn('[TMDB] getShow error', id, e)
      return null
    }
  },

  async searchTv(query) {
    if (!query?.trim()) return { results: [] }
    try {
      return await tmdbFetch('/search/tv', { query: query.trim() })
    } catch (e) {
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
  }
}

// ─── Helper : providers FR (compatibilité avec l'ancien code) ──────────────

export function getProvidersFR(show) {
  if (!show) return { flatrate: [], free: [] }
  // Support des deux formats : raw TMDB et getShowCard normalisé
  if (show.flatrate !== undefined) return { flatrate: show.flatrate || [], free: show.free || [] }
  const fr = show['watch/providers']?.results?.FR || {}
  return { flatrate: fr.flatrate || [], free: fr.free || [] }
}

// ─── Helper : carte série normalisée ────────────────────────────────────────

const SHOW_CARD_CACHE = new Map()

export async function getShowCard(id) {
  if (!id) return null
  if (SHOW_CARD_CACHE.has(id)) return SHOW_CARD_CACHE.get(id)

  const show = await tmdbApi.getShow(id)
  if (!show) return null

  const providers = show['watch/providers']?.results?.FR
  const card = {
    id: show.id,
    name: show.name || '',
    poster: show.poster_path ? tmdbApi.poster(show.poster_path, 'w154') : null,
    backdrop: show.backdrop_path ? tmdbApi.poster(show.backdrop_path, 'w780') : null,
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

  SHOW_CARD_CACHE.set(id, card)
  return card
}
