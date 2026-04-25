# Fabulae

**L'art de ne jamais perdre le fil.**

Réseau social minimaliste autour des séries TV. Chaque utilisateur publie son **Top 3** et son **Flop 3** du moment, suit d'autres membres, découvre les tendances et gère sa bibliothèque personnelle.

🔗 [fabulae.vercel.app](https://fabulae.vercel.app)

---

## Fonctionnalités

### Social
- **Top 3 / Flop 3** — Publication de ses classements du moment avec un alias généré dynamiquement depuis les genres
- **Fil d'actualité** — Cartes regroupées (Top + Flop d'un même utilisateur dans une seule carte), filtrables par abonnements
- **Likes** — Like indépendant sur le Top et le Flop
- **Profils publics** — Avatar, alias, classements actuels, analyse des habitudes, bibliothèque
- **Abonnements** — Suivre / ne plus suivre un utilisateur
- **Notifications** — Alertes en temps réel pour nouveaux classements des comptes suivis

### Bibliothèque personnelle
- **Ajout de séries** via recherche TMDB inline (debounce 300ms, zéro latence)
- **Statuts** : À voir · En cours · Terminée · Abandonnée
- **Notes** : 1 à 5 étoiles
- **Recommandation** : Je recommande / Je ne recommande pas
- **Visibilité** : Publique (accessible aux followers) ou Privée
- **Filtres** par statut, recherche textuelle, compteurs

### Tendances
- Classement des séries les plus populaires parmi tous les utilisateurs
- Watch providers disponibles en France

### Analyse du profil
- Camembert SVG des genres préférés (calculé côté client, 0 appel API supplémentaire)
- Liste des genres jamais explorés
- Visibilité paramétrable (Public / Privé)

### PWA
- Installable sur iPhone et Android
- Service Worker avec mise à jour automatique
- Mode standalone (sans barre de navigation du navigateur)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | [Alpine.js](https://alpinejs.dev) v3 + HTML/CSS |
| Style | [Tailwind CSS](https://tailwindcss.com) v3 |
| Build | [Vite](https://vitejs.dev) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app) |
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
│   ├── store.js          # Store Alpine global (session, profil, routing, guards)
│   ├── supabase.js       # Client Supabase avec lock auth désactivé (fix iOS)
│   └── tmdb.js           # Wrapper TMDB API v4 avec cache localStorage
├── views/
│   ├── auth.js           # Connexion / inscription
│   ├── classifier.js     # Modal universel d'ajout/classification de série
│   ├── feed.js           # Fil d'actualité (Top + Flop regroupés par utilisateur)
│   ├── legal.js          # Pages légales (mentions, RGPD, bêta)
│   ├── library.js        # Bibliothèque personnelle + recherche TMDB inline
│   ├── notifications.js  # Centre de notifications
│   ├── onboarding.js     # Création du profil (pseudo, bio)
│   ├── profile.js        # Profil utilisateur + bibliothèque publique + analyse genres
│   ├── show.js           # Fiche série
│   ├── top3.js           # Publication Top 3 / Flop 3
│   └── trending.js       # Tendances communautaires
├── main.js               # Bootstrap Alpine (injection template, initTree, store)
└── style.css             # Variables CSS, composants globaux

public/
├── icons/                # Icônes PWA (192, 512, apple-touch-icon)
├── favicon.svg           # Masque de théâtre aux couleurs Fabulae
└── og-image.png          # Image Open Graph 1200×630

supabase/
├── schema.sql            # Schéma complet de la base de données
├── migration-v3.sql      # Bibliothèque unifiée (library_items)
├── migration-v4.sql      # Colonne library_public sur profiles
└── migration-v5.sql      # RLS bibliothèque : accès followers
```

---

## Base de données

### Tables principales

| Table | Description |
|---|---|
| `profiles` | Profils utilisateurs (username, bio, avatar, library_public) |
| `top_lists` | Classements Top 3 / Flop 3 (kind: top/flop, is_current) |
| `library_items` | Bibliothèque personnelle (status, rating, recommendation) |
| `follows` | Relations follower / following |
| `likes` | Likes sur les classements |
| `notifications` | Notifications (new_list) |

### Vues

| Vue | Description |
|---|---|
| `top_lists_with_profile` | Classements enrichis avec données du profil |
| `community_trending` | Tendances agrégées par série |
| `followed_recommendations` | Recommandations des abonnements |

### Sécurité (RLS)
Row Level Security activé sur toutes les tables. Chaque utilisateur ne peut lire/écrire que ses propres données, à l'exception :
- Des profils publics (visibles par tous)
- Des classements publics (visibles par tous)
- Des bibliothèques dont `library_public = true` (visibles par tous les utilisateurs connectés)

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

---

## Statut du projet

🔒 **Bêta privée — Saison 1**

Projet personnel en phase de test. Le lien n'est pas destiné à être partagé publiquement pour le moment.

---

## Roadmap

- [ ] Suppression de compte + export RGPD
- [ ] Système de signalement (LCEN)
- [ ] Recherche d'utilisateurs
- [ ] Partage de Top 3 par lien avec image OG dynamique
- [ ] Statistiques avancées (épisodes vus, temps total)
- [ ] Suggestions de comptes à suivre
- [ ] Commentaires sur les classements
- [ ] Confirmation email (avant ouverture publique)

---

## 📜 Copyright et Mentions Légales

© 2026 Fabulae. Tous droits réservés.

Fabulae est une application propriétaire. L'intégralité du code source, de l'interface utilisateur, du design, de l'architecture, des fonctionnalités, de la documentation ainsi que l'ensemble des éléments graphiques et textuels sont protégés par le Code de la propriété intellectuelle, les conventions internationales et les lois applicables.

> ⚠️ Ce projet est un projet personnel en cours d'élaboration *(work in progress)* et peut être amené à évoluer sans préavis.

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
