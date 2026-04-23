# 📺 My TVShow

Réseau social minimaliste pour partager ses **Top 3 séries du moment** et découvrir celles des autres. Avec indication des plateformes de streaming en France.

**Stack** : Vite + Alpine.js + Tailwind CSS · Supabase (Auth + Postgres) · TMDB API · PWA installable.

---

## 🚀 Mise en route (15–20 min)

### 1. Installer les dépendances

```bash
cd my-tvshow
npm install
```

### 2. Créer ton projet Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un compte gratuit.
2. **New project** → choisis un nom (`my-tvshow`), un mot de passe DB, région `West EU (Ireland)` ou proche.
3. Attends 2 minutes que le projet soit provisionné.
4. Dans le dashboard → **SQL Editor** → **New query** → copie-colle le contenu de `supabase/schema.sql` → **Run**.
5. Récupère tes clés : **Settings** → **API** :
   - `Project URL` → c'est ton `VITE_SUPABASE_URL`
   - `anon public` key → c'est ton `VITE_SUPABASE_ANON_KEY`

**Important** : dans **Authentication** → **Providers** → **Email**, désactive "Confirm email" pendant le dev pour tester sans vérif email. À réactiver en prod.

### 3. Obtenir une clé TMDB

1. Crée un compte sur [themoviedb.org](https://www.themoviedb.org/signup)
2. Après vérification email, va sur [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
3. **Request an API Key** → type **Developer** → gratuit, remplis le formulaire (usage "personal / learning", URL : `http://localhost:5173`)
4. Une fois approuvé (instantané en général), copie **l'API Read Access Token** (le long token qui commence par `eyJ...`), **pas** la clé v3.

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Puis édite `.env.local` avec tes vraies valeurs :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_TMDB_TOKEN=eyJhbGci...
```

### 5. Lancer l'app

```bash
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173). Crée un compte, choisis un pseudo, publie ton premier Top 3.

---

## 📱 Fonctionnalités

- **Auth email/password** (Supabase Auth)
- **Top 3 éditable** : recherche TMDB instantanée, drag-free avec slots cliquables, commentaire optionnel (280 car.)
- **Fil** : tous les Top 3 de la communauté OU uniquement tes abonnements
- **Classements** :
  - *Chez les membres* : pondération 3-2-1 sur les positions, sur les Top 3 actuels
  - *Mondial (semaine)* : tendances TMDB directes
- **Fiche série** : synopsis, genres, saisons, note, et **plateformes de streaming FR** (Netflix, Prime, Disney+, Canal+, etc.) via les "watch providers" TMDB/JustWatch
- **Profils** : Top 3 actuel, historique, abonnés, abonnements, follow/unfollow
- **Likes** sur les Top 3
- **PWA installable** : sur iOS "Ajouter à l'écran d'accueil", sur Android "Installer l'app"

---

## 📦 Déploiement sur Vercel

### Via l'interface web (le plus simple)

1. Pousse ton code sur GitHub.
2. Va sur [vercel.com/new](https://vercel.com/new) → importe ton repo.
3. Vercel détecte Vite automatiquement. Laisse les paramètres par défaut.
4. **Environment Variables** → ajoute les 3 variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TMDB_TOKEN`).
5. **Deploy**.

### Via CLI

```bash
npm i -g vercel
vercel
```

Ajoute ensuite les env vars dans le dashboard Vercel.

### Ajuster Supabase pour la prod

Une fois déployé, ajoute ton URL Vercel dans :
- **Supabase** → **Authentication** → **URL Configuration** → **Site URL** : `https://ton-app.vercel.app`
- **Redirect URLs** : même URL + `/**`

---

## 🏗️ Architecture

```
src/
├── main.js                # Point d'entrée : injecte le template, démarre Alpine
├── style.css              # Tailwind + styles custom
├── lib/
│   ├── supabase.js        # Client Supabase
│   ├── tmdb.js            # Client TMDB (+ cache mémoire)
│   └── store.js           # Store Alpine global (session, profile, routing)
├── views/                 # Logique/état par route (pas de HTML ici)
│   ├── auth.js
│   ├── onboarding.js
│   ├── feed.js
│   ├── top3.js
│   ├── trending.js
│   ├── profile.js
│   └── show.js
└── components/
    └── template.js        # Tout le HTML de l'app (un seul gros template)
```

**Routing** : hash-based (`#/feed`, `#/top3`, `#/u/:username`, `#/show/:tmdb_id`). Un seul parseur dans `store.js`.

**Sécurité** : toutes les tables ont Row Level Security activée. Les policies garantissent que chacun ne peut modifier/supprimer que ses propres données. Lecture publique pour feed/profils (c'est un réseau social).

**Cache** : côté client (30 min mémoire) + service worker pour images TMDB (30 jours) et appels API (6 h).

---

## 💰 Coûts

**Free tier jusqu'à ~1000 utilisateurs actifs** :

| Service | Free tier | Si ça décolle |
|---|---|---|
| Supabase | 500 MB DB, 50k MAU, auth, 1 GB storage | 25 $/mois (Pro) |
| Vercel | 100 GB bande passante/mois | 20 $/mois (Pro) |
| TMDB | Gratuit et illimité pour usage non-commercial | — |

---

## 🎨 Choix de design

**Inspiration** : magazines cinéma modernes (*Little White Lies*, *Film Comment*). Noir profond + accent rouge-orange (couleur projecteur), typo serif italique pour l'émotion + sans-serif géométrique pour la lisibilité.

**Fonts** :
- Display : **Instrument Serif** (Google Fonts)
- Body : **Onest**
- Mono : **JetBrains Mono**

**Grain texture** : overlay SVG animé en CSS pour évoquer la pellicule.

---

## 🧪 Tester rapidement

Une fois l'app lancée :

1. Crée 2 comptes différents (navigation privée pour le 2e).
2. Sur chaque compte, publie un Top 3 différent.
3. Depuis l'un, va sur `#/u/pseudo_de_l_autre` pour voir son profil, clique "S'abonner".
4. Retour au feed, bascule sur "Mes abonnements" — tu dois voir son Top 3.
5. Va sur `#/trending` → onglet "Chez les membres" : tes séries apparaissent avec leur score.
6. Clique sur une série du Top 3 → fiche avec plateformes FR.

---

## 🐛 Dépannage

**"Invalid API key" au chargement** → `.env.local` absent ou variables mal nommées. Elles doivent commencer par `VITE_`.

**"Failed to fetch" sur TMDB** → tu as utilisé la clé API v3 au lieu du **Read Access Token** v4.

**Auth signup échoue silencieusement** → confirme que dans Supabase → Authentication → Providers → Email, "Confirm email" est désactivé pendant le dev.

**Les images TMDB ne s'affichent pas** → vérifie que ta clé TMDB est correcte en testant manuellement : `curl -H "Authorization: Bearer TON_TOKEN" https://api.themoviedb.org/3/tv/popular`

**Le classement "Chez les membres" est vide** → normal tant qu'aucun Top 3 n'a été publié par un membre.

---

## 🛣️ Pour aller plus loin

Pistes d'évolution réalistes :
- Upload d'avatar (Supabase Storage est déjà provisionné dans le free tier)
- Commentaires sous les Top 3
- Notifications (follow, like) via Supabase Realtime
- Partage d'un Top 3 via lien + Open Graph image générée dynamiquement
- Modération (signalement + dashboard admin)
- Internationalisation si tu veux sortir de FR

---

## 📄 Licence

Ce code t'appartient. TMDB exige mention : "This product uses the TMDB API but is not endorsed or certified by TMDB." — à ajouter dans les mentions légales si tu ouvres au public.
