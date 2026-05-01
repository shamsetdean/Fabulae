// src/lib/recommender.js
// ─────────────────────────────────────────────────────────────────────────────
// Moteur de recommandation Fabulae
// Budget réseau : 3–5 appels TMDB max par session (cache chaud = 0)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase.js'
import { tmdbApi } from './tmdb.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const PROFILE_CACHE_KEY = uid => `reco_profile_${uid}`
const PROFILE_CACHE_TTL  = 60 * 60 * 1000
const TOP_LIKED_LIMIT    = 5
const RECO_RESULT_LIMIT  = 15

// Catalogue de référence TMDB : estimation des séries de qualité (note > 6, > 100 votes)
// Source : requêtes paginées TMDB /discover/tv. Valeur stable, révisable manuellement.
const TMDB_QUALITY_CATALOG_SIZE = 10000

// ─── Poids implicites ─────────────────────────────────────────────────────────

function itemWeight(item) {
  if (item.rating != null) {
    if (item.rating >= 9)  return 10
    if (item.rating >= 7)  return 8
    if (item.rating >= 5)  return 6
    if (item.rating >= 3)  return 2
    return -5
  }
  switch (item.status) {
    case 'watching':       return 5
    case 'watched':        return 4
    case 'want_to_watch':  return 3
    case 'dropped':        return -4
    default:               return 0
  }
}

// ─── Construction du profil utilisateur ──────────────────────────────────────

export async function buildUserProfile(userId) {

  const cacheKey = PROFILE_CACHE_KEY(userId)
  try {
    const raw = sessionStorage.getItem(cacheKey)
    if (raw) {
      const { profile, ts } = JSON.parse(raw)
      if (Date.now() - ts < PROFILE_CACHE_TTL) {
        profile.watchedIds = new Set(profile.watchedIds)
        return profile
      }
    }
  } catch (e) {}

  const { data: items, error } = await supabase
    .from('library_items')
    .select('tmdb_id, rating, status')
    .eq('user_id', userId)

  if (error || !items?.length) return null

  const watchedIds  = new Set(items.map(i => String(i.tmdb_id)))
  const actionable  = items.filter(i => itemWeight(i) !== 0)
  if (!actionable.length) return null

  const strongLiked = actionable.filter(i => itemWeight(i) >= 6)
  const sourceLiked = strongLiked.length >= 3
    ? strongLiked
    : actionable.filter(i => itemWeight(i) >= 4)

  const profile = {
    pos: { genres: {}, networks: {}, creators: {} },
    neg: { genres: {} },
    watchedIds,
    topLikedIds: sourceLiked
      .sort((a, b) => itemWeight(b) - itemWeight(a))
      .slice(0, TOP_LIKED_LIMIT)
      .map(i => i.tmdb_id),
    itemCount: actionable.length,
    totalItems: items.length
  }

  // Fetch TMDB pour les séries bien notées pas encore en cache mémoire
  // Limité à 10 appels max — budget réseau raisonnable, cachés ensuite
  const toFetch = actionable
    .filter(item => !tmdbApi.getCached(item.tmdb_id) && itemWeight(item) >= 4)
    .slice(0, 10)

  if (toFetch.length > 0) {
    await Promise.all(toFetch.map(item => tmdbApi.getShow(item.tmdb_id).catch(() => null)))
  }

  for (const item of actionable) {
    const w    = itemWeight(item)
    const side = w > 0 ? 'pos' : 'neg'

    const cached = tmdbApi.getCached(item.tmdb_id)
    if (!cached) continue

    for (const g of cached.genres ?? []) {
      const vec = profile[side].genres
      vec[g.id] ??= { weight: 0, label: g.name }
      vec[g.id].weight += Math.abs(w)
    }

    if (side === 'pos') {
      for (const net of cached.networks ?? []) {
        profile.pos.networks[net.id] ??= { weight: 0, label: net.name }
        profile.pos.networks[net.id].weight += Math.abs(w) * 0.4
      }
      for (const creator of cached.created_by ?? []) {
        profile.pos.creators[creator.id] ??= { weight: 0, label: creator.name }
        profile.pos.creators[creator.id].weight += Math.abs(w) * 0.6
      }
    }
  }

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      profile: { ...profile, watchedIds: [...watchedIds] },
      ts: Date.now()
    }))
  } catch (e) {}

  return profile
}

// ─── Score de compatibilité ────────────────────────────────────────────────────
//
// Retourne un entier entre 0 et 100 représentant la compatibilité
// entre une série et le profil de l'utilisateur.
//
// Basé sur :
//   - genres positifs pondérés (signal principal, 70%)
//   - genres négatifs (pénalité, -30%)
//   - popularité TMDB (bonus léger, 15%)
//   - créateurs connus (bonus, 15%)
//
// Normalisé sur le score max théorique pour ne jamais dépasser 100%.

export function computeCompatibility(show, profile) {
  if (!show || !profile) return null

  // Accepte genres (objets {id,name}) OU genre_ids (entiers) selon la source TMDB
  let genreIds = []
  if (Array.isArray(show.genres) && show.genres.length > 0) {
    genreIds = show.genres.map(g => g.id)
  } else if (Array.isArray(show.genre_ids) && show.genre_ids.length > 0) {
    genreIds = show.genre_ids
  }

  if (!genreIds.length) return null

  const posWeights = Object.values(profile.pos.genres).map(g => g.weight)
  const negWeights = Object.values(profile.neg.genres).map(g => g.weight)
  const maxPos = Math.max(...posWeights, 1)
  const maxNeg = Math.max(...negWeights, 1)

  let raw = 0

  for (const id of genreIds) {
    const wPos = profile.pos.genres[id]?.weight ?? 0
    const wNeg = profile.neg.genres[id]?.weight ?? 0
    raw += (wPos / maxPos) * 70
    raw -= (wNeg / maxNeg) * 30
  }

  for (const creator of show.created_by ?? []) {
    const w = profile.pos.creators[creator.id]?.weight ?? 0
    if (w > 0) raw += Math.min((w / 10) * 15, 15)
  }

  raw += Math.log10(Math.max(show.popularity ?? 1, 1)) * 1.5

  const score = Math.min(Math.max(Math.round(raw), 0), 100)

  const hasAnyPosGenre = genreIds.some(id => (profile.pos.genres[id]?.weight ?? 0) > 0)
  if (!hasAnyPosGenre && score < 20) return null

  return score
}

// ─── Score d'exploration du catalogue ────────────────────────────────────────
//
// Calcule le % du catalogue TMDB de référence exploré par l'utilisateur.
// Deux niveaux :
//   - global : totalItems / TMDB_QUALITY_CATALOG_SIZE
//   - par genre : items de ce genre / taille estimée du genre dans le catalogue
//
// Les tailles par genre sont des estimations calibrées sur TMDB.

const GENRE_CATALOG_SIZES = {
  18:    3500,  // Drame
  35:    2000,  // Comédie
  80:    1200,  // Crime
  10765: 900,   // Sci-Fi & Fantastique
  10759: 800,   // Action & Aventure
  9648:  700,   // Mystère
  99:    600,   // Documentaire
  16:    500,   // Animation
  10768: 400,   // Guerre & Politique
  37:    300,   // Western
  10751: 800,   // Familial
  10764: 400,   // Reality
}

export function computeExplorationScore(totalItems, genreStats) {
  const globalPercent = Math.min(
    parseFloat(((totalItems / TMDB_QUALITY_CATALOG_SIZE) * 100).toFixed(2)),
    100
  )

  const byGenre = genreStats.map(g => {
    const catalogSize = GENRE_CATALOG_SIZES[g.id] || 500
    const percent = Math.min(
      parseFloat(((g.count / catalogSize) * 100).toFixed(1)),
      100
    )
    return { ...g, explorationPercent: percent, catalogSize }
  }).sort((a, b) => b.explorationPercent - a.explorationPercent)

  return { globalPercent, byGenre }
}

// ─── Scoring depuis les données déjà en mémoire ───────────────────────────────

function scoreShowFromCache(show, profile) {
  if (!show || profile.watchedIds.has(String(show.id))) return null

  let score = 0

  const genreMaxPos = Math.max(...Object.values(profile.pos.genres).map(g => g.weight), 1)
  const genreMaxNeg = Math.max(...Object.values(profile.neg.genres).map(g => g.weight), 1)

  for (const g of show.genres ?? []) {
    const wPos = profile.pos.genres[g.id]?.weight ?? 0
    const wNeg = profile.neg.genres[g.id]?.weight ?? 0
    score += (wPos / genreMaxPos) * 40
    score -= (wNeg / genreMaxNeg) * 24
  }

  for (const creator of show.created_by ?? []) {
    const w = profile.pos.creators[creator.id]?.weight ?? 0
    if (w > 0) score += Math.min((w / 10) * 15, 15)
  }

  for (const net of show.networks ?? []) {
    const w = profile.pos.networks[net.id]?.weight ?? 0
    score += (w / 10) * 5
  }

  score += Math.log10(Math.max(show.popularity ?? 1, 1)) * 2

  if (score <= 0) return null

  return {
    id:       show.id,
    name:     show.name || '',
    poster:   show.poster_path ? tmdbApi.poster(show.poster_path, 'w342') : null,
    overview: show.overview || '',
    year:     show.first_air_date?.slice(0, 4) || '',
    genres:   show.genres || [],
    genre_ids: show.genre_ids || (show.genres || []).map(g => g.id),
    popularity: show.popularity || 0,
    score:    Math.round(score * 10) / 10
  }
}

// ─── Génération des recommandations ──────────────────────────────────────────

export async function generateRecommendations(userId, options = {}) {
  const { limit = RECO_RESULT_LIMIT } = options

  const profile = await buildUserProfile(userId)
  if (!profile)                      return { results: [], reason: 'no_ratings' }
  if (!profile.topLikedIds.length)   return { results: [], reason: 'no_liked' }

  const recoSets = await Promise.all(
    profile.topLikedIds.map(id => tmdbApi.getRecommendations(id))
  )

  const seen       = new Set()
  const candidates = []
  for (const set of recoSets) {
    for (const show of set) {
      if (seen.has(show.id) || profile.watchedIds.has(String(show.id))) continue
      seen.add(show.id)
      candidates.push(show)
    }
  }

  if (!candidates.length) return { results: [], reason: 'no_candidates' }

  const scored = candidates
    .map(show => scoreShowFromCache(show, profile))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return {
    results:         scored,
    reason:          scored.length ? 'ok' : 'no_candidates',
    profileStrength: profile.topLikedIds.length
  }
}

// ─── Invalidation du cache ────────────────────────────────────────────────────

export function invalidateProfileCache(userId) {
  try { sessionStorage.removeItem(PROFILE_CACHE_KEY(userId)) }
  catch (e) {}
}
