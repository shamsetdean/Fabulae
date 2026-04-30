// src/lib/recommender.js
// ─────────────────────────────────────────────────────────────────────────────
// Moteur de recommandation Fabulae
// Budget réseau : 3–5 appels TMDB max par session (cache chaud = 0)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase.js'
import { tmdbApi } from './tmdb.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const PROFILE_CACHE_KEY = uid => `reco_profile_${uid}`
const PROFILE_CACHE_TTL  = 60 * 60 * 1000   // 1h en ms
const TOP_LIKED_LIMIT    = 5                 // séries sources pour /recommendations
const RECO_RESULT_LIMIT  = 15                // résultats retournés par défaut

// ─── Poids implicites ─────────────────────────────────────────────────────────
//
// Combine signal explicite (note) et signal comportemental (status).
// Retourne un poids signé : positif = aime, négatif = n'aime pas, 0 = ignore.

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
//
// Lit depuis :
//   1. sessionStorage (TTL 1h) — zéro appel réseau
//   2. Supabase library_items — 1 appel
//   3. MEM_CACHE tmdbApi (synchrone) — zéro appel réseau
//
// Ne force jamais un fetch TMDB : si une série n'est pas en cache mémoire,
// on l'ignore pour le profil de genres. Elle est quand même dans watchedIds.

export async function buildUserProfile(userId) {

  // 1. Cache sessionStorage
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
  } catch (e) { /* ignore */ }

  // 2. Récupération des items bibliothèque depuis Supabase
  const { data: items, error } = await supabase
    .from('library_items')
    .select('tmdb_id, rating, status')
    .eq('user_id', userId)

  if (error || !items?.length) return null

  const watchedIds  = new Set(items.map(i => String(i.tmdb_id)))
  const actionable  = items.filter(i => itemWeight(i) !== 0)
  if (!actionable.length) return null

  // Séries les mieux notées → sources pour /recommendations
  // Seuil adaptatif : si peu de séries bien notées, on descend à >= 4
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
    itemCount: actionable.length
  }

  // 3. Enrichissement du profil depuis le cache mémoire uniquement (synchrone)
  for (const item of actionable) {
    const w    = itemWeight(item)
    const side = w > 0 ? 'pos' : 'neg'

    const cached = tmdbApi.getCached(item.tmdb_id)
    if (!cached) continue   // pas en cache mémoire → skip, pas de fetch

    // Genres (vecteur pos + neg)
    for (const g of cached.genres ?? []) {
      const vec = profile[side].genres
      vec[g.id] ??= { weight: 0, label: g.name }
      vec[g.id].weight += Math.abs(w)
    }

    // Networks et créateurs — uniquement côté positif
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

  // Persist sessionStorage
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      profile: { ...profile, watchedIds: [...watchedIds] },
      ts: Date.now()
    }))
  } catch (e) { /* quota dépassé, non bloquant */ }

  return profile
}

// ─── Scoring depuis les données déjà en mémoire ───────────────────────────────
//
// Les candidats viennent de /tv/{id}/recommendations qui retourne
// genres, networks, created_by → pas de fetch supplémentaire nécessaire.

function scoreShowFromCache(show, profile) {
  if (!show || profile.watchedIds.has(String(show.id))) return null

  let score = 0

  const genreMaxPos = Math.max(...Object.values(profile.pos.genres).map(g => g.weight), 1)
  const genreMaxNeg = Math.max(...Object.values(profile.neg.genres).map(g => g.weight), 1)

  // Genres : signal principal
  for (const g of show.genres ?? []) {
    const wPos = profile.pos.genres[g.id]?.weight ?? 0
    const wNeg = profile.neg.genres[g.id]?.weight ?? 0
    score += (wPos / genreMaxPos) * 40
    score -= (wNeg / genreMaxNeg) * 24   // pénalité à 60% du poids positif
  }

  // Créateurs : bonus fort si match
  for (const creator of show.created_by ?? []) {
    const w = profile.pos.creators[creator.id]?.weight ?? 0
    if (w > 0) score += Math.min((w / 10) * 15, 15)
  }

  // Networks : signal léger
  for (const net of show.networks ?? []) {
    const w = profile.pos.networks[net.id]?.weight ?? 0
    score += (w / 10) * 5
  }

  // Bonus popularité (log pour ne pas écraser le reste)
  score += Math.log10(Math.max(show.popularity ?? 1, 1)) * 2

  if (score <= 0) return null

  return {
    id:       show.id,
    name:     show.name || '',
    poster:   show.poster_path ? tmdbApi.poster(show.poster_path, 'w342') : null,
    overview: show.overview || '',
    year:     show.first_air_date?.slice(0, 4) || '',
    genres:   show.genres || [],
    score:    Math.round(score * 10) / 10
  }
}

// ─── Génération des recommandations ──────────────────────────────────────────
//
// Budget réseau :
//   - buildUserProfile  → 1 appel Supabase + 0 appel TMDB (MEM_CACHE)
//   - getRecommendations → 1 appel TMDB par topLikedId (3–5 max, cachés ensuite)
//   - scoreShowFromCache → 0 appel (données incluses dans /recommendations)
//
// Total premier chargement : ~4–6 appels
// Total revisit (cache chaud) : 0 appel

export async function generateRecommendations(userId, options = {}) {
  const { limit = RECO_RESULT_LIMIT } = options

  const profile = await buildUserProfile(userId)
  if (!profile)                      return { results: [], reason: 'no_ratings' }
  if (!profile.topLikedIds.length)   return { results: [], reason: 'no_liked' }

  // Fetch /recommendations pour chaque série source (3–5 appels, cachés Supabase)
  const recoSets = await Promise.all(
    profile.topLikedIds.map(id => tmdbApi.getRecommendations(id))
  )

  // Fusion + déduplication
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

  // Rerank par profil utilisateur (zéro appel réseau)
  const scored = candidates
    .map(show => scoreShowFromCache(show, profile))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return {
    results:         scored,
    reason:          scored.length ? 'ok' : 'no_candidates',
    profileStrength: profile.topLikedIds.length   // 0–5 → pour adapter le message UI
  }
}

// ─── Invalidation du cache ────────────────────────────────────────────────────
//
// À appeler après saveSelection() quand rating >= 5 ou status change.

export function invalidateProfileCache(userId) {
  try { sessionStorage.removeItem(PROFILE_CACHE_KEY(userId)) }
  catch (e) { /* ignore */ }
}
