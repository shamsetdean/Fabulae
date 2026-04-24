# My TVShow

Réseau social minimaliste pour partager ses **Top 3 séries du moment**, suivre sa progression, et découvrir où regarder chaque série en France.

**Stack** : Vite · Alpine.js · Tailwind CSS · Supabase · TMDB API · PWA

---

## Fonctionnalités

### Social
- **Top 3 des séries du moment** : publie tes 3 séries favorites avec un commentaire optionnel
- **Fil d'actualité** filtrable : tout le monde ou uniquement tes abonnements
- **Likes** sur les Top 3
- **Follow / Unfollow** d'autres membres
- **Profils publics** avec Top 3 actuel et historique (`/u/pseudo`)
- **Classement communautaire** pondéré (position 1 = 3 pts, 2 = 2 pts, 3 = 1 pt)
- **Tendances mondiales** TMDB (semaine)

### Bibliothèque personnelle
- Ajoute n'importe quelle série à ta **bibliothèque** avec 4 statuts : à voir, en cours, terminée, abandonnée
- Pour les séries **en cours** : suivi de la saison et de l'épisode actuel
- **Plateforme de reprise** : indique où tu regardes (Netflix, Prime, Disney+, Canal+...) avec lien direct vers la recherche sur leur site
- Bouton **+1 épisode** pour avancer rapidement ta progression
- **Verdict en 1 phrase** optionnel quand tu termines une série

### Fiche série
- Synopsis, genres, saisons, note TMDB
- **Plateformes de streaming FR** (abonnement, gratuit, location/achat) via JustWatch
- Ajout à la bibliothèque en 1 clic

### Mobile-first
- **PWA installable** sur iOS et Android
- Navigation bottom-bar style app native
- Optimisée pour les écrans de téléphone
- Cache offline des images déjà consultées

---

## Mise en route (15-20 min)

### 1. Cloner et installer

```bash
git clone https://github.com/<ton-username>/<ton-repo>.git
cd my-tvshow
npm install
```

### 2. Créer un projet Supabase

1. Crée un compte sur [supabase.com](https://supabase.com)
2. **New project** → nom `my-tvshow`, région `West EU (Ireland)` ou `Central EU (Frankfurt)`
3. Attends ~2 min que le projet se provisionne
4. **SQL Editor** → **New query** → colle le contenu de `supabase/schema.sql` → **Run**
5. **SQL Editor** → nouvelle query → colle `supabase/migration-watchlist.sql` → **Run**
6. Vérifie dans **Table Editor** que tu as 5 tables : `profiles`, `top_lists`, `likes`, `follows`, `watchlist`

### 3. Récupérer les clés Supabase

**Settings** → **API Keys** :
- **Publishable key** (commence par `sb_publishable_...`) → c'est ta `VITE_SUPABASE_ANON_KEY`

**Settings** → **Data API** (ou écran d'accueil du projet) :
- **URL** du projet (forme `https://xxxxx.supabase.co`) → c'est ta `VITE_SUPABASE_URL`

### 4. Désactiver la confirmation email (dev)

**Authentication** → **Sign In / Providers** → **Email** → désactive **"Confirm email"** → Save.

À réactiver en prod.

### 5. Obtenir un token TMDB

1. Crée un compte sur [themoviedb.org/signup](https://www.themoviedb.org/signup)
2. Vérifie ton email, puis va sur [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
3. **Request an API Key** → **Developer** → remplis le formulaire (usage personnel, URL peu importe)
4. Une fois approuvé (instantané), copie l'**API Read Access Token** (long token commençant par `eyJ...`)

**Important** : prends le Read Access Token v4, pas la clé v3 (sinon erreur 401 à chaque requête).

### 6. Variables d'environnement

```bash
cp .env.example .env.local
```

Édite `.env.local` :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx...
VITE_TMDB_TOKEN=eyJhbGci...
```

### 7. Lancer en local

```bash
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173). Crée un compte, choisis un pseudo, publie ton premier Top 3.

---

## Déploiement Vercel

### Via l'interface web (recommandé)

1. Push ton code sur GitHub
2. [vercel.com/new](https://vercel.com/new) → importe ton repo
3. Vercel détecte Vite automatiquement — laisse les paramètres par défaut
4. **Environment Variables** : ajoute les 3 variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_TOKEN`)
5. **Deploy**

### Ajuster Supabase pour la prod

Une fois ton URL Vercel obtenue (ex: `my-tvshow.vercel.app`) :

**Supabase** → **Authentication** → **URL Configuration** :
- **Site URL** : `https://my-tvshow.vercel.app`
- **Redirect URLs** : `https://my-tvshow.vercel.app` et `https://my-tvshow.vercel.app/**`

---

## Architecture

```
src/
├── main.js                # Point d'entrée : injection template + démarrage Alpine
├── style.css              # Tailwind + design tokens (glassmorphism)
├── lib/
│   ├── supabase.js        # Client Supabase
│   ├── tmdb.js            # Client TMDB avec cache localStorage 24h
│   └── store.js           # Store Alpine global (session, profile, routing)
├── views/                 # Logique/état par route (pas de HTML)
│   ├── auth.js
│   ├── onboarding.js
│   ├── feed.js
│   ├── top3.js
│   ├── trending.js
│   ├── profile.js
│   ├── show.js
│   └── watchlist.js       # Bibliothèque personnelle
└── components/
    └── template.js        # Tout le HTML de l'app (un gros template string)

supabase/
├── schema.sql               # Tables principales + RLS
└── migration-watchlist.sql  # Ajout de la watchlist
```

**Routing** : hash-based (`#/feed`, `#/u/:username`, `#/show/:tmdb_id`). Parseur dans `lib/store.js`.

**Sécurité** : Row Level Security activée sur toutes les tables. Policies garantissent que chacun ne modifie que ses propres données. Lecture publique (réseau social).

**Cache** :
- Mémoire + localStorage 24h pour TMDB (persistant entre rechargements)
- Service worker PWA pour les images TMDB (30 jours)

---

## Schéma de base de données

| Table | Rôle |
|---|---|
| `profiles` | Profils utilisateur (username, bio, lié à auth.users) |
| `top_lists` | Top 3 publiés, avec flag `is_current` pour l'historique |
| `likes` | Likes sur les top lists (contrainte unique user+top) |
| `follows` | Relations follower → following |
| `watchlist` | Bibliothèque perso (status, saison/épisode, plateforme) |

**Vues SQL** :
- `top_lists_with_profile` : fil enrichi (username, like_count, liked_by_me)
- `community_trending` : classement pondéré 3-2-1 sur les Top 3 actifs

---

## Optimisations de performance

- **Preconnect** aux API critiques dans `<head>` (TMDB, Supabase, Google Fonts)
- **`font-display: swap`** : polices non-bloquantes pour le rendu initial
- **Cache TMDB persistant** (localStorage, 24h) — les séries déjà vues ne refont pas d'appel
- **Tailles d'images adaptatives** : w92 pour vignettes, w154 pour cartes, w342 pour fiches
- **Lazy loading** sur toutes les images
- **Code splitting Vite** automatique
- **Service worker PWA** pour cache offline
- **Bundle** : ~80 KB gzippé (JS) + ~5 KB gzippé (CSS)

---

## Design system

**Palette** (sombre, inspirée magazine cinéma)
- Fond : `#0A0908` (noir profond)
- Accent primaire : `#FF6B35` → `#E63946` (gradient rouge-orange)
- Texte principal : `#F5ECE3` (crème, contraste WCAG AA)
- Texte secondaire : `#B8A99A`

**Typographie**
- **Display** : Instrument Serif italique (titres, numéros de rang)
- **Corps** : Onest (500, 600)
- **Mono** : system `ui-monospace`

**Composants glass**
- Cartes translucides (`rgba(255,255,255,0.035)` + `backdrop-filter: blur(20px)`)
- Bordures arrondies (20px pour cartes, 14px pour boutons)
- Ombres douces avec inner highlight
- Animations : shimmer pour loading, slide-up pour apparitions

---

## Coûts

**Gratuit jusqu'à ~1000 utilisateurs actifs** :

| Service | Free tier | Scaling |
|---|---|---|
| Supabase | 500 MB DB, 50k MAU, 1 GB storage | $25/mois (Pro) |
| Vercel | 100 GB bande passante/mois | $20/mois (Pro) |
| TMDB | Illimité (non-commercial) | — |

---

## Tester rapidement

1. Crée 2 comptes (navigation privée pour le 2e)
2. Sur chaque compte, publie un Top 3 différent
3. Depuis l'un, va sur `#/u/pseudo_de_l_autre` → clique **Suivre**
4. Retour au fil → bascule sur **Mes abonnements** → tu dois voir son Top 3
5. Ajoute une série à ta bibliothèque en mode **En cours** avec saison/épisode + plateforme
6. Profil → onglet **Bibliothèque** → sous-onglet **En cours** → tu vois ta série
7. Clique la pastille plateforme → tu es redirigé vers Netflix/Prime/etc.

---

## Dépannage

**"Invalid API key" au chargement**
→ `.env.local` absent ou mal nommé. Les variables doivent commencer par `VITE_`.

**"Failed to fetch" sur TMDB**
→ Tu as utilisé la clé v3 au lieu du **Read Access Token v4**.

**Signup bloque sans message**
→ Confirm email activé dans Supabase → Authentication → Email providers. Désactive-le en dev.

**"NetworkError when attempting to fetch resource"**
→ URL Supabase incorrecte dans les variables d'env. Vérifie qu'il n'y a **pas de `/rest/v1/`** à la fin, et pas de faute de frappe.

**"Email not confirmed"**
→ Confirm email activé (cf. ci-dessus), ou clique le lien de vérification dans ta boîte mail.

**Écran noir sur Vercel**
→ Variables d'env manquantes ou mal nommées. Va dans Settings → Environment Variables, vérifie les 3 valeurs, puis Deployments → dernier deploy → ... → Redeploy (sans cache).

---

## Évolutions possibles

- Upload d'avatar (Supabase Storage dans le free tier)
- Commentaires sous les Top 3
- Notifications realtime (follow, like) via Supabase Realtime
- Partage d'un Top 3 via lien + image Open Graph dynamique
- Suggestions de follow basées sur les goûts communs
- Modération (signalements + dashboard admin)
- Internationalisation

---

## Licence et attribution

- Ce code t'appartient.
- TMDB exige mention : "This product uses the TMDB API but is not endorsed or certified by TMDB."
- Données de disponibilité streaming : fournies par JustWatch via TMDB.
