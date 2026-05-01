# Fabulae

**L'art de ne jamais perdre le fil.**

Réseau social minimaliste autour des séries TV. Chaque utilisateur publie son **Top 3** et son **Flop 3** du moment, suit d'autres membres, découvre les tendances et gère sa bibliothèque personnelle.

[![Live](https://img.shields.io/badge/Live-fabulae.vercel.app-7a1f2e?style=flat-square&logo=vercel&logoColor=white)](https://fabulae.vercel.app)

---

## Fonctionnalités

### Social
- **Top 3 / Flop 3** — Publication de ses classements du moment avec un alias généré dynamiquement depuis les genres
- **Fil d'actualité** — Cartes regroupées (Top + Flop d'un même utilisateur dans une seule carte), filtrables par abonnements
- **Likes** — Like indépendant sur le Top et le Flop
- **Profils publics** — Avatar, alias, classements actuels, analyse des habitudes, bibliothèque
- **Abonnements** — Suivre / ne plus suivre un utilisateur
- **Notifications** — Alertes en temps réel (nouveaux Top 3 / Flop 3, nouveaux abonnés) avec protection anti-spam (1 notif identique max par 24h)

### Bibliothèque personnelle
- **Ajout de séries** via recherche TMDB inline (debounce 300ms, AbortController, cache 60s)
- **Statuts** : À voir · En cours · Terminée · Abandonnée
- **Notes** : 1 à 5 étoiles avec affichage visuel ★★★★☆
- **Recommandation** : Je recommande / Je ne recommande pas
- **Visibilité** : Publique (accessible aux followers) ou Privée
- **Filtres** par statut, recherche textuelle, compteurs

### Tendances
- Classement des séries les plus mentionnées par la communauté (calculé depuis `library_items`)
- Score pondéré selon les notes utilisateurs (5★ = poids 5, 4★ = 4, défaut = 3, basses = 2)
- Watch providers disponibles en France

### Analyse du profil
- Camembert SVG des genres préférés (calculé côté client, 0 appel API supplémentaire)
- Liste des genres jamais explorés
- Visibilité paramétrable (Public / Privé)

### Performance
- **Cache stale-while-revalidate** : navigation entre vues instantanée (Feed, Library, Profile)
- **Debounce + AbortController** sur les recherches TMDB : 1 requête au lieu de N par frappe
- **Tailles d'images TMDB adaptatives** (`thumb` / `card` / `detail` / `hero`)
- **`decoding="async"`** sur toutes les images lazy : scroll non bloquant
- **Cache TMDB** double couche (mémoire + Supabase)

### PWA
- Installable sur iPhone et Android
- Service Worker en mode `prompt` (pas de mise à jour silencieuse)
- Toast top-center « L'appli a une nouvelle version, mettre à jour »
- Vérification au focus de l'onglet + toutes les 30 minutes
- Mode standalone (sans barre de navigation du navigateur)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | [Alpine.js](https://alpinejs.dev) v3 + HTML/CSS |
| Style | [Tailwind CSS](https://tailwindcss.com) v3 |
| Build | [Vite](https://vitejs.dev) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app) (`registerType: 'prompt'`) |
| Backend / Auth / BDD | [Supabase](https://supabase.com) (PostgreSQL + RLS + Realtime) |
| API séries TV | [TMDB](https://www.themoviedb.org/documentation/api) v4 |
| Déploiement | [Vercel](https://vercel.com) (auto-deploy sur push `main`) |

### Typographie
- **Instrument Serif** (italic) — Titres, headlines, identité éditoriale
- **Onest** — Interface, textes courants, navigation

---

## Architecture des fichiers

```
src/
├── components/
│   └── template.js       # Template HTML unique de l'application (SPA)
├── lib/
│   ├── alias.js          # Générateur d'alias depuis les genres TMDB
│   ├── store.js          # Store Alpine global (session, profil, routing, cache TTL, PWA)
│   ├── supabase.js       # Client Supabase avec lock auth désactivé (fix iOS)
│   └── tmdb.js           # Wrapper TMDB v4 : posterFor(), AbortController, double cache
├── views/
│   ├── auth.js           # Connexion / inscription
│   ├── classifier.js     # Modal universel d'ajout/classification de série
│   ├── feed.js           # Fil d'actualité (avec cache stale-while-revalidate)
│   ├── legal.js          # Pages légales (mentions, RGPD, bêta)
│   ├── library.js        # Bibliothèque personnelle (avec cache stale-while-revalidate)
│   ├── notifications.js  # Centre de notifications
│   ├── onboarding.js     # Création du profil + recherche debouncée
│   ├── profile.js        # Profil utilisateur (avec cache stale-while-revalidate)
│   ├── show.js           # Fiche série
│   ├── top3.js           # Publication Top 3 / Flop 3
│   └── trending.js       # Tendances communautaires
├── main.js               # Bootstrap Alpine + registerSW (toast PWA)
└── style.css             # Variables CSS, composants globaux

public/
├── icons/                # Icônes PWA (192, 512, apple-touch-icon)
├── favicon.svg           # Masque de théâtre aux couleurs Fabulae
└── og-image.png          # Image Open Graph 1200×630

supabase/
├── schema.sql                          # Schéma complet de la base de données
├── migration-v3.sql                    # Bibliothèque unifiée (library_items)
├── migration-v4.sql                    # Colonne library_public sur profiles
├── migration-v5.sql                    # RLS bibliothèque : accès followers
├── migration_notifications.sql         # Trigger follow + cleanup
└── migration_community_trending.sql    # Vue refaite depuis library_items
```

### Navigation principale

5 onglets en bas, ordre fixe :

| # | Onglet | Route | Icône Lucide |
|---|---|---|---|
| 1 | Bibliothèque | `#/library` | book-open |
| 2 | Fil | `#/feed` | layout-list |
| 3 | Ajouter | `#/discover` | plus-circle |
| 4 | Tendances | `#/trending` | trending-up |
| 5 | Profil | `#/profile` | user |

---

## Base de données

### Tables principales

| Table | Description |
|---|---|
| `profiles` | Profils utilisateurs (username, bio, avatar, library_public) |
| `library_items` | Bibliothèque personnelle (status, rating, recommendation) — source unique des Top/Flop |
| `follows` | Relations follower / following |
| `likes` | Likes sur les classements |
| `notifications` | Notifications (new_top, new_flop, follow) |
| `tmdb_cache` | Cache des appels TMDB (24h) |

### Vues

| Vue | Description |
|---|---|
| `community_trending` | Classement agrégé depuis `library_items` (recommended only, score pondéré par note) |
| `feed_recent_additions` | Activité récente pour le fil |
| `followed_recommendations` | Recommandations des abonnements |

### Triggers

| Trigger | Table | Événement |
|---|---|---|
| `trg_notify_recommendation_insert` | library_items | INSERT — notif new_top / new_flop aux abonnés |
| `trg_notify_recommendation_update` | library_items | UPDATE de `recommendation` — idem |
| `trg_notify_on_new_follow` | follows | INSERT — notif follow (anti-doublon 24h) |
| `trg_library_updated` | library_items | UPDATE — touch updated_at |
| `trg_watchlist_updated` | watchlist | UPDATE — touch updated_at |

### Sécurité (RLS)
Row Level Security activé sur toutes les tables. Chaque utilisateur ne peut lire/écrire que ses propres données, à l'exception :
- Des profils publics (visibles par tous)
- Des bibliothèques dont `library_public = true` (visibles par tous les utilisateurs connectés)
- Des Top/Flop publics calculés depuis les bibliothèques publiques

---

## Variables d'environnement

À configurer dans Vercel (Settings → Environment Variables) :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_TMDB_TOKEN=eyJ...   # Token Bearer v4 (pas la clé API v3)
```

---

## Installation locale

```bash
git clone https://github.com/shamsetdean/Fabulae.git
cd Fabulae
npm install

# Créer un fichier .env.local
cp .env.example .env.local
# Renseigner les 3 variables d'environnement

npm run dev
```

---

## Déploiement

Le projet se déploie automatiquement sur Vercel à chaque push sur la branche `main`.

```bash
git add .
git commit -m "feat: description"
git push
```

Vercel détecte Vite automatiquement. Aucune configuration supplémentaire requise.

Lors d'un nouveau déploiement, les utilisateurs voient un toast discret « L'appli a une nouvelle version, mettre à jour » au prochain focus de leur onglet, sans interruption de session.

---

## Statut du projet

![Statut](https://img.shields.io/badge/Bêta_privée-Saison_1-7a1f2e?style=flat-square&logo=lock&logoColor=white)

Projet personnel en phase de test. Le lien n'est pas destiné à être partagé publiquement pour le moment.

---

## Roadmap

- [x] Suppression de compte + export RGPD
- [x] Système de signalement (LCEN)
- [x] Notifications follow
- [x] Cache stale-while-revalidate
- [x] PWA avec mise à jour contrôlée par l'utilisateur
- [ ] Recherche d'utilisateurs
- [ ] Partage de Top 3 par lien avec image OG dynamique
- [ ] Statistiques avancées (épisodes vus, temps total)
- [ ] Suggestions de comptes à suivre
- [ ] Commentaires sur les classements
- [ ] Confirmation email (avant ouverture publique)
- [ ] Empty states illustrés
- [ ] Optimistic UI sur les actions courantes

---

## Copyright et Mentions Légales

© 2026 Fabulae. Tous droits réservés.

Fabulae est une application propriétaire. L'intégralité du code source, de l'interface utilisateur, du design, de l'architecture, des fonctionnalités, de la documentation ainsi que l'ensemble des éléments graphiques et textuels sont protégés par le Code de la propriété intellectuelle, les conventions internationales et les lois applicables.

> ![Note](https://img.shields.io/badge/Note-Work_in_progress-9aa0ae?style=flat-square&logo=alert-triangle&logoColor=white) Ce projet est un projet personnel en cours d'élaboration *(work in progress)* et peut être amené à évoluer sans préavis.

### Propriété Intellectuelle

Toute reproduction, représentation, diffusion, adaptation, modification, traduction, commercialisation ou exploitation, totale ou partielle, du projet, de son code source ou de l'un de ses composants, sans autorisation écrite préalable de l'auteur, est strictement interdite.

Toute violation de ces droits pourra entraîner des poursuites civiles et pénales conformément aux dispositions du Code de la propriété intellectuelle.

### Licence d'Utilisation

Ce dépôt GitHub est publié uniquement à des fins de présentation, d'évaluation ou de démonstration technique.

Aucune licence open source n'est accordée. Aucun droit d'utilisation, de copie, de modification, de distribution ou d'exploitation commerciale n'est concédé sans autorisation expresse et écrite de l'auteur.

### Marques et Contenus Tiers

Les noms, logos, affiches, images, marques, séries télévisées, films et autres contenus référencés dans l'application demeurent la propriété exclusive de leurs détenteurs respectifs.

Leur utilisation dans Fabulae s'inscrit exclusivement dans un cadre informatif, éditorial et non commercial.

### Limitation de Responsabilité

Le logiciel est fourni « en l'état », sans garantie expresse ou implicite.

L'auteur ne saurait être tenu responsable de tout dommage direct, indirect, accessoire ou consécutif résultant de l'utilisation ou de l'impossibilité d'utiliser ce projet.

### Signalement d'Abus

Toute utilisation non autorisée, reproduction ou distribution du présent projet pourra faire l'objet d'une demande de retrait immédiat, d'un signalement auprès de GitHub et, le cas échéant, de poursuites judiciaires.

### Contact

Pour toute demande d'autorisation, de partenariat ou toute question juridique :

**Email :** [shamsetdean@gmail.com](mailto:shamsetdean@gmail.com)

---

*Fabulae™ est une marque et une application propriétaire. Toute utilisation non autorisée est strictement interdite.*
