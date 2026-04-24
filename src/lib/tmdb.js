// Client TMDB — avec cache localStorage persistant (24h) pour performance
// Doc: https://developer.themoviedb.org/reference/intro/getting-started

const TOKEN = import.meta.env.VITE_TMDB_TOKEN
const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

const CACHE_KEY = 'tmdb_cache_v1'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24  // 24h

if (!TOKEN) {
  console.error('[TMDB] VITE_TMDB_TOKEN manquant.')
}

// Cache persistant localStorage — survit aux rechargements
// Structure : { [url]: { at: timestamp, data: ... } }
let cache = {}
try {
  const raw = localStorage.getItem(CACHE_KEY)
  if (raw) {
    cache = JSON.parse(raw)
    // Nettoyage des entrées expirées au chargement
    const now = Date.now()
    let cleaned = false
    for (const k of Object.keys(cache)) {
      if (!cache[k] || now - cache[k].at > CACHE_TTL_MS) {
        delete cache[k]
        cleaned = true
      }
    }
    if (cleaned) persistCache()
  }
} catch (e) {
  console.warn('[TMDB] Cache corrompu, reset.', e)
  cache = {}
}

// Throttle de persistance pour éviter trop d'écritures
let persistTimer = null
function persistCache() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      // Limite : 4 MB pour rester sous la quota localStorage
      const str = JSON.stringify(cache)
      if (str.length < 4_000_000) {
        localStorage.setItem(CACHE_KEY, str)
      } else {
        // Si trop gros, on garde seulement les 100 entrées les plus récentes
        const entries = Object.entries(cache)
          .sort((a, b) => b[1].at - a[1].at)
          .slice(0, 100)
        cache = Object.fromEntries(entries)
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      }
    } catch (e) {
      console.warn('[TMDB] Échec persistance cache', e)
    }
  }, 500)
}

async function tmdb(path, params = {}) {
  const url = new URL(BASE + path)
  url.searchParams.set('language', 'fr-FR')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  }
  const key = url.toString()

  const hit = cache[key]
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data

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
  cache[key] = { at: Date.now(), data }
  persistCache()
  return data
}

export const tmdbApi = {
  searchTv(query, page = 1) {
    return tmdb('/search/tv', { query, page, include_adult: 'false' })
  },

  getShow(id) {
    return tmdb(`/tv/${id}`, { append_to_response: 'credits,videos' })
  },

  async getProvidersFR(id) {
    try {
      const data = await tmdb(`/tv/${id}/watch/providers`)
      return data.results?.FR ?? null
    } catch {
      return null
    }
  },

  trending(timeWindow = 'week', page = 1) {
    return tmdb(`/trending/tv/${timeWindow}`, { page })
  },

  popular(page = 1) {
    return tmdb('/tv/popular', { page, region: 'FR' })
  },

  /**
   * Helpers URL images — tailles optimisées par usage
   * w92   : logos plateformes, mini vignettes (<40px)
   * w154  : vignettes recherche, cartes feed (60-120px)
   * w342  : posters fiche série, affichage moyen (120-220px)
   * w500+ : backdrops fullscreen uniquement
   */
  poster(path, size = 'w154') {
    return path ? `${IMG}/${size}${path}` : null
  },
  backdrop(path, size = 'w780') {
    return path ? `${IMG}/${size}${path}` : null
  },
  providerLogo(path, size = 'w92') {
    return path ? `${IMG}/${size}${path}` : null
  }
}

/** Raccourci : infos minimales pour afficher une série dans une carte */
export async function getShowCard(id) {
  try {
    const show = await tmdbApi.getShow(id)
    return {
      id: show.id,
      name: show.name,
      poster: tmdbApi.poster(show.poster_path, 'w154'),  // taille optimisée pour cartes
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
