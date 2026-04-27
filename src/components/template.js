export const appTemplate = `
<div x-show="!$store.app.authReady" class="min-h-dvh flex items-center justify-center">
  <div class="text-cream-300/40 text-sm font-mono">chargement...</div>
</div>

<div x-show="$store.app.authReady">

  <!-- ============== AUTH ============== -->
  <template x-if="$store.app.route.name === 'auth'">
    <section x-data="authView()" class="min-h-dvh flex flex-col justify-center px-6 py-10 relative z-10">
      <!-- Badge bêta en haut à gauche -->
      <div class="absolute top-4 left-4">
        <span class="flex items-center gap-1.5 text-[10px] text-cream-300/60 bg-ink-800/80 px-2.5 py-1 rounded-full border border-ink-700/50">
          <svg width="5" height="5" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3"/></svg>
          Bêta privée · phase de test
        </span>
      </div>

      <div class="max-w-sm mx-auto w-full animate-slide-up">
        <div class="mb-8 text-center">
          <div class="flex items-center justify-center gap-2 text-flame-500 text-xs tracking-[0.3em] uppercase mb-4">
            <span class="w-8 h-px bg-flame-500"></span>Saison 1<span class="w-8 h-px bg-flame-500"></span>
          </div>
          <h1 class="text-5xl display text-cream-50 italic">Fabulae</h1>
          <p class="mt-2 text-[11px] tracking-[0.18em] uppercase text-cream-300/60 italic">L'art de ne jamais perdre le fil</p>
        </div>

        <div class="card p-6 space-y-4">
          <div class="flex gap-2">
            <button @click="mode = 'signin'" :class="mode === 'signin' ? 'bg-emerald-600 text-cream-50' : 'text-cream-200'" class="flex-1 py-2.5 rounded-full text-sm font-medium transition-colors">Connexion</button>
            <button @click="mode = 'signup'" :class="mode === 'signup' ? 'bg-emerald-600 text-cream-50' : 'text-cream-200'" class="flex-1 py-2.5 rounded-full text-sm font-medium transition-colors">Créer un compte</button>
          </div>

          <form @submit.prevent="submit" class="space-y-3">
            <div>
              <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" x-model="email" autocomplete="email" required class="input" placeholder="toi@exemple.fr" />
            </div>
            <div>
              <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Mot de passe</label>
              <input type="password" x-model="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" required minlength="8" class="input" placeholder="••••••••" />
              <p x-show="mode === 'signup'" class="text-[11px] text-cream-300/50 mt-1">8 caractères minimum</p>
            </div>

            <template x-if="mode === 'signup'">
              <label class="flex items-start gap-2 text-xs text-cream-300 pt-1">
                <input type="checkbox" x-model="acceptTerms" class="mt-0.5" />
                <span>J'accepte les <a href="#/legal/mentions" class="text-flame-500 underline">mentions</a> et la <a href="#/legal/privacy" class="text-flame-500 underline">politique de confidentialité</a>, et je confirme avoir au moins 16 ans.</span>
              </label>
            </template>

            <template x-if="error">
              <div class="text-sm text-flame-400 bg-flame-600/10 border border-flame-600/30 rounded-lg px-3 py-2" x-text="error"></div>
            </template>

            <button type="submit" :disabled="loading" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-cream-50 font-semibold transition-colors disabled:opacity-50">
              <span x-show="!loading" x-text="mode === 'signup' ? 'Créer mon compte' : 'Entrer'"></span>
              <span x-show="loading">…</span>
            </button>
          </form>
        </div>

        <p class="text-[11px] text-center text-cream-300/40 mt-6 px-4">
          Projet en cours d'élaboration. Merci de ne pas partager ni redistribuer ce lien.
        </p>
      </div>
    </section>
  </template>

  <!-- ============== ONBOARDING ============== -->
  <template x-if="$store.app.route.name === 'onboarding'">
    <section x-data="onboardingView()" x-init="init()" class="min-h-dvh flex flex-col px-5 py-8 relative z-10">
      <div class="max-w-sm mx-auto w-full animate-slide-up flex flex-col min-h-dvh">

        <!-- Barre de progression -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-cream-300/60" x-text="'Étape ' + step + ' sur ' + totalSteps"></span>
            <span class="text-xs text-flame-500 font-medium" x-text="progressPercent + '%'"></span>
          </div>
          <div class="h-1 bg-ink-800 rounded-full overflow-hidden">
            <div class="h-full bg-flame-500 rounded-full transition-all duration-500" :style="'width: ' + progressPercent + '%'"></div>
          </div>
        </div>

        <!-- ── ÉTAPE 1 : Profil ── -->
        <template x-if="step === 1">
          <div class="flex-1 flex flex-col">
            <h1 class="text-4xl display italic mb-2 text-cream-50">Choisis ton pseudo.</h1>
            <p class="text-cream-300 text-sm mb-6">C'est ce que les autres verront sur tes classements.</p>

            <div class="card p-5 space-y-4 mb-4">
              <div>
                <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Pseudo</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-cream-300/50 text-sm">@</span>
                  <input x-model="username" maxlength="20" class="input pl-8 text-sm" placeholder="seriesfan" @input="username = username.toLowerCase().replace(/[^a-z0-9_]/g, '')" />
                </div>
                <p class="text-[11px] text-cream-300/40 mt-1">3 à 20 caractères, lettres minuscules, chiffres, _</p>
              </div>
              <div>
                <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Bio <span class="normal-case text-cream-300/40">(optionnel)</span></label>
                <textarea x-model="bio" maxlength="140" rows="2" class="input resize-none text-sm" placeholder="Amateur de thrillers scandinaves…"></textarea>
              </div>
              <template x-if="error">
                <div class="text-sm text-flame-400 bg-flame-600/10 border border-flame-600/30 rounded-lg px-3 py-2" x-text="error"></div>
              </template>
            </div>

            <button @click="saveProfile" :disabled="saving || !canProceedStep1" class="btn-primary w-full mt-auto">
              <span x-show="!saving">Continuer →</span>
              <span x-show="saving">…</span>
            </button>
          </div>
        </template>

        <!-- ── ÉTAPE 2 : Chercher des séries ── -->
        <template x-if="step === 2">
          <div class="flex-1 flex flex-col">
            <div class="mb-1 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <h2 class="text-2xl display italic text-cream-50">Ajoute des séries</h2>
            </div>
            <p class="text-cream-300 text-sm mb-5">Commence à construire ta bibliothèque.</p>

            <div class="relative mb-3">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-cream-300/50" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="search" x-model="searchQuery" @input="onSearchInput" class="input pl-9 text-sm" placeholder="Cherche une série…" autocomplete="off" />
            </div>

            <template x-if="searching">
              <p class="text-xs text-cream-300/50 text-center py-3">Recherche…</p>
            </template>

            <div class="space-y-1.5 flex-1 overflow-y-auto mb-4">
              <template x-for="show in searchResults" :key="show.id">
                <div class="card p-2.5 flex items-center gap-3">
                  <template x-if="show.poster">
                    <img :src="show.poster" :alt="show.name" class="w-9 h-12 rounded object-cover flex-shrink-0" loading="lazy" />
                  </template>
                  <template x-if="!show.poster">
                    <div class="w-9 h-12 rounded bg-ink-800 flex-shrink-0"></div>
                  </template>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-cream-100 truncate" x-text="show.name"></p>
                    <p class="text-[11px] text-cream-300/50" x-text="show.year"></p>
                  </div>
                  <button @click="addShow(show)" :disabled="isAdded(show.id) || addingId === show.id" class="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-lg transition-colors" :class="isAdded(show.id) ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-flame-600 text-cream-50 hover:bg-flame-500'">
                    <span x-text="isAdded(show.id) ? '✓ Ajoutée' : (addingId === show.id ? '…' : '+ Ajouter')"></span>
                  </button>
                </div>
              </template>
            </div>

            <template x-if="addedShows.length > 0">
              <p class="text-xs text-cream-300/60 text-center mb-3" x-text="addedShows.length + ' série(s) ajoutée(s)'"></p>
            </template>

            <div class="flex gap-3 mt-auto">
              <button @click="proceedStep2" class="flex-1 py-3 rounded-xl bg-ink-700 text-cream-200 text-sm hover:bg-ink-600 transition-colors">
                Passer
              </button>
              <button @click="proceedStep2" class="flex-2 btn-primary px-6">
                Continuer →
              </button>
            </div>
          </div>
        </template>

        <!-- ── ÉTAPE 3 : Suivre des utilisateurs ── -->
        <template x-if="step === 3">
          <div class="flex-1 flex flex-col">
            <div class="mb-1 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <h2 class="text-2xl display italic text-cream-50">Suis des membres</h2>
            </div>
            <p class="text-cream-300 text-sm mb-5">Découvre les classements de la communauté.</p>

            <template x-if="loadingUsers">
              <div class="space-y-2"><template x-for="i in 4" :key="i"><div class="skeleton h-14 rounded-xl"></div></template></div>
            </template>

            <div class="space-y-2 flex-1 overflow-y-auto mb-4">
              <template x-for="user in suggestedUsers" :key="user.id">
                <div class="card p-3 flex items-center gap-3">
                  <template x-if="user.avatar_url">
                    <img :src="user.avatar_url" :alt="user.username" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  </template>
                  <template x-if="!user.avatar_url">
                    <div class="w-10 h-10 rounded-full bg-ink-700 flex items-center justify-center text-sm font-mono text-cream-200 flex-shrink-0" x-text="user.username?.charAt(0).toUpperCase()"></div>
                  </template>
                  <p class="text-sm font-medium text-cream-100 flex-1 truncate" x-text="'@' + user.username"></p>
                  <button @click="toggleFollowUser(user.id)" :disabled="followingId === user.id" class="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-lg transition-colors" :class="isFollowed(user.id) ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-flame-600 text-cream-50 hover:bg-flame-500'">
                    <span x-text="isFollowed(user.id) ? '✓ Suivi' : (followingId === user.id ? '…' : 'Suivre')"></span>
                  </button>
                </div>
              </template>
            </div>

            <template x-if="followedIds.size > 0">
              <p class="text-xs text-cream-300/60 text-center mb-3" x-text="followedIds.size + ' membre(s) suivi(s)'"></p>
            </template>

            <div class="flex gap-3 mt-auto">
              <button @click="proceedStep3" class="flex-1 py-3 rounded-xl bg-ink-700 text-cream-200 text-sm hover:bg-ink-600 transition-colors">Passer</button>
              <button @click="proceedStep3" class="flex-2 btn-primary px-6">Continuer →</button>
            </div>
          </div>
        </template>

        <!-- ── ÉTAPE 4 : Publier son Top 3 ── -->
        <template x-if="step === 4">
          <div class="flex-1 flex flex-col items-center justify-center text-center">
            <div class="w-20 h-20 rounded-full bg-flame-600/20 flex items-center justify-center mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            </div>
            <h2 class="text-3xl display italic text-cream-50 mb-3">Tout est prêt !</h2>
            <p class="text-cream-300 text-sm mb-8 max-w-xs">Tu fais partie de la communauté Fabulae. Publie ton premier Top 3 et montre tes goûts.</p>

            <div class="w-full space-y-3">
              <button @click="finish(true)" class="btn-primary w-full text-sm py-3">
                Publier mon Top 3 maintenant
              </button>
              <button @click="finish(false)" class="w-full py-3 rounded-xl bg-ink-700 text-cream-200 text-sm hover:bg-ink-600 transition-colors">
                Explorer l'application d'abord
              </button>
            </div>
          </div>
        </template>

      </div>
    </section>
  </template>

  <!-- ============== LEGAL ============== -->
  <template x-if="$store.app.route.name === 'legal'">
    <section x-data="legalView()" x-init="init()" class="px-5 pt-5 safe-top pb-20 animate-fade-in max-w-xl mx-auto">
      <a href="javascript:history.back()" class="inline-flex items-center gap-1 text-sm text-cream-300 mb-4 hover:text-cream-100">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Retour
      </a>

      <h1 class="text-3xl display italic mb-2">Infos légales</h1>
      <p class="text-xs text-cream-300/60 mb-6">Projet personnel en phase de test · Bêta privée</p>

      <div class="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        <button @click="tab = 'beta'" :class="tab === 'beta' ? 'bg-flame-600 text-cream-50' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Phase de test</button>
        <button @click="tab = 'mentions'" :class="tab === 'mentions' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Mentions légales</button>
        <button @click="tab = 'privacy'" :class="tab === 'privacy' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Confidentialité</button>
      </div>

      <div x-show="tab === 'beta'" class="prose-legal">
        <h2>Projet en cours d'élaboration</h2>
        <p><strong>Fabulae</strong> est un projet personnel actuellement en <strong>phase de test privée</strong>.</p>
        <p><strong>Diffusion restreinte.</strong> Merci de <strong>ne pas partager ni redistribuer ce lien</strong> publiquement.</p>
        <p><strong>Données.</strong> Les données peuvent être réinitialisées sans préavis pendant cette phase.</p>
        <p><strong>Feedback.</strong> Bug ou suggestion : <a href="mailto:shamsetdean@gmail.com">shamsetdean@gmail.com</a>.</p>
      </div>

      <div x-show="tab === 'mentions'" class="prose-legal">
        <h2>Mentions légales</h2>
        <p><strong>Éditeur</strong> : projet personnel non commercial, édité par un particulier.</p>
        <p><strong>Contact</strong> : <a href="mailto:shamsetdean@gmail.com">shamsetdean@gmail.com</a></p>
        <p><strong>Hébergement</strong> : Vercel Inc. et Supabase Inc. (UE).</p>
        <h2>Propriété intellectuelle</h2>
        <p>Métadonnées issues de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. <em>This product uses the TMDB API but is not endorsed or certified by TMDB.</em></p>
        <p>Disponibilités streaming via JustWatch.</p>
        <h2>Responsabilité</h2>
        <p>Service fourni « en l'état » durant la phase de test.</p>
      </div>

      <div x-show="tab === 'privacy'" class="prose-legal">
        <h2>Politique de confidentialité (simplifiée)</h2>
        <h2>Données collectées</h2>
        <ul>
          <li><strong>Email</strong> : création du compte</li>
          <li><strong>Mot de passe</strong> : haché, jamais lu en clair</li>
          <li><strong>Pseudo et bio</strong> : publics</li>
          <li><strong>Contenus publiés</strong> : Top 3, Flop 3, bibliothèque, likes, abonnements</li>
          <li><strong>Adresse IP</strong> : Supabase, sécurité (logs 30 jours)</li>
        </ul>
        <h2>Finalités</h2>
        <p><strong>Aucune donnée vendue ni utilisée pour la publicité.</strong> Aucun tracker tiers.</p>
        <h2>Tes droits (RGPD)</h2>
        <ul>
          <li>Accès, rectification, suppression</li>
          <li>Portabilité (copie de tes données)</li>
        </ul>
        <p>Contact : <a href="mailto:shamsetdean@gmail.com">shamsetdean@gmail.com</a></p>
        <h2>Sous-traitants</h2>
        <ul>
          <li><strong>Supabase</strong> (UE) : base de données et auth</li>
          <li><strong>Vercel</strong> : hébergement</li>
          <li><strong>TMDB</strong> : métadonnées (aucune donnée perso transmise)</li>
        </ul>
      </div>
    </section>
  </template>

  <!-- ============== AUTHENTIFIÉ ============== -->
  <template x-if="$store.app.isAuthed && !['auth','onboarding','legal'].includes($store.app.route.name)">
    <div>
      <!-- HEADER GLOBAL avec cloche notifications -->
      <header class="header-glass sticky top-0 z-20 safe-top px-4 pb-3 flex items-center justify-between">
        <a href="#/feed" class="display italic text-xl text-cream-50 leading-none">Fabulae</a>
        <a href="#/notifications" class="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-cream-50/5 transition-colors" :class="$store.app.route.name === 'notifications' ? 'text-flame-500' : 'text-cream-200'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span x-show="$store.app.unreadCount > 0" class="notif-dot"></span>
        </a>
      </header>

      <main class="relative z-10 safe-bottom">

        <!-- ============== LIBRARY ============== -->
        <template x-if="$store.app.route.name === 'library'">
          <section x-data="libraryView()" x-init="init()" class="px-4 pt-4 pb-6 animate-fade-in">
            <header class="mb-4">
              <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">Mon univers</p>
              <h1 class="text-3xl display italic text-cream-50 leading-none">Bibliothèque</h1>
            </header>

            <div class="mb-4">
              <input type="search" x-model="search" class="input text-sm" placeholder="Rechercher dans ma bibliothèque..." />
            </div>

            <!-- Filtres horizontaux scrollables -->
            <div class="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4">
              <button @click=\"filter = 'all'\" :class="filter === 'all' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                Tout (<span x-text="counts.all"></span>)
              </button>
              <button @click=\"filter = 'watching'\" :class="filter === 'watching' ? 'bg-flame-600 text-cream-50' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                En cours (<span x-text="counts.watching"></span>)
              </button>
              <button @click=\"filter = 'finished'\" :class="filter === 'finished' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                Terminées (<span x-text="counts.finished"></span>)
              </button>
              <button @click=\"filter = 'recommended'\" :class="filter === 'recommended' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                Recommandées (<span x-text="counts.recommended"></span>)
              </button>
              <button @click=\"filter = 'not_recommended'\" :class="filter === 'not_recommended' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                Flop (<span x-text="counts.not_recommended"></span>)
              </button>
              <button @click=\"filter = 'abandoned'\" :class="filter === 'abandoned' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                Abandonnées (<span x-text="counts.abandoned"></span>)
              </button>
              <button @click=\"filter = 'wishlist'\" :class="filter === 'wishlist' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">
                À voir (<span x-text="counts.wishlist"></span>)
              </button>
            </div>

            <template x-if="loading">
              <div class="space-y-2">
                <template x-for="i in 4" :key="i"><div class="skeleton h-16"></div></template>
              </div>
            </template>

            <template x-if="!loading && filtered.length === 0">
              <div class="text-center py-16 text-cream-300/60">
                <svg class="mx-auto mb-3 opacity-40" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16v16H4zM4 9h16M9 4v16"/>
                </svg>
                <p class="text-sm">Rien dans cette catégorie.</p>
                <p class="text-xs mt-2">Cherche une série pour l'ajouter.</p>
              </div>
            </template>

            <ul class="space-y-2">
              <template x-for="item in filtered" :key="item.id">
                <li class="card p-2.5 flex gap-2.5">
                  <a :href="'#/show/' + item.show.id" class="flex-shrink-0">
                    <img :src="item.show.poster" :alt="item.show.name" loading="lazy" class="w-12 h-18 rounded-md bg-ink-800 object-cover" />
                  </a>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <a :href="'#/show/' + item.show.id" class="block min-w-0">
                        <p class="font-medium text-cream-50 text-sm leading-tight truncate" x-text="item.show.name"></p>
                        <p class="text-[11px] text-cream-300/50 mt-0.5" x-text="item.show.year"></p>
                      </a>
                      <button @click="window.openClassifier(item.tmdb_id)" class="btn-ghost text-[11px] px-2 py-1 flex-shrink-0">Modifier</button>
                    </div>

                    <!-- Status badges -->
                    <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <template x-if="item.status === 'watching'">
                        <span class="pill pill-active" x-text="'S' + (item.current_season || '?') + ' E' + (item.current_episode || '?')"></span>
                      </template>
                      <template x-if="item.status === 'finished'">
                        <span class="pill">Terminée</span>
                      </template>
                      <template x-if="item.status === 'abandoned'">
                        <span class="pill">Abandonnée</span>
                      </template>
                      <template x-if="item.status === 'wishlist'">
                        <span class="pill">À voir</span>
                      </template>

                      <template x-if="item.rating">
                        <span class="pill" :title="item.rating + '/5'">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#E9B44C"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span x-text="item.rating"></span>
                        </span>
                      </template>

                      <template x-if="item.recommendation === 'recommended'">
                        <span class="pill text-flame-500 border-flame-500/30">Recommandée</span>
                      </template>
                      <template x-if="item.recommendation === 'not_recommended'">
                        <span class="pill">Flop</span>
                      </template>
                    </div>

                    <!-- Provider + bouton +1 épisode pour watching -->
                    <template x-if="item.status === 'watching'">
                      <div class="flex items-center gap-2 mt-2">
                        <template x-if="item.provider_name && item.provider_logo_path">
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ink-800">
                            <img :src="providerLogoUrl(item.provider_logo_path)" class="w-3.5 h-3.5 rounded" />
                            <span class="text-[10px] text-cream-200" x-text="item.provider_name"></span>
                          </span>
                        </template>
                        <button @click="incrementEpisode(item)" class="text-[11px] text-flame-500 ml-auto">+1 ép.</button>
                      </div>
                    </template>
                  </div>
                </li>
              </template>
            </ul>
          </section>
        </template>

        <!-- ============== FEED ============== -->
        <template x-if="$store.app.route.name === 'feed'">
          <section x-data="feedView()" x-init="init()" class="px-4 pt-4 pb-6 animate-fade-in">
            <header class="mb-4">
              <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">À l'affiche</p>
              <h1 class="text-3xl display italic text-cream-50 leading-none">Le fil</h1>
              <p class="text-xs text-cream-300/60 mt-2">Les ajouts récents de la communauté.</p>
            </header>

            <!-- Filtres -->
            <div class="flex gap-2 mb-4 overflow-x-auto -mx-1 px-1">
              <button @click="filter = 'all'" :class="filter === 'all' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-300/70'" class="text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">Tout</button>
              <button @click="filter = 'recommended'" :class="filter === 'recommended' ? 'bg-green-600 text-cream-50' : 'bg-ink-800 text-cream-300/70'" class="text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">Recommandées</button>
              <button @click="filter = 'not_recommended'" :class="filter === 'not_recommended' ? 'bg-red-600 text-cream-50' : 'bg-ink-800 text-cream-300/70'" class="text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0">Déconseillées</button>
            </div>

            <!-- Loading -->
            <template x-if="loading">
              <div class="space-y-3">
                <template x-for="i in 4" :key="i">
                  <div class="skeleton h-24 rounded-xl"></div>
                </template>
              </div>
            </template>

            <!-- Empty -->
            <template x-if="!loading && filtered.length === 0">
              <div class="text-center py-16">
                <p class="text-sm text-cream-300/50">Aucune activité récente dans ton fil.</p>
                <p class="text-xs text-cream-300/40 mt-2">Suis des membres ou ajoute des séries pour voir des recommandations.</p>
              </div>
            </template>

            <!-- Liste des entrées -->
            <div class="space-y-3">
              <template x-for="entry in filtered" :key="entry.id">
                <div class="card p-3 flex gap-3 items-center">
                  <a :href="'#/show/' + entry.tmdb_id" class="flex-shrink-0">
                    <template x-if="entry.show?.poster">
                      <img :src="entry.show.poster" :alt="entry.show.name" class="w-14 h-20 rounded-lg object-cover" loading="lazy" />
                    </template>
                    <template x-if="!entry.show?.poster">
                      <div class="w-14 h-20 rounded-lg bg-ink-800"></div>
                    </template>
                  </a>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <a :href="'#/u/' + entry.username" class="flex items-center gap-1.5 group">
                        <template x-if="entry.avatar_url">
                          <img :src="entry.avatar_url" :alt="entry.username" class="w-5 h-5 rounded-full object-cover" />
                        </template>
                        <template x-if="!entry.avatar_url">
                          <div class="w-5 h-5 rounded-full bg-ink-700 flex items-center justify-center text-[9px] font-mono text-cream-200" x-text="entry.username?.charAt(0).toUpperCase()"></div>
                        </template>
                        <span class="text-xs text-cream-200 group-hover:text-flame-400 transition-colors" x-text="'@' + entry.username"></span>
                      </a>
                      <span class="text-[10px] text-cream-300/40" x-text="formatRelativeDate(entry.created_at)"></span>
                    </div>
                    <a :href="'#/show/' + entry.tmdb_id" class="block">
                      <p class="text-sm font-medium text-cream-50 line-clamp-1 hover:text-flame-400 transition-colors" x-text="entry.show?.name"></p>
                    </a>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      <template x-if="entry.recommendation === 'recommended'">
                        <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-600/30">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7V10l4.34-9.06a1.93 1.93 0 0 1 3.49 1.85Z"/></svg>
                          Je recommande
                        </span>
                      </template>
                      <template x-if="entry.recommendation === 'not_recommended'">
                        <span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-600/30">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17v12l-4.34 9.06a1.93 1.93 0 0 1-3.49-1.85Z"/></svg>
                          Je déconseille
                        </span>
                      </template>
                      <template x-if="entry.rating">
                        <span class="text-[10px] text-flame-500">
                          <template x-for="s in entry.rating" :key="s">★</template>
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </section>
        </template>

        <!-- ============== TRENDING ============== -->
        <template x-if="$store.app.route.name === 'trending'">
          <section x-data="trendingView()" x-init="init()" class="px-4 pt-4 pb-6 animate-fade-in">
            <header class="mb-5">
              <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">Classement</p>
              <h1 class="text-3xl display italic">Tendances</h1>
            </header>

            <div class="flex gap-4 mb-5 border-b border-ink-700">
              <button @click="tab = 'community'" :class="tab === 'community' ? 'text-cream-50 border-flame-500' : 'text-cream-300/60 border-transparent'" class="pb-3 px-1 border-b-2 text-sm font-medium">Chez les membres</button>
              <button @click="tab = 'tmdb'" :class="tab === 'tmdb' ? 'text-cream-50 border-flame-500' : 'text-cream-300/60 border-transparent'" class="pb-3 px-1 border-b-2 text-sm font-medium">Mondial</button>
            </div>

            <template x-if="loading">
              <div class="space-y-3">
                <template x-for="i in 5" :key="i"><div class="skeleton h-16"></div></template>
              </div>
            </template>

            <div x-show="!loading && tab === 'community'">
              <template x-if="communityRanking.length === 0">
                <p class="text-center text-cream-300/50 text-sm py-10">Pas encore assez de Top 3 publiés.</p>
              </template>
              <ol class="space-y-2">
                <template x-for="(show, idx) in communityRanking" :key="show.id">
                  <li>
                    <a :href="'#/show/' + show.id" class="card p-2.5 flex items-center gap-2.5">
                      <span class="rank-number w-8 text-right flex-shrink-0" :class="idx < 3 ? 'rank-number-filled' : ''" x-text="idx + 1"></span>
                      <img :src="show.poster" :alt="show.name" class="w-10 h-14 rounded-md bg-ink-800 object-cover flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-cream-50 text-sm truncate" x-text="show.name"></p>
                        <p class="text-[11px] text-cream-300/50" x-text="show.year"></p>
                        <p class="text-[11px] text-flame-500" x-text="show.mentions + ' mention(s)'"></p>
                      </div>
                    </a>
                  </li>
                </template>
              </ol>
            </div>

            <div x-show="!loading && tab === 'tmdb'">
              <ol class="space-y-2">
                <template x-for="(show, idx) in tmdbTrending" :key="show.id">
                  <li>
                    <a :href="'#/show/' + show.id" class="card p-2.5 flex items-center gap-2.5">
                      <span class="rank-number w-8 text-right flex-shrink-0" :class="idx < 3 ? 'rank-number-filled' : ''" x-text="idx + 1"></span>
                      <img :src="show.poster" :alt="show.name" class="w-10 h-14 rounded-md bg-ink-800 object-cover flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-cream-50 text-sm truncate" x-text="show.name"></p>
                        <p class="text-[11px] text-cream-300/50" x-text="show.year"></p>
                        <p class="text-[11px] text-gold-500">
                          <svg class="inline" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <span x-text="show.vote?.toFixed(1)"></span>
                        </p>
                      </div>
                    </a>
                  </li>
                </template>
              </ol>
            </div>
          </section>
        </template>

        <!-- ============== NOTIFICATIONS ============== -->
        <template x-if="$store.app.route.name === 'notifications'">
          <section x-data="notificationsView()" x-init="init()" class="px-4 pt-4 pb-6 animate-fade-in">
            <header class="mb-5">
              <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">Activité</p>
              <h1 class="text-3xl display italic">Notifications</h1>
            </header>

            <template x-if="loading">
              <div class="space-y-2">
                <template x-for="i in 3" :key="i"><div class="skeleton h-16"></div></template>
              </div>
            </template>

            <template x-if="!loading && items.length === 0">
              <p class="text-center text-cream-300/50 text-sm py-10">Aucune notification.</p>
            </template>

            <ul class="space-y-2">
              <template x-for="n in items" :key="n.id">
                <li>
                  <a :href="href(n)" class="card p-3 flex items-start gap-3" :class="!n.read ? 'border-flame-500/30' : ''">
                    <div class="w-9 h-9 rounded-full bg-ink-700 flex items-center justify-center text-cream-200 text-xs font-mono flex-shrink-0">
                      <span x-text="n.actor?.username?.charAt(0).toUpperCase() ?? '?'"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-cream-100" x-text="label(n)"></p>
                      <p class="text-[11px] text-cream-300/50 mt-0.5" x-text="formatDate(n.created_at)"></p>
                    </div>
                  </a>
                </li>
              </template>
            </ul>
          </section>
        </template>

        <!-- ============== PROFIL ============== -->
        <template x-if="$store.app.route.name === 'profile' || $store.app.route.name === 'u'">
          <section x-data="profileView()" x-init="init()" class="pb-4 animate-fade-in">

            <!-- Loading / Error -->
            <template x-if="loading"><div class="text-center text-cream-300/50 py-20">Chargement…</div></template>
            <template x-if="error"><div class="text-center text-flame-400 py-20" x-text="error"></div></template>

            <template x-if="profile">
              <div>

                <!-- ─── HEADER PROFIL ─── -->
                <div class="relative px-4 pt-6 pb-4 bg-gradient-to-b from-ink-900/80 to-transparent overflow-visible">

                  <!-- Actions rapides (mon profil) — haut à droite -->
                  <template x-if="isMe">
                    <div class="absolute top-4 right-4 flex items-center gap-2 z-20">
                      <!-- Rafraîchir -->
                      <button @click="window.location.reload()" title="Rafraîchir" class="w-9 h-9 rounded-full bg-ink-800/80 border border-ink-700/50 flex items-center justify-center text-cream-300/60 hover:text-cream-200 hover:bg-ink-700 active:scale-95 transition-all">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      </button>
                      <!-- Déconnexion -->
                      <button @click="$store.app.signOut()" title="Déconnexion" class="w-9 h-9 rounded-full bg-ink-800/80 border border-ink-700/50 flex items-center justify-center text-cream-300/60 hover:text-amber-400 hover:bg-ink-700 active:scale-95 transition-all">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      </button>
                      <!-- Supprimer le compte -->
                      <button @click="showDeleteAccountModal = true" title="Supprimer mon compte" class="w-9 h-9 rounded-full bg-red-950/60 border border-red-900/40 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-950/80 active:scale-95 transition-all">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </template>

                  <!-- Photo de profil + infos -->
                  <div class="flex items-end gap-4 mb-4">

                    <!-- Avatar avec upload si c'est moi -->
                    <div class="relative flex-shrink-0">
                      <template x-if="avatarUrl">
                        <img :src="avatarUrl" alt="Avatar" class="w-20 h-20 rounded-full object-cover border-2 border-flame-500/40" />
                      </template>
                      <template x-if="!avatarUrl">
                        <div class="w-20 h-20 rounded-full bg-ink-700 border-2 border-flame-500/40 flex items-center justify-center text-2xl font-mono text-cream-200" x-text="avatarInitial"></div>
                      </template>

                      <!-- Bouton upload (uniquement sur mon profil) -->
                      <template x-if="isMe">
                        <label class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-flame-600 flex items-center justify-center cursor-pointer hover:bg-flame-500 transition-colors" :class="uploadingAvatar ? 'opacity-50 pointer-events-none' : ''">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="uploadAvatar($event)" />
                        </label>
                      </template>

                      <template x-if="uploadingAvatar">
                        <div class="absolute inset-0 rounded-full bg-ink-900/70 flex items-center justify-center">
                          <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                        </div>
                      </template>
                    </div>

                    <!-- Nom + alias + stats -->
                    <div class="flex-1 min-w-0">
                      <h1 class="text-xl font-bold text-cream-50 truncate" x-text="'@' + profile.username"></h1>
                      <template x-if="alias">
                        <p class="text-xs text-flame-500 italic mt-0.5" x-text="alias"></p>
                      </template>
                      <template x-if="profile.bio">
                        <p class="text-xs text-cream-300/70 mt-1 line-clamp-2" x-text="profile.bio"></p>
                      </template>

                      <!-- Compteurs followers / following -->
                      <div class="flex gap-4 mt-2">
                        <button @click="setTab('followers')" class="text-left">
                          <span class="text-sm font-bold text-cream-50" x-text="counts.followers"></span>
                          <span class="text-xs text-cream-300/60 ml-1">abonnés</span>
                        </button>
                        <button @click="setTab('following')" class="text-left">
                          <span class="text-sm font-bold text-cream-50" x-text="counts.following"></span>
                          <span class="text-xs text-cream-300/60 ml-1">abonnements</span>
                        </button>
                      </div>
                    </div>

                    <!-- Bouton follow (si pas mon profil) -->
                    <template x-if="!isMe">
                      <button @click="toggleFollow" :class="isFollowing ? 'btn-secondary' : 'btn-primary'" class="text-xs py-2 px-4 flex-shrink-0">
                        <span x-text="isFollowing ? 'Suivi' : 'Suivre'"></span>
                      </button>
                    </template>
                  </div>

                  <!-- Séries en commun (si pas mon profil) -->
                  <template x-if="!isMe">
                    <div class="flex items-center gap-2 mb-3">
                      <template x-if="commonSeriesLoading">
                        <span class="text-xs text-cream-300/50">Calcul des séries en commun…</span>
                      </template>
                      <template x-if="!commonSeriesLoading && commonSeriesCount !== null">
                        <div class="flex items-center gap-2">
                          <div :class="canChat ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-ink-800 text-cream-300/60 border-ink-700'" class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                            <span x-text="commonSeriesCount + ' série' + (commonSeriesCount > 1 ? 's' : '') + ' en commun'"></span>
                          </div>
                          <template x-if="canChat">
                            <span class="text-[10px] text-green-400">· Chat disponible bientôt</span>
                          </template>
                        </div>
                      </template>
                    </div>
                  </template>

                  <!-- Toggle visibilité bibliothèque (mon profil) -->
                  <template x-if="isMe">
                    <button @click="toggleVisibility" :disabled="togglingVisibility" class="flex items-center gap-1.5 text-[11px] text-cream-300/60 hover:text-cream-100 transition-colors mb-2">
                      <template x-if="profile.library_public">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </template>
                      <template x-if="!profile.library_public">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      </template>
                      <span x-text="profile.library_public ? 'Bibliothèque publique' : 'Bibliothèque privée'"></span>
                    </button>
                  </template>
                </div>

                <!-- ─── ONGLETS ─── -->
                <div class="flex border-b border-ink-700/50 mb-4 px-4 overflow-x-auto">
                  <button @click="setTab('top')" :class="activeTab === 'top' ? 'border-flame-500 text-cream-50' : 'border-transparent text-cream-300/60'" class="flex-shrink-0 text-xs font-medium px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap">Top 3</button>
                  <button x-show="showAnalysis" @click="setTab('library')" :class="activeTab === 'library' ? 'border-flame-500 text-cream-50' : 'border-transparent text-cream-300/60'" class="flex-shrink-0 text-xs font-medium px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap">
                    Bibliothèque
                    <span x-show="library.length > 0" class="ml-1 text-[10px] text-cream-300/50" x-text="'(' + library.length + ')'"></span>
                  </button>
                  <button x-show="isMe" @click="setTab('followers')" :class="activeTab === 'followers' ? 'border-flame-500 text-cream-50' : 'border-transparent text-cream-300/60'" class="flex-shrink-0 text-xs font-medium px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap">
                    Abonnés
                    <span class="ml-1 text-[10px] text-cream-300/50" x-text="'(' + counts.followers + ')'"></span>
                  </button>
                  <button x-show="isMe" @click="setTab('following')" :class="activeTab === 'following' ? 'border-flame-500 text-cream-50' : 'border-transparent text-cream-300/60'" class="flex-shrink-0 text-xs font-medium px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap">
                    Abonnements
                    <span class="ml-1 text-[10px] text-cream-300/50" x-text="'(' + counts.following + ')'"></span>
                  </button>
                </div>

                <!-- ─── ONGLET TOP 3 / FLOP 3 ─── -->
                <template x-if="activeTab === 'top'">
                  <div class="px-4 space-y-6">

                    <!-- Top 3 (toutes les séries recommandées) -->
                    <template x-if="currentTop && currentTop.shows.length > 0">
                      <div>
                        <div class="flex items-baseline justify-between mb-3">
                          <p class="text-[10px] uppercase tracking-[0.25em] text-flame-500 font-semibold">Top 3</p>
                          <span class="text-[10px] text-cream-300/40" x-text="currentTop.shows.length + ' série' + (currentTop.shows.length > 1 ? 's' : '')"></span>
                        </div>
                        <div class="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2 snap-x">
                          <template x-for="(show, idx) in currentTop.shows" :key="'t-' + show.id">
                            <a :href="'#/show/' + show.id" class="flex-shrink-0 w-24 snap-start group">
                              <div class="poster-compact relative">
                                <template x-if="show.poster">
                                  <img :src="show.poster" :alt="show.name" loading="lazy" class="group-hover:scale-105 transition-transform duration-500" />
                                </template>
                                <template x-if="!show.poster">
                                  <div class="aspect-[2/3] bg-ink-800 rounded"></div>
                                </template>
                                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded"></div>
                                <div class="absolute top-1 left-1.5 rank-number" :class="idx === 0 ? 'rank-number-filled' : ''" x-text="idx + 1"></div>
                              </div>
                              <p class="text-[11px] font-medium text-cream-100 line-clamp-2 mt-1.5 leading-tight" x-text="show.name"></p>
                              <template x-if="show.rating">
                                <p class="text-[10px] text-flame-500 mt-0.5">
                                  <template x-for="s in show.rating" :key="s">★</template>
                                </p>
                              </template>
                            </a>
                          </template>
                        </div>
                      </div>
                    </template>

                    <!-- Flop 3 (toutes les séries déconseillées) -->
                    <template x-if="currentFlop && currentFlop.shows.length > 0">
                      <div>
                        <div class="flex items-baseline justify-between mb-3">
                          <p class="text-[10px] uppercase tracking-[0.25em] text-cream-300/60 font-semibold">Flop 3</p>
                          <span class="text-[10px] text-cream-300/40" x-text="currentFlop.shows.length + ' série' + (currentFlop.shows.length > 1 ? 's' : '')"></span>
                        </div>
                        <div class="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2 snap-x">
                          <template x-for="(show, idx) in currentFlop.shows" :key="'f-' + show.id">
                            <a :href="'#/show/' + show.id" class="flex-shrink-0 w-24 snap-start group">
                              <div class="poster-compact relative">
                                <template x-if="show.poster">
                                  <img :src="show.poster" :alt="show.name" loading="lazy" class="grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                                </template>
                                <template x-if="!show.poster">
                                  <div class="aspect-[2/3] bg-ink-800 rounded"></div>
                                </template>
                                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded"></div>
                                <div class="absolute top-1 left-1.5 rank-number rank-number-flop" x-text="idx + 1"></div>
                              </div>
                              <p class="text-[11px] font-medium text-cream-100 line-clamp-2 mt-1.5 leading-tight" x-text="show.name"></p>
                            </a>
                          </template>
                        </div>
                      </div>
                    </template>

                    <template x-if="(!currentTop || currentTop.shows.length === 0) && (!currentFlop || currentFlop.shows.length === 0)">
                      <div class="text-center py-12">
                        <p class="text-sm text-cream-300/50 mb-2">Aucune série recommandée pour le moment.</p>
                        <p class="text-xs text-cream-300/40">Ajoute des séries depuis Découverte et marque-les "Je recommande" ou "Je déconseille" pour qu'elles apparaissent ici.</p>
                      </div>
                    </template>

                  </div>
                </template>

                <!-- ─── ONGLET BIBLIOTHÈQUE (grille statique, sans swipe) ─── -->
                <template x-if="activeTab === 'library'">
                  <div class="px-4">
                    <template x-if="!showAnalysis && !isMe">
                      <p class="text-sm text-cream-300/50 text-center py-12">Bibliothèque privée.</p>
                    </template>
                    <template x-if="showAnalysis || isMe">
                      <div>
                        <template x-if="libraryLoading">
                          <div class="grid grid-cols-3 gap-3">
                            <template x-for="i in 9" :key="i">
                              <div class="skeleton aspect-[2/3] rounded-lg"></div>
                            </template>
                          </div>
                        </template>
                        <template x-if="!libraryLoading && library.length === 0">
                          <p class="text-sm text-cream-300/50 text-center py-12">Aucune série dans la bibliothèque.</p>
                        </template>
                        <div class="grid grid-cols-3 gap-3" x-show="!libraryLoading && library.length > 0">
                          <template x-for="item in library" :key="item.id">
                            <a :href="'#/show/' + item.tmdb_id" class="block group">
                              <div class="aspect-[2/3] rounded-lg overflow-hidden bg-ink-800 relative">
                                <template x-if="item.show?.poster">
                                  <img :src="item.show.poster" :alt="item.show.name" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                </template>
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <template x-if="item.recommendation === 'recommended'">
                                  <span class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  </span>
                                </template>
                                <template x-if="item.recommendation === 'not_recommended'">
                                  <span class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </span>
                                </template>
                              </div>
                              <p class="text-[11px] font-medium text-cream-100 line-clamp-2 mt-1.5 leading-tight" x-text="item.show?.name"></p>
                              <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="text-[9px]" :class="statusColor(item.status)" x-text="statusLabel(item.status)"></span>
                                <template x-if="item.rating">
                                  <span class="text-[9px] text-flame-500">
                                    <template x-for="s in item.rating" :key="s">★</template>
                                  </span>
                                </template>
                              </div>
                            </a>
                          </template>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>

                <!-- ─── ONGLET ABONNÉS ─── -->
                <template x-if="activeTab === 'followers'">
                  <div class="px-4">
                    <template x-if="followersLoading">
                      <div class="space-y-3"><template x-for="i in 4" :key="i"><div class="skeleton h-14 rounded-xl"></div></template></div>
                    </template>
                    <template x-if="!followersLoading && followers.length === 0">
                      <p class="text-sm text-cream-300/50 text-center py-8">Aucun abonné pour le moment.</p>
                    </template>
                    <div class="space-y-2">
                      <template x-for="user in followers" :key="user.id">
                        <div class="card p-3 flex items-center gap-3">
                          <template x-if="user.avatar_url">
                            <img :src="user.avatar_url" :alt="user.username" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                          </template>
                          <template x-if="!user.avatar_url">
                            <div class="w-10 h-10 rounded-full bg-ink-700 flex items-center justify-center text-sm font-mono text-cream-200 flex-shrink-0" x-text="user.username?.charAt(0).toUpperCase()"></div>
                          </template>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-cream-100 truncate" x-text="'@' + user.username"></p>
                            <template x-if="user.library_public">
                              <p class="text-[11px] text-cream-300/50">Bibliothèque publique</p>
                            </template>
                          </div>
                          <div class="flex gap-2">
                            <a :href="'#/u/' + user.username" class="text-[11px] px-3 py-1.5 rounded-lg bg-ink-700 text-cream-200 hover:bg-ink-600 transition-colors">Profil</a>
                            <template x-if="user.library_public">
                              <a :href="'#/u/' + user.username + '?tab=library'" @click="$store.app.navigate('#/u/' + user.username)" class="text-[11px] px-3 py-1.5 rounded-lg bg-flame-600/20 text-flame-400 border border-flame-600/30 hover:bg-flame-600/30 transition-colors">Biblio</a>
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>

                <!-- ─── ONGLET ABONNEMENTS ─── -->
                <template x-if="activeTab === 'following'">
                  <div class="px-4">
                    <template x-if="followingLoading">
                      <div class="space-y-3"><template x-for="i in 4" :key="i"><div class="skeleton h-14 rounded-xl"></div></template></div>
                    </template>
                    <template x-if="!followingLoading && following.length === 0">
                      <p class="text-sm text-cream-300/50 text-center py-8">Vous ne suivez personne pour le moment.</p>
                    </template>
                    <div class="space-y-2">
                      <template x-for="user in following" :key="user.id">
                        <div class="card p-3 flex items-center gap-3">
                          <template x-if="user.avatar_url">
                            <img :src="user.avatar_url" :alt="user.username" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                          </template>
                          <template x-if="!user.avatar_url">
                            <div class="w-10 h-10 rounded-full bg-ink-700 flex items-center justify-center text-sm font-mono text-cream-200 flex-shrink-0" x-text="user.username?.charAt(0).toUpperCase()"></div>
                          </template>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-cream-100 truncate" x-text="'@' + user.username"></p>
                            <template x-if="user.library_public">
                              <p class="text-[11px] text-cream-300/50">Bibliothèque publique</p>
                            </template>
                          </div>
                          <div class="flex gap-2">
                            <a :href="'#/u/' + user.username" class="text-[11px] px-3 py-1.5 rounded-lg bg-ink-700 text-cream-200 hover:bg-ink-600 transition-colors">Profil</a>
                            <template x-if="user.library_public">
                              <a :href="'#/u/' + user.username + '?tab=library'" @click="$store.app.navigate('#/u/' + user.username)" class="text-[11px] px-3 py-1.5 rounded-lg bg-flame-600/20 text-flame-400 border border-flame-600/30 hover:bg-flame-600/30 transition-colors">Biblio</a>
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>

                <!-- ─── ACTIONS PROFIL (profil autre) ─── -->
                <div class="px-4 pb-8 mt-2">
                  <button x-show="!isMe" @click="showReportModal = true" class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-cream-300/50 text-sm border border-ink-700/40 hover:border-ink-600 hover:text-cream-300/80 active:bg-ink-800 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    Signaler cet utilisateur
                  </button>
                </div>

              </div>
            </template>

            <!-- ─── MODAL CONFIRMATION SUPPRESSION SÉRIE ─── -->
            <template x-if="pendingDeleteId">
              <div class="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="cancelDelete()">
                <div class="w-full max-w-sm bg-ink-900 rounded-2xl p-6 border border-ink-700/50 animate-slide-up">
                  <h3 class="text-base font-semibold text-cream-50 mb-2">Supprimer cette série ?</h3>
                  <p class="text-sm text-cream-300/70 mb-5">Cette action est irréversible. La série sera retirée de ta bibliothèque.</p>
                  <div class="flex gap-3">
                    <button @click="cancelDelete()" class="flex-1 py-2.5 rounded-xl bg-ink-700 text-cream-200 text-sm font-medium hover:bg-ink-600 transition-colors">Annuler</button>
                    <button @click="confirmAndDelete()" :disabled="deleting" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50">
                      <span x-show="!deleting">Supprimer</span>
                      <span x-show="deleting">…</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- ─── MODAL SIGNALEMENT ─── -->
            <template x-if="showReportModal">
              <div class="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="showReportModal = false">
                <div class="w-full max-w-sm bg-ink-900 rounded-2xl p-6 border border-ink-700/50 animate-slide-up">
                  <template x-if="!reportSent">
                    <div>
                      <h3 class="text-base font-semibold text-cream-50 mb-1">Signaler cet utilisateur</h3>
                      <p class="text-xs text-cream-300/60 mb-4">Ton signalement sera traité de façon confidentielle.</p>
                      <div class="mb-3">
                        <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-2 block">Catégorie</label>
                        <div class="grid grid-cols-2 gap-2">
                          <template x-for="cat in [{id:'inappropriate',label:'Contenu inapproprié'},{id:'spam',label:'Spam'},{id:'harassment',label:'Harcèlement'},{id:'misinformation',label:'Désinformation'},{id:'other',label:'Autre'}]" :key="cat.id">
                            <button @click="reportCategory = cat.id" :class="reportCategory === cat.id ? 'bg-flame-600/20 text-flame-400 border-flame-600/40' : 'bg-ink-800 text-cream-300/60 border-ink-700'" class="text-[11px] px-3 py-2 rounded-lg border text-left transition-colors" x-text="cat.label"></button>
                          </template>
                        </div>
                      </div>
                      <div class="mb-4">
                        <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Détails</label>
                        <textarea x-model="reportReason" maxlength="500" rows="3" class="input resize-none text-sm" placeholder="Décris le problème…"></textarea>
                      </div>
                      <div class="flex gap-3">
                        <button @click="showReportModal = false" class="flex-1 py-2.5 rounded-xl bg-ink-700 text-cream-200 text-sm hover:bg-ink-600 transition-colors">Annuler</button>
                        <button @click="submitReport()" :disabled="reportSending || !reportReason.trim()" class="flex-1 py-2.5 rounded-xl bg-flame-600 text-cream-50 text-sm font-semibold hover:bg-flame-500 transition-colors disabled:opacity-50">
                          <span x-show="!reportSending">Signaler</span>
                          <span x-show="reportSending">…</span>
                        </button>
                      </div>
                    </div>
                  </template>
                  <template x-if="reportSent">
                    <div class="text-center py-4">
                      <svg class="mx-auto mb-3 text-green-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <p class="text-sm font-medium text-cream-50">Signalement envoyé</p>
                      <p class="text-xs text-cream-300/60 mt-1">Merci pour ta contribution.</p>
                    </div>
                  </template>
                </div>
              </div>
            </template>

            <!-- ─── MODAL SUPPRESSION DE COMPTE ─── -->
            <template x-if="showDeleteAccountModal">
              <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="showDeleteAccountModal = false; deleteConfirmText = ''">
                <div class="w-full max-w-sm bg-ink-900 rounded-2xl p-6 border border-red-900/50 animate-slide-up max-h-[80vh] overflow-y-auto">
                  <div class="flex items-center gap-2 mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <h3 class="text-base font-semibold text-red-400">Supprimer mon compte</h3>
                  </div>
                  <p class="text-sm text-cream-300/70 mb-2">Cette action est <strong class="text-cream-100">définitive et irréversible</strong>. Toutes tes données seront supprimées :</p>
                  <ul class="text-xs text-cream-300/60 mb-4 space-y-1 ml-3">
                    <li>• Ton profil et tes informations</li>
                    <li>• Ta bibliothèque de séries</li>
                    <li>• Tes Top 3 et Flop 3</li>
                    <li>• Tes abonnements et abonnés</li>
                  </ul>
                  <div class="flex gap-3 mb-4">
                    <button @click="showDeleteAccountModal = false; deleteConfirmText = ''" class="flex-1 py-2.5 rounded-xl bg-ink-700 text-cream-200 text-sm hover:bg-ink-600 transition-colors">Annuler</button>
                    <button @click="deleteAccount()" :disabled="deletingAccount || deleteConfirmText !== 'SUPPRIMER'" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50">
                      <span x-show="!deletingAccount">Supprimer</span>
                      <span x-show="deletingAccount">Suppression…</span>
                    </button>
                  </div>
                  <div>
                    <label class="text-xs text-cream-300/70 mb-1.5 block">Tape <strong class="text-red-400">SUPPRIMER</strong> pour confirmer</label>
                    <input x-model="deleteConfirmText" type="text" class="input text-sm" placeholder="SUPPRIMER" autocomplete="off" autocorrect="off" autocapitalize="characters" />
                  </div>
                </div>
              </div>
            </template>

          </section>
        </template>

        <!-- ============== SHOW DETAIL ============== -->
        <template x-if="$store.app.route.name === 'show'">
          <section :key="$store.app.route.params[0]" x-data="showView()" x-init="init()" class="animate-fade-in">
            <template x-if="loading"><div class="p-8 text-center text-cream-300/50">Chargement…</div></template>
            <template x-if="error"><div class="p-8 text-flame-400 text-center" x-text="error"></div></template>

            <template x-if="show">
              <div>
                <div class="relative h-64 overflow-hidden">
                  <img x-show="show.backdrop_path" :src="'https://image.tmdb.org/t/p/w780' + show.backdrop_path" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/60"></div>
                  <a href="javascript:history.back()" class="absolute top-4 left-4 safe-top w-9 h-9 rounded-full bg-ink-950/70 backdrop-blur flex items-center justify-center text-cream-50">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  </a>
                </div>

                <div class="px-4 -mt-16 relative z-10">
                  <div class="flex gap-3 mb-4">
                    <img x-show="show.poster_path" :src="'https://image.tmdb.org/t/p/w342' + show.poster_path" class="w-28 rounded-lg shadow-2xl shadow-black/50 bg-ink-800" />
                    <div class="flex-1 pt-12 min-w-0">
                      <p class="text-[11px] text-cream-300/60" x-text="(show.first_air_date?.slice(0,4) || '') + ' · ' + (show.number_of_seasons || '?') + ' saisons'"></p>
                      <h1 class="text-2xl display italic leading-tight mt-1" x-text="show.name"></h1>
                      <span class="inline-flex items-center gap-1 text-gold-500 text-xs mt-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        <span x-text="show.vote_average?.toFixed(1)"></span>
                      </span>
                    </div>
                  </div>

                  <!-- Bouton de classement principal -->
                  <button @click="classify" class="btn-primary w-full mb-4 flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 11l3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span x-text="myEntry ? 'Modifier · ' + statusLabel : 'Ajouter à ma bibliothèque'"></span>
                  </button>

                  <!-- Recommandations des comptes suivis -->
                  <template x-if="followedRecommenders.length > 0">
                    <div class="card p-3 mb-4">
                      <p class="text-[10px] uppercase tracking-wider text-flame-500 mb-2">Recommandé par tes abonnements</p>
                      <div class="flex items-center gap-2 flex-wrap">
                        <template x-for="r in followedRecommenders" :key="r.recommender_id">
                          <a :href="'#/u/' + r.recommender_username" class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-ink-800 text-xs">
                            <div class="w-5 h-5 rounded-full bg-ink-700 flex items-center justify-center text-[10px] font-mono">
                              <span x-text="r.recommender_username?.charAt(0).toUpperCase()"></span>
                            </div>
                            <span class="text-cream-200" x-text="'@' + r.recommender_username"></span>
                          </a>
                        </template>
                      </div>
                    </div>
                  </template>

                  <div class="flex flex-wrap gap-1.5 mb-4">
                    <template x-for="g in show.genres || []" :key="g.id"><span class="chip" x-text="g.name"></span></template>
                  </div>

                  <template x-if="show.overview">
                    <div class="mb-5">
                      <h2 class="text-[11px] tracking-wider uppercase text-cream-300/60 mb-1.5">Synopsis</h2>
                      <p class="text-sm text-cream-200 leading-relaxed" x-text="show.overview"></p>
                    </div>
                  </template>

                  <div class="mb-5">
                    <h2 class="text-[11px] tracking-wider uppercase text-cream-300/60 mb-2">Où regarder en France</h2>
                    <template x-if="!providers || allProviders.length === 0">
                      <p class="text-xs text-cream-300/50">Aucune plateforme française listée.</p>
                    </template>
                    <template x-if="providers && allProviders.length > 0">
                      <div class="space-y-2">
                        <template x-if="providers.flatrate?.length">
                          <div>
                            <p class="text-[10px] text-flame-500 uppercase tracking-wider mb-1">Abonnement</p>
                            <div class="flex flex-wrap gap-1.5">
                              <template x-for="p in providers.flatrate" :key="p.provider_id">
                                <div class="card px-2 py-1 flex items-center gap-1.5">
                                  <img :src="'https://image.tmdb.org/t/p/w92' + p.logo_path" class="w-5 h-5 rounded" />
                                  <span class="text-xs" x-text="p.provider_name"></span>
                                </div>
                              </template>
                            </div>
                          </div>
                        </template>
                        <template x-if="freeOrAds.length > 0">
                          <div>
                            <p class="text-[10px] text-gold-500 uppercase tracking-wider mb-1">Gratuit</p>
                            <div class="flex flex-wrap gap-1.5">
                              <template x-for="p in freeOrAds" :key="p.provider_id">
                                <div class="card px-2 py-1 flex items-center gap-1.5">
                                  <img :src="'https://image.tmdb.org/t/p/w92' + p.logo_path" class="w-5 h-5 rounded" />
                                  <span class="text-xs" x-text="p.provider_name"></span>
                                </div>
                              </template>
                            </div>
                          </div>
                        </template>
                        <p class="text-[10px] text-cream-300/40">Données JustWatch via TMDB.</p>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </section>
        </template>

      </main>

      <!-- FOOTER LÉGAL -->
      <footer class="relative z-10 text-center pb-20 pt-4">
        <p class="text-[10px] text-cream-300/30">
          <a href="#/legal/beta" class="hover:text-cream-300/60">Phase de test</a> ·
          <a href="#/legal/mentions" class="hover:text-cream-300/60">Mentions</a> ·
          <a href="#/legal/privacy" class="hover:text-cream-300/60">Confidentialité</a>
        </p>
      </footer>

      <!-- ============== WELCOME MODAL (3 écrans) ============== -->
      <template x-if="$store.app.profile && $store.app.profile.welcome_seen === false">
        <div id="onboarding" x-data="welcomeModal()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div class="relative w-full max-w-md bg-ink-900 rounded-3xl border border-ink-700/50 overflow-hidden">

            <!-- Bouton "Ne plus afficher" -->
            <button @click="dismiss()" :disabled="saving" class="absolute top-3 right-3 z-10 text-[11px] text-cream-300/50 hover:text-cream-100 px-3 py-1.5 rounded-full hover:bg-ink-800 transition-colors disabled:opacity-50">
              Ne plus afficher
            </button>

            <!-- Progress -->
            <div class="px-6 pt-6 flex gap-2">
              <div class="h-1 flex-1 rounded-full transition-colors" :class="step >= 1 ? 'bg-flame-500' : 'bg-ink-700'"></div>
              <div class="h-1 flex-1 rounded-full transition-colors" :class="step >= 2 ? 'bg-flame-500' : 'bg-ink-700'"></div>
              <div class="h-1 flex-1 rounded-full transition-colors" :class="step >= 3 ? 'bg-flame-500' : 'bg-ink-700'"></div>
            </div>

            <!-- ob-screen-1 -->
            <section x-show="step === 1" id="ob-screen-1" class="p-8">
              <h2 class="text-2xl display italic text-cream-50 mb-6">Comment créer un profil et le supprimer</h2>
            </section>

            <!-- ob-screen-2 -->
            <section x-show="step === 2" id="ob-screen-2" class="p-8">
              <h2 class="text-2xl display italic text-cream-50 mb-6">Comment ajouter une série</h2>
            </section>

            <!-- ob-screen-3 -->
            <section x-show="step === 3" id="ob-screen-3" class="p-8">
              <h2 class="text-2xl display italic text-cream-50 mb-6">Vos données, vos choix.</h2>
              <div class="space-y-3">
                <label class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-ink-800 border border-ink-700/50 cursor-pointer">
                  <span class="text-sm text-cream-100">Cookies analytiques</span>
                  <input type="checkbox" x-model="consent_analytics" class="w-5 h-5 accent-flame-500" />
                </label>
                <label class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-ink-800 border border-ink-700/50 cursor-pointer">
                  <span class="text-sm text-cream-100">Notifications</span>
                  <input type="checkbox" x-model="consent_notifications" class="w-5 h-5 accent-flame-500" />
                </label>
                <label class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-ink-800 border border-ink-700/50 cursor-pointer">
                  <span class="text-sm text-cream-100">Personnalisation</span>
                  <input type="checkbox" x-model="consent_personalization" class="w-5 h-5 accent-flame-500" />
                </label>
              </div>
            </section>

            <!-- Navigation -->
            <div class="px-6 pb-6 flex gap-3">
              <button x-show="step > 1" @click="prev()" class="flex-1 py-3 rounded-xl bg-ink-700 text-cream-200 text-sm hover:bg-ink-600 transition-colors">Précédent</button>
              <button x-show="step < 3" @click="next()" class="flex-1 py-3 rounded-xl bg-flame-600 text-cream-50 text-sm font-semibold hover:bg-flame-500 transition-colors">Suivant</button>
              <button x-show="step === 3" @click="finish()" :disabled="saving" class="flex-1 py-3 rounded-xl bg-flame-600 text-cream-50 text-sm font-semibold hover:bg-flame-500 transition-colors disabled:opacity-50">
                <span x-show="!saving">Terminer</span>
                <span x-show="saving">…</span>
              </button>
            </div>

          </div>
        </div>
      </template>

      <!-- ============== BOTTOM NAV : 5 onglets égaux ============== -->
      <nav class="fixed bottom-0 left-0 right-0 z-30 nav-glass nav-bottom">
        <div class="flex items-center justify-around max-w-md mx-auto px-2 pt-2">
          <!-- Bibliothèque — Lucide: book-open -->
          <a href="#/library" :class="$store.app.route.name === 'library' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Bibliothèque</span>
          </a>
          <!-- Découverte — Lucide: compass -->
          <a href="#/discover" :class="$store.app.route.name === 'discover' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Découverte</span>
          </a>
          <!-- Fil — Lucide: layout-list -->
          <a href="#/feed" :class="$store.app.route.name === 'feed' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="M13 5h8M13 9h5M3 15h18M3 19h14"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Fil</span>
          </a>
          <!-- Tendances — Lucide: trending-up -->
          <a href="#/trending" :class="$store.app.route.name === 'trending' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Tendances</span>
          </a>
          <!-- Profil — Lucide: user -->
          <a href="#/profile" :class="$store.app.route.name === 'profile' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Profil</span>
          </a>
        </div>
      </nav>

      <!-- ============== MODAL CLASSIFIER (global) ============== -->
      <div x-data="classifierModal()" @classifier:open.window="openModal($event.detail.tmdbId, $event.detail.showInfo)">
        <template x-if="open">
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" @click.self="closeModal">
            <div class="w-full max-w-md bg-ink-900 rounded-2xl border-2 border-flame-500/40 shadow-2xl max-h-[90vh] overflow-y-auto p-5">

              <template x-if="loading">
                <div class="text-center py-8 text-cream-300/50 text-sm">Chargement…</div>
              </template>

              <template x-if="!loading">
                <div>
                  <!-- En-tête série -->
                  <div class="flex gap-3 mb-5">
                    <img x-show="showInfo?.poster_path" :src="'https://image.tmdb.org/t/p/w154' + showInfo.poster_path" class="w-16 rounded-md bg-ink-800" />
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] uppercase tracking-wider text-cream-300/60">Classer</p>
                      <h2 class="display italic text-xl leading-tight" x-text="showInfo?.name"></h2>
                      <p class="text-[11px] text-cream-300/50" x-text="(showInfo?.first_air_date || '').slice(0,4)"></p>
                    </div>
                  </div>

                  <!-- Statut -->
                  <div class="mb-5">
                    <p class="text-[10px] uppercase tracking-wider text-cream-300/60 mb-2">Statut</p>
                    <div class="grid grid-cols-2 gap-2">
                      <button @click="setStatus('wishlist')" :class="form.status === 'wishlist' ? 'pill-active border-flame-500/40' : 'pill'" class="text-xs py-2 px-3 rounded-md w-full">À voir</button>
                      <button @click="setStatus('watching')" :class="form.status === 'watching' ? 'pill-active border-flame-500/40' : 'pill'" class="text-xs py-2 px-3 rounded-md w-full">En cours</button>
                      <button @click="setStatus('finished')" :class="form.status === 'finished' ? 'pill-active border-flame-500/40' : 'pill'" class="text-xs py-2 px-3 rounded-md w-full">Terminée</button>
                      <button @click="setStatus('abandoned')" :class="form.status === 'abandoned' ? 'pill-active border-flame-500/40' : 'pill'" class="text-xs py-2 px-3 rounded-md w-full">Abandonnée</button>
                    </div>
                  </div>

                  <!-- Progression (si watching) -->
                  <template x-if="form.status === 'watching'">
                    <div class="mb-5">
                      <p class="text-[10px] uppercase tracking-wider text-cream-300/60 mb-2">Progression</p>
                      <div class="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label class="text-[10px] text-cream-300/60 block mb-1">Saison</label>
                          <input type="number" x-model.number="form.current_season" min="1" max="50" class="input py-2 text-sm" />
                        </div>
                        <div>
                          <label class="text-[10px] text-cream-300/60 block mb-1">Épisode</label>
                          <input type="number" x-model.number="form.current_episode" min="1" max="999" class="input py-2 text-sm" />
                        </div>
                      </div>
                      <p class="text-[10px] text-cream-300/60 mb-1.5">Plateforme</p>
                      <div class="flex flex-wrap gap-1.5">
                        <template x-for="p in providers" :key="p.id">
                          <button @click="selectProvider(p)" :class="form.provider_id === p.id ? 'border-flame-500' : 'border-ink-700'" class="flex items-center gap-1 px-2 py-1 rounded-md border bg-ink-800 text-[11px]">
                            <img :src="'https://image.tmdb.org/t/p/w92' + p.logo_path" class="w-4 h-4 rounded" />
                            <span x-text="p.name"></span>
                          </button>
                        </template>
                        <button @click="selectProvider(null)" class="px-2 py-1 rounded-md border border-ink-700 bg-ink-800 text-[11px]">Aucune</button>
                      </div>
                    </div>
                  </template>

                  <!-- Notation + recommandation (si finished/abandoned) -->
                  <template x-if="canRate">
                    <div class="mb-5">
                      <p class="text-[10px] uppercase tracking-wider text-cream-300/60 mb-2">Note</p>
                      <div class="flex items-center gap-1 mb-4">
                        <template x-for="n in 5" :key="n">
                          <button @click="setRating(n)" type="button" class="star-btn" :class="form.rating >= n ? 'active' : ''">
                            <svg width="28" height="28" viewBox="0 0 24 24" :fill="form.rating >= n ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </button>
                        </template>
                        <template x-if="form.rating">
                          <button @click="form.rating = null" class="ml-2 text-[10px] text-cream-300/50">Effacer</button>
                        </template>
                      </div>

                      <p class="text-[10px] uppercase tracking-wider text-cream-300/60 mb-2">Avis</p>
                      <div class="grid grid-cols-2 gap-2 mb-3">
                        <button @click="setRecommendation('recommended')" :class="form.recommendation === 'recommended' ? 'pill-active border-flame-500/40' : 'pill'" class="text-xs py-2 px-3 rounded-md w-full flex items-center justify-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7"/></svg>
                          Je recommande
                        </button>
                        <button @click="setRecommendation('not_recommended')" :class="form.recommendation === 'not_recommended' ? 'pill-active border-flame-500/40' : 'pill'" class="text-xs py-2 px-3 rounded-md w-full flex items-center justify-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17"/></svg>
                          Je déconseille
                        </button>
                      </div>

                      <div>
                        <label class="text-[10px] uppercase tracking-wider text-cream-300/60 mb-1.5 block">Verdict (optionnel, 1 phrase)</label>
                        <textarea x-model="form.verdict" maxlength="200" rows="2" class="input text-sm resize-none" placeholder="Ce que tu en retiens..."></textarea>
                      </div>
                    </div>
                  </template>

                  <template x-if="error">
                    <div class="text-sm text-flame-400 bg-flame-600/10 border border-flame-600/30 rounded-lg px-3 py-2 mb-3" x-text="error"></div>
                  </template>

                  <div class="flex gap-2">
                    <template x-if="entry">
                      <button @click="remove" :disabled="saving" class="btn-ghost text-sm flex-1">Retirer</button>
                    </template>
                    <button @click="closeModal" class="btn-ghost text-sm flex-1">Annuler</button>
                    <button @click="save" :disabled="saving" class="btn-primary text-sm flex-1">
                      <span x-show="!saving">Enregistrer</span>
                      <span x-show="saving">…</span>
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>

  <!-- Pas connecté → vers auth -->
  <template x-if="!$store.app.isAuthed && !['auth','onboarding','legal'].includes($store.app.route.name)">
    <div x-init="window.location.hash = '#/auth'"></div>
  </template>

  <!-- Toast global -->
  <template x-if="$store.app.toast">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[200] safe-top">
      <div class="card-strong px-4 py-2.5 text-sm animate-slide-up" :class="$store.app.toast.type === 'success' ? 'border-flame-500/50 text-flame-400' : ''" x-text="$store.app.toast.message"></div>
    </div>
  </template>

</div>
`
