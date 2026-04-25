// Génère un alias fictif basé sur les genres dominants du Top 3
// Algorithme déterministe : mêmes séries → même alias

// Genres TMDB pour TV (https://developer.themoviedb.org/reference/genre-tv-list)
// 10759 Action & Adventure, 16 Animation, 35 Comedy, 80 Crime, 99 Documentary,
// 18 Drama, 10751 Family, 10762 Kids, 9648 Mystery, 10763 News, 10764 Reality,
// 10765 Sci-Fi & Fantasy, 10766 Soap, 10767 Talk, 10768 War & Politics, 37 Western

const GENRE_PROFILES = {
  // [genre dominant, genre secondaire optionnel] → alias
  'drama': ['Le Tourmenté', 'L\'Introspectif', 'L\'Âme Noire'],
  'comedy': ['Le Sarcastique', 'L\'Ironiste', 'Le Pince-sans-rire'],
  'crime': ['Le Détective', 'Le Profileur', 'L\'Enquêteur Solitaire'],
  'thriller': ['Le Stratège', 'L\'Anxieux Lucide', 'Le Calculateur'],
  'mystery': ['Le Détective', 'Le Curieux Obsédé'],
  'sci-fi': ['Le Visionnaire', 'L\'Architecte du Futur', 'L\'Explorateur'],
  'fantasy': ['Le Rêveur', 'Le Conteur', 'L\'Idéaliste'],
  'action': ['Le Tacticien', 'Le Loup Solitaire'],
  'adventure': ['L\'Explorateur', 'Le Nomade'],
  'animation': ['L\'Évadé', 'Le Pur Esprit'],
  'documentary': ['L\'Observateur', 'Le Témoin'],
  'war': ['Le Stratège', 'Le Vétéran'],
  'politics': ['Le Stratège', 'L\'Intriguant'],
  'family': ['Le Sentimental'],
  'reality': ['Le Voyeur Bienveillant'],

  // Combinaisons (deux genres dominants)
  'drama+comedy': ['Le Mélancolique Ironique', 'Le Doux-Amer'],
  'drama+crime': ['Le Témoin Désabusé', 'Le Moraliste Sombre'],
  'drama+thriller': ['L\'Anxieux Lucide', 'L\'Inquiet Méthodique'],
  'comedy+crime': ['Le Pince-sans-rire à l\'Œil Vif'],
  'sci-fi+drama': ['L\'Architecte Mélancolique', 'Le Penseur du Futur'],
  'sci-fi+fantasy': ['Le Visionnaire Onirique'],
  'crime+mystery': ['Le Profileur Obsédé', 'Le Détective Méthodique'],
  'thriller+mystery': ['L\'Enquêteur Paranoïaque'],
  'comedy+drama': ['Le Doux-Amer', 'L\'Optimiste Désabusé'],
  'crime+thriller': ['Le Profileur Anxieux']
}

// Mapping ID TMDB → slug interne
const GENRE_MAP = {
  10759: 'action',
  16: 'animation',
  35: 'comedy',
  80: 'crime',
  99: 'documentary',
  18: 'drama',
  10751: 'family',
  10762: 'family',
  9648: 'mystery',
  10763: 'documentary',
  10764: 'reality',
  10765: 'sci-fi',
  10766: 'drama',  // soap → drama
  10767: 'reality',
  10768: 'war',
  37: 'adventure'
}

/**
 * @param {Array<{genres: Array<{id:number, name:string}>}>} shows  Les 3 séries du Top 3 avec genres
 * @returns {string|null}  Alias ou null si pas assez de données
 */
export function generateAlias(shows) {
  if (!shows || shows.length === 0) return null

  // Compter chaque genre slug dans les 3 séries
  const counts = {}
  for (const show of shows) {
    if (!show?.genres) continue
    const seenInThisShow = new Set()
    for (const g of show.genres) {
      const slug = GENRE_MAP[g.id]
      if (!slug || seenInThisShow.has(slug)) continue
      seenInThisShow.add(slug)
      counts[slug] = (counts[slug] || 0) + 1
    }
  }

  if (Object.keys(counts).length === 0) return null

  // Tri par fréquence puis alphabétique pour déterminisme
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  const [dom1, count1] = sorted[0]
  const [dom2, count2] = sorted[1] || []

  // Si 2 genres dominent à égalité ou presque, tenter une combinaison
  if (dom2 && count1 === count2) {
    const comboKey = [dom1, dom2].sort().join('+')
    const combo = GENRE_PROFILES[comboKey]
    if (combo) return pickDeterministic(combo, shows)
  }

  // Sinon : alias mono-genre
  const list = GENRE_PROFILES[dom1]
  if (list) return pickDeterministic(list, shows)

  return null
}

// Sélection déterministe basée sur les IDs des séries
function pickDeterministic(list, shows) {
  const seed = (shows || [])
    .map(s => s?.id || 0)
    .reduce((a, b) => a + b, 0)
  return list[seed % list.length]
}
