// Template HTML complet avec fallback de chargement et gestion robuste
export const appTemplate = `
<!-- Loading state : affiché tant que authReady est false -->
<div x-show="!$store.app.authReady" class="min-h-dvh flex items-center justify-center">
  <div class="text-cream-300/40 text-sm font-mono">chargement...</div>
</div>

<!-- Main app : affiché dès que authReady est true -->
<div x-show="$store.app.authReady">

  <!-- ============== AUTH ============== -->
  <template x-if="$store.app.route.name === 'auth'">
    <section x-data="authView()" class="min-h-dvh flex flex-col justify-center px-6 py-10 relative z-10">
      <div class="max-w-sm mx-auto w-full animate-slide-up">
        <div class="mb-10 text-center">
          <div class="inline-flex items-center gap-2 text-flame-500 text-xs tracking-[0.3em] uppercase mb-4">
            <span class="w-8 h-px bg-flame-500"></span>
            Saison 1
            <span class="w-8 h-px bg-flame-500"></span>
          </div>
          <h1 class="text-display-xl display text-cream-50 italic">My TVShow</h1>
          <p class="mt-3 text-cream-200/70 text-sm">Ton Top 3 des séries du moment.<br>Partagé. Classé. Débattu.</p>
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
              <input type="password" x-model="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" required minlength="6" class="input" placeholder="••••••••" />
            </div>

            <template x-if="error">
              <div class="text-sm text-flame-400 bg-flame-600/10 border border-flame-600/30 rounded-lg px-3 py-2" x-text="error"></div>
            </template>

            <button type="submit" :disabled="loading" class="btn-primary w-full">
              <span x-show="!loading" x-text="mode === 'signup' ? 'Créer mon compte' : 'Entrer'"></span>
              <span x-show="loading">…</span>
            </button>
          </form>
        </div>

        <p class="text-xs text-center text-cream-300/40 mt-6">En continuant, tu acceptes les conditions d'utilisation.</p>
      </div>
    </section>
  </template>

  <!-- ============== ONBOARDING ============== -->
  <template x-if="$store.app.route.name === 'onboarding'">
    <section x-data="onboardingView()" class="min-h-dvh flex flex-col justify-center px-6 py-10 relative z-10">
      <div class="max-w-sm mx-auto w-full animate-slide-up">
        <h1 class="text-display-lg display italic mb-2">Choisis ton pseudo.</h1>
        <p class="text-cream-200/70 text-sm mb-8">C'est ce que les autres verront sur tes Top 3.</p>

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

  <!-- ============== AUTHENTIFIÉ : LAYOUT ============== -->
  <template x-if="$store.app.isAuthed && !['auth','onboarding'].includes($store.app.route.name)">
    <div>
      <main class="relative z-10 pb-24">

        <!-- FEED -->
        <template x-if="$store.app.route.name === 'feed'">
          <section x-data="feedView()" x-init="init()" class="px-4 pt-4 animate-fade-in">
            <header class="safe-top mb-4 flex items-end justify-between">
              <div>
                <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">À l'affiche</p>
                <h1 class="text-display-md display italic text-cream-50 leading-none">Le fil</h1>
              </div>
              <a href="#/top3" class="btn-primary text-sm py-2 px-4">+ Top 3</a>
            </header>

            <div class="flex gap-2 mb-5">
              <button @click="setFilter('all')" :class="filter === 'all' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-sm font-medium px-4 py-1.5 rounded-full transition-colors">Tout le monde</button>
              <button @click="setFilter('following')" :class="filter === 'following' ? 'bg-cream-100 text-ink-950' : 'bg-ink-800 text-cream-200'" class="text-sm font-medium px-4 py-1.5 rounded-full transition-colors">Mes abonnements</button>
            </div>

            <template x-if="loading">
              <div class="space-y-4">
                <template x-for="i in 3" :key="i">
                  <div class="card p-5 h-64 animate-pulse bg-ink-800/40"></div>
                </template>
              </div>
            </template>

            <template x-if="!loading && lists.length === 0">
              <div class="text-center py-16 text-cream-300/60">
                <p class="text-5xl mb-3 display italic text-cream-200/40">¯\\_(ツ)_/¯</p>
                <p class="text-sm">Rien ici pour l'instant. Publie le premier Top 3 !</p>
              </div>
            </template>

            <div class="space-y-5">
              <template x-for="list in lists" :key="list.id">
                <article class="card p-4 animate-slide-up">
                  <header class="flex items-center gap-3 mb-4">
                    <a :href="'#/u/' + list.username" class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-ink-700 flex items-center justify-center text-cream-200 font-mono text-sm">
                        <span x-text="list.username?.charAt(0).toUpperCase() ?? '?'"></span>
                      </div>
                      <div>
                        <p class="font-medium text-cream-50 text-sm" x-text="'@' + list.username"></p>
                        <p class="text-xs text-cream-300/50" x-text="formatDate(list.created_at)"></p>
                      </div>
                    </a>
                  </header>

                  <div class="grid grid-cols-3 gap-2 mb-4">
                    <template x-for="(show, idx) in list.shows" :key="idx">
                      <div class="relative">
                        <template x-if="show">
                          <a :href="'#/show/' + show.id" class="block group">
                            <div class="aspect-[2/3] rounded-xl overflow-hidden bg-ink-800 relative">
                              <img x-show="show.poster" :src="show.poster" :alt="show.name" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                              <div class="absolute top-1 left-1.5 rank-number" :class="idx === 0 ? 'rank-number-filled' : ''" x-text="idx + 1"></div>
                              <div class="absolute bottom-2 left-2 right-2">
                                <p class="text-[11px] font-semibold text-cream-50 line-clamp-2 leading-tight" x-text="show.name"></p>
                              </div>
                            </div>
                          </a>
                        </template>
                      </div>
                    </template>
                  </div>

                  <template x-if="list.comment">
                    <p class="text-sm text-cream-200/80 italic mb-3 leading-relaxed" x-text="'« ' + list.comment + ' »'"></p>
                  </template>

                  <footer class="flex items-center gap-4 pt-3 border-t border-ink-700/50">
                    <button @click="toggleLike(list)" class="flex items-center gap-1.5 text-sm transition-colors" :class="list.liked_by_me ? 'text-flame-500' : 'text-cream-300/60 hover:text-cream-100'">
                      <svg width="18" height="18" viewBox="0 0 24 24" :fill="list.liked_by_me ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
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
              <h1 class="text-display-md display italic">Les tendances</h1>
            </header>

            <div class="flex gap-4 mb-6 border-b border-ink-700">
              <button @click="tab = 'community'" :class="tab === 'community' ? 'text-cream-50 border-flame-500' : 'text-cream-300/60 border-transparent'" class="pb-3 px-1 border-b-2 text-sm font-medium transition-colors">Chez les membres</button>
              <button @click="tab = 'tmdb'" :class="tab === 'tmdb' ? 'text-cream-50 border-flame-500' : 'text-cream-300/60 border-transparent'" class="pb-3 px-1 border-b-2 text-sm font-medium transition-colors">Mondial (semaine)</button>
            </div>

            <template x-if="loading">
              <div class="space-y-3">
                <template x-for="i in 5" :key="i">
                  <div class="card h-20 animate-pulse bg-ink-800/40"></div>
                </template>
              </div>
            </template>

            <div x-show="!loading && tab === 'community'">
              <template x-if="communityRanking.length === 0">
                <p class="text-center text-cream-300/50 text-sm py-10">Pas encore assez de Top 3 publiés pour faire un classement. Sois le premier !</p>
              </template>
              <ol class="space-y-3">
                <template x-for="(show, idx) in communityRanking" :key="show.id">
                  <li>
                    <a :href="'#/show/' + show.id" class="card p-3 flex items-center gap-3 hover:border-flame-500/50 transition-colors">
                      <div class="w-10 text-right">
                        <span class="rank-number" :class="idx < 3 ? 'rank-number-filled' : ''" x-text="idx + 1"></span>
                      </div>
                      <img :src="show.poster" :alt="show.name" class="w-12 h-18 rounded-lg bg-ink-800 object-cover flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-cream-50 text-sm leading-tight" x-text="show.name"></p>
                        <p class="text-xs text-cream-300/50 mt-0.5" x-text="show.year"></p>
                        <p class="text-xs text-flame-500 mt-1" x-text="show.mentions + ' mention(s)'"></p>
                      </div>
                    </a>
                  </li>
                </template>
              </ol>
            </div>

            <div x-show="!loading && tab === 'tmdb'">
              <ol class="space-y-3">
                <template x-for="(show, idx) in tmdbTrending" :key="show.id">
                  <li>
                    <a :href="'#/show/' + show.id" class="card p-3 flex items-center gap-3 hover:border-flame-500/50 transition-colors">
                      <div class="w-10 text-right">
                        <span class="rank-number" :class="idx < 3 ? 'rank-number-filled' : ''" x-text="idx + 1"></span>
                      </div>
                      <img :src="show.poster" :alt="show.name" class="w-12 h-18 rounded-lg bg-ink-800 object-cover flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-cream-50 text-sm leading-tight" x-text="show.name"></p>
                        <p class="text-xs text-cream-300/50 mt-0.5" x-text="show.year"></p>
                        <p class="text-xs text-gold-500 mt-1" x-text="'★ ' + show.vote?.toFixed(1)"></p>
                      </div>
                    </a>
                  </li>
                </template>
              </ol>
            </div>
          </section>
        </template>

        <!-- TOP 3 EDITOR -->
        <template x-if="$store.app.route.name === 'top3'">
          <section x-data="top3View()" class="px-4 pt-4 safe-top animate-fade-in">
            <header class="mb-5">
              <p class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-1">Nouveau classement</p>
              <h1 class="text-display-md display italic">Mon Top 3</h1>
              <p class="text-sm text-cream-300/60 mt-1">Les 3 séries qui te marquent en ce moment.</p>
            </header>

            <div class="grid grid-cols-3 gap-2 mb-6">
              <template x-for="(slot, i) in selection" :key="i">
                <button @click="pickSlot(i)" :class="activeSlot === i ? 'border-flame-500 ring-2 ring-flame-500/30' : 'border-ink-700'" class="aspect-[2/3] card border-2 relative overflow-hidden transition-all">
                  <template x-if="!slot">
                    <div class="flex flex-col items-center justify-center h-full text-cream-300/40">
                      <div class="rank-number mb-1" :class="activeSlot === i ? 'rank-number-filled' : ''" x-text="i + 1"></div>
                      <span class="text-xs">choisir</span>
                    </div>
                  </template>
                  <template x-if="slot">
                    <div class="h-full relative">
                      <img :src="slot.poster" :alt="slot.name" class="w-full h-full object-cover" />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                      <div class="absolute top-1 left-1.5 rank-number rank-number-filled" x-text="i + 1"></div>
                      <span @click.stop="removeSlot(i)" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-950/80 flex items-center justify-center text-cream-100 text-xs">✕</span>
                      <p class="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-semibold text-cream-50 line-clamp-2 leading-tight text-left" x-text="slot.name"></p>
                    </div>
                  </template>
                </button>
              </template>
            </div>

            <div class="mb-5">
              <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">
                Rechercher pour la position <span class="text-flame-500 font-mono" x-text="activeSlot + 1"></span>
              </label>
              <input type="search" x-model="query" @input="onSearch" class="input" placeholder="Ex: Severance, The Bear..." />
            </div>

            <template x-if="searching">
              <div class="text-sm text-cream-300/50 text-center py-4">Recherche…</div>
            </template>

            <div class="space-y-2 mb-6">
              <template x-for="r in results" :key="r.id">
                <button @click="addToSlot(r)" class="w-full flex gap-3 p-2 rounded-xl hover:bg-ink-800 transition-colors text-left">
                  <img x-show="r.poster" :src="r.poster" class="w-12 h-18 rounded-lg bg-ink-800 object-cover flex-shrink-0" />
                  <div x-show="!r.poster" class="w-12 h-18 rounded-lg bg-ink-800 flex-shrink-0"></div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-cream-100 text-sm" x-text="r.name"></p>
                    <p class="text-xs text-cream-300/50" x-text="r.year"></p>
                    <p class="text-xs text-cream-300/60 line-clamp-2 mt-1" x-text="r.overview"></p>
                  </div>
                </button>
              </template>
            </div>

            <div class="mb-4">
              <label class="text-xs text-cream-300/70 uppercase tracking-wider mb-1.5 block">Un mot sur ton choix (optionnel)</label>
              <textarea x-model="comment" maxlength="280" rows="3" class="input resize-none" placeholder="Ce que j'ai aimé, ce que je recommande..."></textarea>
              <div class="text-xs text-cream-300/40 text-right mt-1" x-text="comment.length + '/280'"></div>
            </div>

            <template x-if="error">
              <div class="text-sm text-flame-400 bg-flame-600/10 border border-flame-600/30 rounded-lg px-3 py-2 mb-3" x-text="error"></div>
            </template>

            <button @click="publish" :disabled="!isComplete || saving" class="btn-primary w-full">
              <span x-show="!saving">Publier mon Top 3</span>
              <span x-show="saving">Publication…</span>
            </button>
          </section>
        </template>

        <!-- PROFILE (moi ou @username) -->
        <template x-if="$store.app.route.name === 'profile' || $store.app.route.name === 'u'">
          <section :key="$store.app.route.params[0] || 'me'" x-data="profileView()" x-init="init()" class="px-4 pt-4 safe-top animate-fade-in">
            <template x-if="loading">
              <div class="text-center text-cream-300/50 py-10">Chargement…</div>
            </template>

            <template x-if="error">
              <div class="text-center text-flame-400 py-10" x-text="error"></div>
            </template>

            <template x-if="profile">
              <div>
                <header class="mb-6">
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="w-16 h-16 rounded-full bg-ink-700 flex items-center justify-center text-2xl display italic text-flame-500">
                        <span x-text="profile.username?.charAt(0).toUpperCase()"></span>
                      </div>
                      <div>
                        <p class="text-xs text-cream-300/50">Membre</p>
                        <h1 class="text-2xl display italic" x-text="'@' + profile.username"></h1>
                      </div>
                    </div>
                    <template x-if="isMe">
                      <button @click="$store.app.signOut()" class="btn-ghost text-xs">Déconnexion</button>
                    </template>
                    <template x-if="!isMe && $store.app.isAuthed">
                      <button @click="toggleFollow" :class="isFollowing ? 'btn-secondary' : 'btn-primary'" class="text-sm py-2 px-4">
                        <span x-text="isFollowing ? 'Abonné' : 'Suivre'"></span>
                      </button>
                    </template>
                  </div>

                  <template x-if="profile.bio">
                    <p class="text-sm text-cream-200/80 italic mb-3" x-text="profile.bio"></p>
                  </template>

                  <div class="flex gap-5 text-sm">
                    <span><strong class="text-cream-50 font-semibold" x-text="counts.followers"></strong> <span class="text-cream-300/60">abonnés</span></span>
                    <span><strong class="text-cream-50 font-semibold" x-text="counts.following"></strong> <span class="text-cream-300/60">abonnements</span></span>
                  </div>
                </header>

                <div class="mb-8">
                  <h2 class="text-xs tracking-[0.25em] text-flame-500 uppercase mb-3">Top 3 actuel</h2>
                  <template x-if="!currentTop">
                    <p class="text-sm text-cream-300/50">Aucun Top 3 publié.</p>
                  </template>
                  <template x-if="currentTop">
                    <div>
                      <div class="grid grid-cols-3 gap-2 mb-3">
                        <template x-for="(show, idx) in currentTop.shows" :key="idx">
                          <div>
                            <template x-if="show">
                              <a :href="'#/show/' + show.id" class="block">
                                <div class="aspect-[2/3] rounded-xl overflow-hidden bg-ink-800 relative">
                                  <img x-show="show.poster" :src="show.poster" class="w-full h-full object-cover" />
                                  <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                                  <div class="absolute top-1 left-1.5 rank-number" :class="idx === 0 ? 'rank-number-filled' : ''" x-text="idx + 1"></div>
                                  <p class="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-semibold text-cream-50 line-clamp-2 leading-tight" x-text="show.name"></p>
                                </div>
                              </a>
                            </template>
                          </div>
                        </template>
                      </div>
                      <template x-if="currentTop.comment">
                        <p class="text-sm italic text-cream-200/80" x-text="'« ' + currentTop.comment + ' »'"></p>
                      </template>
                    </div>
                  </template>

                  <template x-if="isMe">
                    <a href="#/top3" class="block mt-4 text-center btn-secondary text-sm">
                      <span x-text="currentTop ? 'Mettre à jour mon Top 3' : 'Créer mon Top 3'"></span>
                    </a>
                  </template>
                </div>
              </div>
            </template>
          </section>
        </template>

        <!-- SHOW DETAIL -->
        <template x-if="$store.app.route.name === 'show'">
          <section :key="$store.app.route.params[0]" x-data="showView()" x-init="init()" class="animate-fade-in">
            <template x-if="loading">
              <div class="p-8 text-center text-cream-300/50">Chargement…</div>
            </template>

            <template x-if="error">
              <div class="p-8 text-flame-400 text-center" x-text="error"></div>
            </template>

            <template x-if="show">
              <div>
                <div class="relative h-72 overflow-hidden">
                  <img x-show="show.backdrop_path" :src="'https://image.tmdb.org/t/p/w780' + show.backdrop_path" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/60"></div>
                  <a href="javascript:history.back()" class="absolute top-4 left-4 safe-top w-10 h-10 rounded-full bg-ink-950/70 backdrop-blur flex items-center justify-center text-cream-50">←</a>
                </div>

                <div class="px-4 -mt-20 relative z-10">
                  <div class="flex gap-4 mb-5">
                    <img x-show="show.poster_path" :src="'https://image.tmdb.org/t/p/w342' + show.poster_path" class="w-32 rounded-xl shadow-2xl shadow-black/50 bg-ink-800" />
                    <div class="flex-1 pt-14">
                      <p class="text-xs text-cream-300/60" x-text="(show.first_air_date?.slice(0,4) || '') + ' · ' + (show.number_of_seasons || '?') + ' saisons'"></p>
                      <h1 class="text-3xl display italic leading-tight mt-1" x-text="show.name"></h1>
                      <div class="flex items-center gap-3 mt-2">
                        <span class="text-gold-500 text-sm" x-text="'★ ' + show.vote_average?.toFixed(1)"></span>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-1.5 mb-5">
                    <template x-for="g in show.genres || []" :key="g.id">
                      <span class="chip" x-text="g.name"></span>
                    </template>
                  </div>

                  <template x-if="show.overview">
                    <div class="mb-6">
                      <h2 class="text-xs tracking-wider uppercase text-cream-300/60 mb-2">Synopsis</h2>
                      <p class="text-sm text-cream-200/90 leading-relaxed" x-text="show.overview"></p>
                    </div>
                  </template>

                  <div class="mb-6">
                    <h2 class="text-xs tracking-wider uppercase text-cream-300/60 mb-3">Où regarder en France</h2>

                    <template x-if="!providers || allProviders.length === 0">
                      <p class="text-sm text-cream-300/50">Aucune plateforme française listée.</p>
                    </template>

                    <template x-if="providers && allProviders.length > 0">
                      <div class="space-y-3">
                        <template x-if="providers.flatrate?.length">
                          <div>
                            <p class="text-[11px] text-flame-500 uppercase tracking-wider mb-2">Abonnement</p>
                            <div class="flex flex-wrap gap-2">
                              <template x-for="p in providers.flatrate" :key="p.provider_id">
                                <div class="card px-3 py-2 flex items-center gap-2">
                                  <img :src="'https://image.tmdb.org/t/p/w92' + p.logo_path" class="w-7 h-7 rounded-md" />
                                  <span class="text-sm" x-text="p.provider_name"></span>
                                </div>
                              </template>
                            </div>
                          </div>
                        </template>
                        <template x-if="freeOrAds.length > 0">
                          <div>
                            <p class="text-[11px] text-gold-500 uppercase tracking-wider mb-2">Gratuit</p>
                            <div class="flex flex-wrap gap-2">
                              <template x-for="p in freeOrAds" :key="p.provider_id">
                                <div class="card px-3 py-2 flex items-center gap-2">
                                  <img :src="'https://image.tmdb.org/t/p/w92' + p.logo_path" class="w-7 h-7 rounded-md" />
                                  <span class="text-sm" x-text="p.provider_name"></span>
                                </div>
                              </template>
                            </div>
                          </div>
                        </template>
                        <template x-if="rentOrBuy.length > 0">
                          <div>
                            <p class="text-[11px] text-cream-300/60 uppercase tracking-wider mb-2">À la demande</p>
                            <div class="flex flex-wrap gap-2">
                              <template x-for="p in rentOrBuy" :key="p.provider_id">
                                <div class="card px-3 py-2 flex items-center gap-2 opacity-80">
                                  <img :src="'https://image.tmdb.org/t/p/w92' + p.logo_path" class="w-7 h-7 rounded-md" />
                                  <span class="text-sm" x-text="p.provider_name"></span>
                                </div>
                              </template>
                            </div>
                          </div>
                        </template>

                        <p class="text-[10px] text-cream-300/40 pt-2">Données JustWatch via TMDB.</p>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </section>
        </template>

      </main>

      <!-- BOTTOM NAV -->
      <nav class="fixed bottom-0 left-0 right-0 z-30 bg-ink-950/95 backdrop-blur-xl border-t border-ink-800 nav-bottom">
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
          <a href="#/profile" :class="$store.app.route.name === 'profile' ? 'text-flame-500' : 'text-cream-300/50'" class="flex flex-col items-center gap-0.5 p-2 flex-1 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            <span class="text-[10px] uppercase tracking-wider font-medium">Profil</span>
          </a>
        </div>
      </nav>
    </div>
  </template>

  <!-- Guard : non auth et pas sur page publique -> redirect -->
  <template x-if="!$store.app.isAuthed && !['auth','onboarding'].includes($store.app.route.name)">
    <div x-init="window.location.hash = '#/auth'"></div>
  </template>

  <!-- TOAST GLOBAL -->
  <template x-if="$store.app.toast">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 safe-top">
      <div class="card px-4 py-2.5 text-sm animate-slide-up" :class="$store.app.toast.type === 'success' ? 'border-flame-500/50 text-flame-400' : ''" x-text="$store.app.toast.message"></div>
    </div>
  </template>

</div>
`
