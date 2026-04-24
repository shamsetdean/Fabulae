export const appTemplate = `
<div x-show="!$store.app.authReady" class="min-h-dvh flex items-center justify-center">
  <div class="text-cream-300/40 text-sm font-mono">chargement...</div>
</div>

<div x-show="$store.app.authReady">

  <!-- ============== AUTH ============== -->
  <template x-if="$store.app.route.name === 'auth'">
    <section x-data="authView()" class="min-h-dvh flex flex-col justify-center px-6 py-10 relative z-10">
      <div class="max-w-sm mx-auto w-full animate-slide-up">
        <div class="mb-8 text-center">
          <span class="beta-banner mb-4">● Bêta privée · phase de test</span>
          <div class="inline-flex items-center gap-2 text-flame-500 text-xs tracking-[0.3em] uppercase mb-4 mt-4">
            <span class="w-8 h-px bg-flame-500"></span>Saison 1<span class="w-8 h-px bg-flame-500"></span>
          </div>
          <h1 class="text-5xl display text-cream-50 italic">My TVShow</h1>
          <p class="mt-3 text-cream-300 text-sm">Ton Top 3 des séries du moment.<br>Partagé. Classé. Débattu.</p>
        </div>

        <div class="card p-6 space-y-4">
          <div class="flex gap-2">
            <button @click="mode = 'signin'" :class="mode === 'signin' ? 'bg-flame-600 text-cream-50' : 'text-cream-200'" class="flex-1 py-2.5 rounded-full text-sm font-medium transition-colors">Connexion</button>
            <button @click="mode = 'signup'" :class="mode === 'signup' ? 'bg-flame-600 text-cream-50' : 'text-cream-200'" class="flex-1 py-2.5 rounded-full text-sm font-medium transition-colors">Créer un compte</button>
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

            <button type="submit" :disabled="loading" class="btn-primary w-full">
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
    <section x-data="onboardingView()" class="min-h-dvh flex flex-col justify-center px-6 py-10 relative z-10">
      <div class="max-w-sm mx-auto w-full animate-slide-up">
        <h1 class="text-4xl display italic mb-2">Choisis ton pseudo.</h1>
        <p class="text-cream-300 text-sm mb-8">C'est ce que les autres verront sur tes Top 3.</p>

        <form @submit.prevent="submit" class="card p-6 space-y-4">
          <div>
            <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Pseudo</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-cream-300/50">@</span>
              <input x-model="username" maxlength="20" required class="input pl-8" placeholder="seriesfan" />
            </div>
          </div>
          <div>
            <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Bio (optionnel)</label>
            <textarea x-model="bio" maxlength="140" rows="3" class="input resize-none" placeholder="Amateur de thrillers scandinaves et de comédies italiennes."></textarea>
          </div>

          <template x-if="error">
            <div class="text-sm text-flame-400 bg-flame-600/10 border border-flame-600/30 rounded-lg px-3 py-2" x-text="error"></div>
          </template>

          <button type="submit" :disabled="loading" class="btn-primary w-full">
            <span x-show="!loading">Commencer</span>
            <span x-show="loading">…</span>
          </button>
        </form>
      </div>
    </section>
  </template>

  <!-- ============== LEGAL (accessible sans auth) ============== -->
  <template x-if="$store.app.route.name === 'legal'">
    <section x-data="legalView()" x-init="init()" class="px-5 pt-5 safe-top pb-20 animate-fade-in max-w-xl mx-auto">
      <a href="javascript:history.back()" class="inline-flex items-center gap-1 text-sm text-cream-300 mb-4 hover:text-cream-100">← Retour</a>

      <h1 class="text-3xl display italic mb-2">Infos légales</h1>
      <p class="text-xs text-cream-300/60 mb-6">Projet personnel en phase de test · Bêta privée</p>

      <div class="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        <button @click="tab = 'beta'" :class="tab === 'beta' ? 'bg-flame-600 text-cream-50' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Phase de test</button>
        <button @click="tab = 'mentions'" :class="tab === 'mentions' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Mentions légales</button>
        <button @click="tab = 'privacy'" :class="tab === 'privacy' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Confidentialité</button>
      </div>

      <!-- PHASE DE TEST -->
      <div x-show="tab === 'beta'" class="prose-legal">
        <h2>Projet en cours d'élaboration</h2>
        <p><strong>My TVShow</strong> est un projet personnel actuellement en <strong>phase de test privée</strong>. L'application évolue régulièrement, et des bugs ou interruptions peuvent survenir.</p>

        <p><strong>Diffusion restreinte.</strong> Ce lien t'a été transmis personnellement dans le cadre d'une phase de test. Merci de <strong>ne pas le partager ni le redistribuer publiquement</strong> (réseaux sociaux, forums, etc.).</p>

        <p><strong>Données et contenus.</strong> Les données que tu saisis peuvent être réinitialisées sans préavis pendant cette phase. Ne dépends pas de l'application pour conserver des informations importantes.</p>

        <p><strong>Feedback bienvenu.</strong> Si tu rencontres un bug ou tu as une suggestion, écris-moi directement à <a href="mailto:shamsetdean@gmail.com">shamsetdean@gmail.com</a>.</p>

        <p>Merci de ta participation.</p>
      </div>

      <!-- MENTIONS LÉGALES -->
      <div x-show="tab === 'mentions'" class="prose-legal">
        <h2>Mentions légales</h2>
        <p><strong>Éditeur</strong> : projet personnel non commercial, édité par un particulier.</p>
        <p><strong>Contact</strong> : <a href="mailto:shamsetdean@gmail.com">shamsetdean@gmail.com</a></p>
        <p><strong>Hébergement</strong> : Vercel Inc. (frontend) et Supabase Inc. (base de données), avec infrastructure localisée en Union Européenne.</p>

        <h2>Propriété intellectuelle</h2>
        <p>Les métadonnées de séries (titres, synopsis, affiches, notes) proviennent de <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a>. <em>This product uses the TMDB API but is not endorsed or certified by TMDB.</em></p>
        <p>Les données de disponibilité streaming sont fournies par JustWatch via TMDB.</p>
        <p>Le code source et le design de l'application sont la propriété de son auteur. Les contenus publiés par les utilisateurs (Top 3, Flop 3, commentaires) restent leur propriété.</p>

        <h2>Responsabilité</h2>
        <p>L'application est fournie « en l'état » pendant sa phase de test. L'éditeur ne saurait être tenu responsable des interruptions, pertes de données, ou erreurs dans les informations diffusées (notamment celles issues de TMDB).</p>

        <h2>Signalement</h2>
        <p>Tout contenu estimé illicite peut être signalé à l'adresse de contact ci-dessus.</p>
      </div>

      <!-- POLITIQUE DE CONFIDENTIALITÉ -->
      <div x-show="tab === 'privacy'" class="prose-legal">
        <h2>Politique de confidentialité (simplifiée)</h2>
        <p>Cette politique décrit les données que nous collectons dans le cadre de l'utilisation de My TVShow et comment elles sont utilisées.</p>

        <h2>Données collectées</h2>
        <ul>
          <li><strong>Email</strong> : nécessaire pour créer ton compte</li>
          <li><strong>Mot de passe</strong> : stocké sous forme chiffrée, jamais lu en clair</li>
          <li><strong>Pseudo et bio</strong> : affichés publiquement sur ton profil</li>
          <li><strong>Contenus publiés</strong> : Top 3, Flop 3, likes, abonnements, bibliothèque</li>
          <li><strong>Adresse IP</strong> : collectée par Supabase pour la sécurité (logs 30 jours)</li>
        </ul>

        <h2>Finalités</h2>
        <p>Ces données servent uniquement à faire fonctionner l'application. <strong>Aucune donnée n'est vendue, louée, ni utilisée pour de la publicité.</strong> Aucun tracker tiers n'est utilisé (pas de Google Analytics, pas de Meta Pixel, pas de cookie publicitaire).</p>

        <h2>Cookies</h2>
        <p>L'application utilise uniquement des cookies techniques nécessaires à la connexion (token d'authentification) et un cache local (localStorage) pour les données TMDB. Aucun consentement spécifique n'est requis pour ces cookies strictement nécessaires.</p>

        <h2>Sous-traitants</h2>
        <ul>
          <li><strong>Supabase</strong> : base de données et authentification (UE)</li>
          <li><strong>Vercel</strong> : hébergement du site</li>
          <li><strong>TMDB</strong> : métadonnées de séries (aucune donnée perso transmise)</li>
        </ul>

        <h2>Tes droits</h2>
        <p>Conformément au RGPD, tu peux à tout moment :</p>
        <ul>
          <li>Accéder aux données te concernant</li>
          <li>Les rectifier ou supprimer</li>
          <li>Demander une copie (portabilité)</li>
          <li>Supprimer ton compte</li>
        </ul>
        <p>Pour exercer ces droits, contacte <a href="mailto:shamsetdean@gmail.com">shamsetdean@gmail.com</a> depuis ton email de connexion. Réponse sous 30 jours.</p>

        <h2>Conservation</h2>
        <p>Les données sont conservées tant que ton compte est actif. Si tu supprimes ton compte, elles sont effacées dans un délai de 30 jours (sauf obligations légales de conservation).</p>

        <h2>Réclamation</h2>
        <p>Tu peux déposer une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a></p>
      </div>
    </section>
  </template>

  <!-- ============== AUTHENTIFIÉ ============== -->
  <template x-if="$store.app.isAuthed && !['auth','onboarding','legal'].includes($store.app.route.name)">
    <div>
      <main class="relative z-10 pb-24">

        <!-- FEED -->
        <template x-if="$store.app.route.name === 'feed'">
          <section x-data="feedView()" x-init="init()" class="px-4 pt-4 animate-fade-in">
            <header class="safe-top mb-4 flex items-end justify-between">
              <div>
                <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">À l'affiche</p>
                <h1 class="text-3xl display italic text-cream-50 leading-none">Le fil</h1>
              </div>
              <a href="#/top3" class="btn-primary text-sm py-2 px-4">+ Publier</a>
            </header>

            <!-- Filtres : audience + type -->
            <div class="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
              <button @click="setFilter('all')" :class="filter === 'all' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Tout le monde</button>
              <button @click="setFilter('following')" :class="filter === 'following' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Mes abonnements</button>
            </div>
            <div class="flex gap-2 mb-5">
              <button @click="setKindFilter('all')" :class="kindFilter === 'all' ? 'bg-ink-700 text-cream-100' : 'bg-ink-900 text-cream-300/60'" class="text-[11px] font-medium px-3 py-1 rounded-full border border-ink-700">Tous</button>
              <button @click="setKindFilter('top')" :class="kindFilter === 'top' ? 'bg-flame-600 text-cream-50 border-flame-600' : 'bg-ink-900 text-cream-300/60 border-ink-700'" class="text-[11px] font-medium px-3 py-1 rounded-full border">Tops</button>
              <button @click="setKindFilter('flop')" :class="kindFilter === 'flop' ? 'bg-ink-700 text-cream-100 border-ink-600' : 'bg-ink-900 text-cream-300/60 border-ink-700'" class="text-[11px] font-medium px-3 py-1 rounded-full border">Flops</button>
            </div>

            <template x-if="loading">
              <div class="space-y-3">
                <template x-for="i in 3" :key="i"><div class="skeleton h-48"></div></template>
              </div>
            </template>

            <template x-if="!loading && lists.length === 0">
              <div class="text-center py-16 text-cream-300/60">
                <p class="text-sm">Rien pour le moment. Sois le premier à publier.</p>
              </div>
            </template>

            <div class="space-y-4">
              <template x-for="list in lists" :key="list.id">
                <article class="card p-4 animate-slide-up">
                  <header class="flex items-center justify-between gap-2 mb-3">
                    <a :href="'#/u/' + list.username" class="flex items-center gap-2.5 min-w-0">
                      <div class="w-9 h-9 rounded-full bg-ink-700 flex items-center justify-center text-cream-200 font-mono text-xs flex-shrink-0">
                        <span x-text="list.username?.charAt(0).toUpperCase() ?? '?'"></span>
                      </div>
                      <div class="min-w-0">
                        <p class="font-medium text-cream-50 text-sm truncate" x-text="'@' + list.username"></p>
                        <p class="text-[11px] text-cream-300/50" x-text="formatDate(list.created_at)"></p>
                      </div>
                    </a>
                    <span :class="list.kind === 'flop' ? 'bg-ink-700 text-cream-300' : 'bg-flame-600/20 text-flame-400 border border-flame-600/30'" class="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full" x-text="list.kind === 'flop' ? 'Flop 3' : 'Top 3'"></span>
                  </header>

                  <!-- Cartes compactes : poster réduit + titre dessous -->
                  <div class="grid grid-cols-3 gap-2 mb-3">
                    <template x-for="(show, idx) in list.shows" :key="idx">
                      <div>
                        <template x-if="show">
                          <a :href="'#/show/' + show.id" class="block group">
                            <div class="poster-compact relative">
                              <img x-show="show.poster" :src="show.poster" :alt="show.name" loading="lazy" class="group-hover:scale-105 transition-transform duration-500" />
                              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                              <div class="absolute top-1 left-1.5 rank-number" :class="list.kind === 'flop' ? 'rank-number-flop' : (idx === 0 ? 'rank-number-filled' : '')" x-text="idx + 1"></div>
                            </div>
                            <p class="text-[11px] font-medium text-cream-100 line-clamp-2 mt-1.5 leading-tight" x-text="show.name"></p>
                          </a>
                        </template>
                      </div>
                    </template>
                  </div>

                  <template x-if="list.comment">
                    <p class="text-xs text-cream-300 italic mb-2 leading-relaxed" x-text="'« ' + list.comment + ' »'"></p>
                  </template>

                  <footer class="flex items-center gap-3 pt-2 border-t border-ink-700/50">
                    <button @click="toggleLike(list)" class="flex items-center gap-1.5 text-xs transition-colors" :class="list.liked_by_me ? 'text-flame-500' : 'text-cream-300/60'">
                      <svg width="16" height="16" viewBox="0 0 24 24" :fill="list.liked_by_me ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      <span x-text="list.like_count || 0"></span>
                    </button>
                  </footer>
                </article>
              </template>
            </div>
          </section>
        </template>

        <!-- TRENDING -->
        <template x-if="$store.app.route.name === 'trending'">
          <section x-data="trendingView()" x-init="init()" class="px-4 pt-4 safe-top animate-fade-in">
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
                        <p class="text-[11px] text-gold-500" x-text="'★ ' + show.vote?.toFixed(1)"></p>
                      </div>
                    </a>
                  </li>
                </template>
              </ol>
            </div>
          </section>
        </template>

        <!-- TOP 3 / FLOP 3 EDITOR -->
        <template x-if="$store.app.route.name === 'top3'">
          <section x-data="top3View()" x-init="init()" class="px-4 pt-4 safe-top animate-fade-in">
            <header class="mb-4">
              <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">Publier un classement</p>
              <h1 class="text-3xl display italic" x-text="'Mon ' + label"></h1>
            </header>

            <!-- Switch Top / Flop -->
            <div class="flex gap-2 mb-5 p-1 bg-ink-900/50 rounded-full border border-ink-700 w-fit">
              <button @click="switchKind('top')" :class="kind === 'top' ? 'bg-flame-600 text-cream-50' : 'text-cream-300'" class="text-xs font-medium px-4 py-1.5 rounded-full transition-colors">Top 3</button>
              <button @click="switchKind('flop')" :class="kind === 'flop' ? 'bg-ink-700 text-cream-100' : 'text-cream-300'" class="text-xs font-medium px-4 py-1.5 rounded-full transition-colors">Flop 3</button>
            </div>

            <p class="text-xs text-cream-300/70 mb-4" x-text="kind === 'top' ? 'Les 3 séries qui te marquent en ce moment.' : 'Les 3 séries qui t\\'ont déçu.'"></p>

            <div class="grid grid-cols-3 gap-2 mb-5">
              <template x-for="(slot, i) in selection" :key="i">
                <button @click="pickSlot(i)" :class="activeSlot === i ? 'border-flame-500 ring-2 ring-flame-500/30' : 'border-ink-700'" class="aspect-[2/3] card border-2 relative overflow-hidden">
                  <template x-if="!slot">
                    <div class="flex flex-col items-center justify-center h-full text-cream-300/40">
                      <div class="rank-number mb-1" :class="activeSlot === i ? (kind === 'flop' ? 'rank-number-flop' : 'rank-number-filled') : ''" x-text="i + 1"></div>
                      <span class="text-[10px]">choisir</span>
                    </div>
                  </template>
                  <template x-if="slot">
                    <div class="h-full relative">
                      <img :src="slot.poster" :alt="slot.name" class="w-full h-full object-cover" />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                      <div class="absolute top-1 left-1.5 rank-number" :class="kind === 'flop' ? 'rank-number-flop' : 'rank-number-filled'" x-text="i + 1"></div>
                      <span @click.stop="removeSlot(i)" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink-950/80 flex items-center justify-center text-cream-100 text-[10px]">✕</span>
                      <p class="absolute bottom-1 left-1 right-1 text-[10px] font-medium text-cream-50 line-clamp-2 leading-tight text-left" x-text="slot.name"></p>
                    </div>
                  </template>
                </button>
              </template>
            </div>

            <div class="mb-4">
              <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">
                Série pour la position <span class="text-flame-500 font-mono" x-text="activeSlot + 1"></span>
              </label>
              <input type="search" x-model="query" @input="onSearch" class="input" placeholder="Severance, The Bear..." />
            </div>

            <template x-if="searching"><div class="text-xs text-cream-300/50 text-center py-3">Recherche…</div></template>

            <div class="space-y-2 mb-5">
              <template x-for="r in results" :key="r.id">
                <button @click="addToSlot(r)" class="w-full flex gap-2.5 p-2 rounded-xl hover:bg-ink-800 text-left transition-colors">
                  <img x-show="r.poster" :src="r.poster" class="w-10 h-14 rounded-md bg-ink-800 object-cover flex-shrink-0" />
                  <div x-show="!r.poster" class="w-10 h-14 rounded-md bg-ink-800 flex-shrink-0"></div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-cream-100 text-sm truncate" x-text="r.name"></p>
                    <p class="text-[11px] text-cream-300/50" x-text="r.year"></p>
                    <p class="text-[11px] text-cream-300/60 line-clamp-2 mt-0.5" x-text="r.overview"></p>
                  </div>
                </button>
              </template>
            </div>

            <div class="mb-4">
              <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Un mot (optionnel)</label>
              <textarea x-model="comment" maxlength="280" rows="3" class="input resize-none text-sm" placeholder="Ce que j'ai aimé, ce que je recommande..."></textarea>
              <div class="text-[11px] text-cream-300/40 text-right mt-1" x-text="comment.length + '/280'"></div>
            </div>

            <template x-if="error">
              <div class="text-sm text-flame-400 bg-flame-600/10 border border-flame-600/30 rounded-lg px-3 py-2 mb-3" x-text="error"></div>
            </template>

            <button @click="publish" :disabled="!isComplete || saving" class="btn-primary w-full">
              <span x-show="!saving" x-text="'Publier mon ' + label"></span>
              <span x-show="saving">Publication…</span>
            </button>
          </section>
        </template>

        <!-- NOTIFICATIONS -->
        <template x-if="$store.app.route.name === 'notifications'">
          <section x-data="notificationsView()" x-init="init()" class="px-4 pt-4 safe-top animate-fade-in">
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
              <p class="text-center text-cream-300/50 text-sm py-10">Aucune notification pour l'instant.</p>
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

        <!-- PROFIL + BIBLIOTHÈQUE -->
        <template x-if="$store.app.route.name === 'profile' || $store.app.route.name === 'u'">
          <section :key="$store.app.route.params[0] || 'me'" x-data="{ section: 'classements' }" class="px-4 pt-4 safe-top animate-fade-in">
            <div x-data="profileView()" x-init="init()">
              <template x-if="loading"><div class="text-center text-cream-300/50 py-10">Chargement…</div></template>
              <template x-if="error"><div class="text-center text-flame-400 py-10" x-text="error"></div></template>

              <template x-if="profile">
                <div>
                  <header class="mb-5">
                    <div class="flex items-start justify-between mb-3 gap-3">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-14 h-14 rounded-full bg-ink-700 flex items-center justify-center text-2xl display italic text-flame-500 flex-shrink-0">
                          <span x-text="profile.username?.charAt(0).toUpperCase()"></span>
                        </div>
                        <div class="min-w-0">
                          <p class="text-[11px] text-cream-300/50">Membre</p>
                          <h1 class="text-xl display italic truncate" x-text="'@' + profile.username"></h1>
                        </div>
                      </div>
                      <template x-if="isMe">
                        <button @click="$store.app.signOut()" class="btn-ghost text-xs flex-shrink-0">Déconnexion</button>
                      </template>
                      <template x-if="!isMe && $store.app.isAuthed">
                        <button @click="toggleFollow" :class="isFollowing ? 'btn-secondary' : 'btn-primary'" class="text-xs py-2 px-3 flex-shrink-0">
                          <span x-text="isFollowing ? 'Abonné' : 'Suivre'"></span>
                        </button>
                      </template>
                    </div>

                    <template x-if="profile.bio">
                      <p class="text-sm text-cream-300 italic mb-3" x-text="profile.bio"></p>
                    </template>

                    <div class="flex gap-4 text-xs">
                      <span><strong class="text-cream-50" x-text="counts.followers"></strong> <span class="text-cream-300/60">abonnés</span></span>
                      <span><strong class="text-cream-50" x-text="counts.following"></strong> <span class="text-cream-300/60">abonnements</span></span>
                    </div>
                  </header>

                  <div class="flex gap-4 mb-5 border-b border-ink-700">
                    <button @click="section = 'classements'" :class="section === 'classements' ? 'text-cream-50 border-flame-500' : 'text-cream-300/60 border-transparent'" class="pb-2.5 px-1 border-b-2 text-sm font-medium">Classements</button>
                    <button @click="section = 'library'" :class="section === 'library' ? 'text-cream-50 border-flame-500' : 'text-cream-300/60 border-transparent'" class="pb-2.5 px-1 border-b-2 text-sm font-medium">Bibliothèque</button>
                  </div>

                  <!-- SECTION CLASSEMENTS : Top 3 + Flop 3 -->
                  <div x-show="section === 'classements'" class="space-y-6">
                    <div>
                      <h2 class="text-[11px] tracking-[0.25em] text-flame-500 uppercase mb-2.5">Top 3 actuel</h2>
                      <template x-if="!currentTop"><p class="text-xs text-cream-300/50">Aucun Top 3 publié.</p></template>
                      <template x-if="currentTop">
                        <div>
                          <div class="grid grid-cols-3 gap-2 mb-2">
                            <template x-for="(show, idx) in currentTop.shows" :key="idx">
                              <div>
                                <template x-if="show">
                                  <a :href="'#/show/' + show.id" class="block">
                                    <div class="poster-compact">
                                      <img x-show="show.poster" :src="show.poster" />
                                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                      <div class="absolute top-1 left-1.5 rank-number" :class="idx === 0 ? 'rank-number-filled' : ''" x-text="idx + 1"></div>
                                    </div>
                                    <p class="text-[11px] font-medium text-cream-100 line-clamp-2 mt-1 leading-tight" x-text="show.name"></p>
                                  </a>
                                </template>
                              </div>
                            </template>
                          </div>
                          <template x-if="currentTop.comment">
                            <p class="text-xs italic text-cream-300" x-text="'« ' + currentTop.comment + ' »'"></p>
                          </template>
                        </div>
                      </template>
                    </div>

                    <div>
                      <h2 class="text-[11px] tracking-[0.25em] text-cream-300 uppercase mb-2.5">Flop 3 actuel</h2>
                      <template x-if="!currentFlop"><p class="text-xs text-cream-300/50">Aucun Flop 3 publié.</p></template>
                      <template x-if="currentFlop">
                        <div>
                          <div class="grid grid-cols-3 gap-2 mb-2">
                            <template x-for="(show, idx) in currentFlop.shows" :key="idx">
                              <div>
                                <template x-if="show">
                                  <a :href="'#/show/' + show.id" class="block">
                                    <div class="poster-compact">
                                      <img x-show="show.poster" :src="show.poster" />
                                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                      <div class="absolute top-1 left-1.5 rank-number rank-number-flop" x-text="idx + 1"></div>
                                    </div>
                                    <p class="text-[11px] font-medium text-cream-100 line-clamp-2 mt-1 leading-tight" x-text="show.name"></p>
                                  </a>
                                </template>
                              </div>
                            </template>
                          </div>
                          <template x-if="currentFlop.comment">
                            <p class="text-xs italic text-cream-300" x-text="'« ' + currentFlop.comment + ' »'"></p>
                          </template>
                        </div>
                      </template>
                    </div>

                    <template x-if="isMe">
                      <a href="#/top3" class="block text-center btn-secondary text-sm">Mettre à jour mes classements</a>
                    </template>
                  </div>

                  <!-- SECTION BIBLIOTHÈQUE -->
                  <div x-show="section === 'library'" x-data="libraryView()" x-init="init()">
                    <div class="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
                      <button @click="tab = 'watching'" :class="tab === 'watching' ? 'bg-flame-600 text-cream-50' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">En cours (<span x-text="entries.watching?.length || 0"></span>)</button>
                      <button @click="tab = 'want'" :class="tab === 'want' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">À voir (<span x-text="entries.want?.length || 0"></span>)</button>
                      <button @click="tab = 'finished'" :class="tab === 'finished' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Terminées (<span x-text="entries.finished?.length || 0"></span>)</button>
                      <button @click="tab = 'abandoned'" :class="tab === 'abandoned' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">Abandonnées (<span x-text="entries.abandoned?.length || 0"></span>)</button>
                    </div>

                    <template x-if="loading"><div class="text-center text-cream-300/50 py-6 text-sm">Chargement…</div></template>
                    <template x-if="!loading && currentEntries.length === 0">
                      <p class="text-center text-cream-300/50 text-xs py-8">Rien ici.</p>
                    </template>

                    <div x-show="tab === 'watching'" class="space-y-2.5">
                      <template x-for="entry in currentEntries" :key="entry.id">
                        <div class="card p-2.5 flex gap-2.5">
                          <a :href="'#/show/' + entry.show.id" class="flex-shrink-0">
                            <img :src="entry.show.poster" class="w-12 h-18 rounded-md bg-ink-800 object-cover" />
                          </a>
                          <div class="flex-1 min-w-0">
                            <a :href="'#/show/' + entry.show.id" class="block">
                              <p class="font-medium text-cream-50 text-sm leading-tight truncate" x-text="entry.show.name"></p>
                            </a>
                            <p class="text-[11px] text-cream-300/60 mt-0.5" x-text="'S' + (entry.current_season || '?') + ' · E' + (entry.current_episode || '?')"></p>
                            <template x-if="entry.provider_name">
                              <template x-if="providerLink(entry.provider_name, entry.show.name)">
                                <a :href="providerLink(entry.provider_name, entry.show.name)" target="_blank" rel="noopener" class="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-md bg-ink-800 hover:bg-ink-700">
                                  <img x-show="entry.provider_logo_path" :src="providerLogoUrl(entry.provider_logo_path)" class="w-3.5 h-3.5 rounded" />
                                  <span class="text-[10px] text-cream-200" x-text="entry.provider_name"></span>
                                </a>
                              </template>
                            </template>
                            <template x-if="isMe">
                              <button @click="incrementEpisode(entry)" class="ml-2 text-[11px] text-flame-500">+1 épisode</button>
                            </template>
                          </div>
                        </div>
                      </template>
                    </div>

                    <div x-show="tab !== 'watching'" class="grid grid-cols-3 gap-2">
                      <template x-for="entry in currentEntries" :key="entry.id">
                        <a :href="'#/show/' + entry.show.id" class="block">
                          <div class="poster-compact">
                            <img x-show="entry.show.poster" :src="entry.show.poster" />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                          </div>
                          <p class="text-[11px] font-medium text-cream-100 line-clamp-2 mt-1 leading-tight" x-text="entry.show.name"></p>
                        </a>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </section>
        </template>

        <!-- SHOW DETAIL -->
        <template x-if="$store.app.route.name === 'show'">
          <section :key="$store.app.route.params[0]" x-data="showView()" x-init="init()" class="animate-fade-in">
            <template x-if="loading"><div class="p-8 text-center text-cream-300/50">Chargement…</div></template>
            <template x-if="error"><div class="p-8 text-flame-400 text-center" x-text="error"></div></template>

            <template x-if="show">
              <div>
                <div class="relative h-64 overflow-hidden">
                  <img x-show="show.backdrop_path" :src="'https://image.tmdb.org/t/p/w780' + show.backdrop_path" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/60"></div>
                  <a href="javascript:history.back()" class="absolute top-4 left-4 safe-top w-9 h-9 rounded-full bg-ink-950/70 backdrop-blur flex items-center justify-center text-cream-50">←</a>
                </div>

                <div class="px-4 -mt-16 relative z-10">
                  <div class="flex gap-3 mb-4">
                    <img x-show="show.poster_path" :src="'https://image.tmdb.org/t/p/w342' + show.poster_path" class="w-28 rounded-lg shadow-2xl shadow-black/50 bg-ink-800" />
                    <div class="flex-1 pt-12 min-w-0">
                      <p class="text-[11px] text-cream-300/60" x-text="(show.first_air_date?.slice(0,4) || '') + ' · ' + (show.number_of_seasons || '?') + ' saisons'"></p>
                      <h1 class="text-2xl display italic leading-tight mt-1" x-text="show.name"></h1>
                      <span class="text-gold-500 text-xs mt-1 inline-block" x-text="'★ ' + show.vote_average?.toFixed(1)"></span>
                    </div>
                  </div>

                  <!-- WATCHLIST -->
                  <div x-data="watchlistOnShow()" x-init="init()" class="mb-5 card p-3">
                    <template x-if="loading"><div class="text-xs text-cream-300/40">Chargement…</div></template>
                    <template x-if="!loading">
                      <div>
                        <div class="flex items-center justify-between gap-2 mb-2.5">
                          <div>
                            <p class="text-[10px] uppercase tracking-wider text-cream-300/60 mb-0.5">Ma bibliothèque</p>
                            <p class="text-sm font-medium" x-text="statusLabel"></p>
                          </div>
                          <template x-if="entry">
                            <button @click="remove" class="text-[11px] text-cream-300/50 hover:text-flame-400">Retirer</button>
                          </template>
                        </div>

                        <template x-if="!entry && !showEditor">
                          <div class="grid grid-cols-2 gap-1.5">
                            <button @click="quickAdd('want')" class="text-xs py-1.5 px-2.5 rounded-md bg-ink-800 hover:bg-ink-700">À voir</button>
                            <button @click="quickAdd('watching')" class="text-xs py-1.5 px-2.5 rounded-md bg-flame-600 hover:bg-flame-700 text-cream-50 font-medium">En cours</button>
                            <button @click="quickAdd('finished')" class="text-xs py-1.5 px-2.5 rounded-md bg-ink-800 hover:bg-ink-700">Terminée</button>
                            <button @click="quickAdd('abandoned')" class="text-xs py-1.5 px-2.5 rounded-md bg-ink-800 hover:bg-ink-700">Abandonnée</button>
                          </div>
                        </template>

                        <template x-if="entry && entry.status !== 'watching' && !showEditor">
                          <div class="flex flex-wrap gap-1.5">
                            <template x-if="entry.status !== 'want'"><button @click="quickAdd('want')" class="text-[11px] py-1 px-2.5 rounded-full bg-ink-800">→ À voir</button></template>
                            <template x-if="entry.status !== 'watching'"><button @click="quickAdd('watching')" class="text-[11px] py-1 px-2.5 rounded-full bg-ink-800">→ En cours</button></template>
                            <template x-if="entry.status !== 'finished'"><button @click="quickAdd('finished')" class="text-[11px] py-1 px-2.5 rounded-full bg-ink-800">→ Terminée</button></template>
                            <template x-if="entry.status !== 'abandoned'"><button @click="quickAdd('abandoned')" class="text-[11px] py-1 px-2.5 rounded-full bg-ink-800">→ Abandonnée</button></template>
                          </div>
                        </template>

                        <template x-if="entry && entry.status === 'watching' && !showEditor">
                          <div class="flex items-center gap-2.5 flex-wrap">
                            <span class="text-cream-50 font-mono text-xs" x-text="'S' + entry.current_season + ' · E' + entry.current_episode"></span>
                            <template x-if="entry.provider_name">
                              <div class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ink-800">
                                <img x-show="entry.provider_logo_path" :src="'https://image.tmdb.org/t/p/w92' + entry.provider_logo_path" class="w-3.5 h-3.5 rounded" />
                                <span class="text-[10px] text-cream-200" x-text="entry.provider_name"></span>
                              </div>
                            </template>
                            <button @click="showEditor = true" class="text-[11px] text-flame-500">Modifier</button>
                          </div>
                        </template>

                        <template x-if="showEditor">
                          <div class="space-y-2.5 mt-2">
                            <div class="grid grid-cols-2 gap-2">
                              <div>
                                <label class="text-[10px] text-cream-300/60 block mb-1">Saison</label>
                                <input type="number" x-model.number="form.current_season" min="1" max="30" class="input py-1.5 text-sm" />
                              </div>
                              <div>
                                <label class="text-[10px] text-cream-300/60 block mb-1">Épisode</label>
                                <input type="number" x-model.number="form.current_episode" min="1" max="99" class="input py-1.5 text-sm" />
                              </div>
                            </div>
                            <div>
                              <label class="text-[10px] text-cream-300/60 block mb-1.5">Plateforme</label>
                              <div class="flex flex-wrap gap-1.5">
                                <template x-for="p in providers" :key="p.id">
                                  <button @click="selectProvider(p)" :class="form.provider_id === p.id ? 'border-flame-500' : 'border-ink-700'" class="flex items-center gap-1 px-2 py-1 rounded-md border bg-ink-800 text-[11px]">
                                    <img :src="'https://image.tmdb.org/t/p/w92' + p.logo_path" class="w-4 h-4 rounded" />
                                    <span x-text="p.name"></span>
                                  </button>
                                </template>
                                <button @click="selectProvider(null)" :class="form.provider_id === null && form.provider_name !== '' ? 'border-flame-500' : 'border-ink-700'" class="px-2 py-1 rounded-md border bg-ink-800 text-[11px]">Autre</button>
                              </div>
                              <template x-if="form.provider_id === null">
                                <input x-model="form.provider_name" placeholder="Nom de la plateforme" class="input py-1.5 mt-1.5 text-sm" />
                              </template>
                            </div>
                            <div class="flex gap-2 pt-1">
                              <button @click="saveDetailed" class="btn-primary text-xs py-1.5 px-3 flex-1">Enregistrer</button>
                              <button @click="showEditor = false" class="btn-ghost text-xs py-1.5 px-3">Annuler</button>
                            </div>
                          </div>
                        </template>
                      </div>
                    </template>
                  </div>

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

      <!-- FOOTER minimal -->
      <footer class="relative z-10 text-center pb-20 pt-4">
        <p class="text-[10px] text-cream-300/30">
          <a href="#/legal/beta" class="hover:text-cream-300/60">Phase de test</a> ·
          <a href="#/legal/mentions" class="hover:text-cream-300/60">Mentions</a> ·
          <a href="#/legal/privacy" class="hover:text-cream-300/60">Confidentialité</a>
        </p>
      </footer>

      <!-- BOTTOM NAV -->
      <nav class="fixed bottom-0 left-0 right-0 z-30 nav-glass nav-bottom">
        <div class="flex items-center justify-around max-w-md mx-auto px-2 pt-2">
          <a href="#/feed" :class="$store.app.route.name === 'feed' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Fil</span>
          </a>
          <a href="#/trending" :class="$store.app.route.name === 'trending' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Tendance</span>
          </a>
          <a href="#/top3" class="flex flex-col items-center gap-0.5 p-2 flex-1">
            <div class="w-11 h-11 rounded-full bg-flame-600 flex items-center justify-center text-cream-50 -mt-4 shadow-lg shadow-flame-600/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </div>
          </a>
          <a href="#/notifications" class="relative flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors" :class="$store.app.route.name === 'notifications' ? 'text-flame-500' : 'text-cream-300/50'">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Activité</span>
            <span x-show="$store.app.unreadCount > 0" class="notif-dot"></span>
          </a>
          <a href="#/profile" :class="$store.app.route.name === 'profile' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Profil</span>
          </a>
        </div>
      </nav>
    </div>
  </template>

  <template x-if="!$store.app.isAuthed && !['auth','onboarding','legal'].includes($store.app.route.name)">
    <div x-init="window.location.hash = '#/auth'"></div>
  </template>

  <template x-if="$store.app.toast">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 safe-top">
      <div class="card-strong px-4 py-2.5 text-sm animate-slide-up" :class="$store.app.toast.type === 'success' ? 'border-flame-500/50 text-flame-400' : ''" x-text="$store.app.toast.message"></div>
    </div>
  </template>

</div>
`
