// Client TMDB — API v3 avec Bearer token (v4 auth)
// Doc: https://developer.themoviedb.org/reference/intro/getting-started

const TOKEN = import.meta.env.VITE_TMDB_TOKEN
const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

if (!TOKEN) {
  console.error('[TMDB] VITE_TMDB_TOKEN manquant.')
}

// Cache mémoire simple — le service worker gère le cache HTTP persistant
const cache = new Map()
const TTL = 1000 * 60 * 30 // 30 min

async function tmdb(path, params = {}) {
  const url = new URL(BASE + path)
  url.searchParams.set('language', 'fr-FR')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  }
  const key = url.toString()

  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return hit.data

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json'
    }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`TMDB ${res.status}: ${text}`)
  }
  const data = await res.json()
  cache.set(key, { at: Date.now(), data })
  return data
}

export const tmdbApi = {
  /** Recherche de séries */
  searchTv(query, page = 1) {
    return tmdb('/search/tv', { query, page, include_adult: 'false' })
  },

  /** Détails d'une série */
  getShow(id) {
    return tmdb(`/tv/${id}`, { append_to_response: 'credits,videos' })
  },

  /** Fournisseurs de streaming FR (Netflix, Prime, Disney+…) */
  async getProvidersFR(id) {
    try {
      const data = await tmdb(`/tv/${id}/watch/providers`)
      return data.results?.FR ?? null
    } catch {
      return null
    }
  },

  /** Séries tendances — semaine */
  trending(timeWindow = 'week', page = 1) {
    return tmdb(`/trending/tv/${timeWindow}`, { page })
  },

  /** Séries populaires FR */
  popular(page = 1) {
    return tmdb('/tv/popular', { page, region: 'FR' })
  },

  /** Helpers URL images */
  poster(path, size = 'w342') {
    return path ? `${IMG}/${size}${path}` : null
  },
  backdrop(path, size = 'w780') {
    return path ? `${IMG}/${size}${path}` : null
  },
  providerLogo(path, size = 'w92') {
    return path ? `${IMG}/${size}${path}` : null
  }
}

/** Raccourci : récupère infos minimales pour afficher une série depuis son tmdb_id */
export async function getShowCard(id) {
  try {
    const show = await tmdbApi.getShow(id)
    return {
      id: show.id,
      name: show.name,
      poster: tmdbApi.poster(show.poster_path),
      backdrop: tmdbApi.backdrop(show.backdrop_path),
      year: show.first_air_date ? show.first_air_date.slice(0, 4) : '',
      overview: show.overview,
      genres: show.genres?.map(g => g.name) ?? [],
      vote: show.vote_average
    }
  } catch (e) {
    console.warn('getShowCard failed for', id, e)
    return null
  }
}
