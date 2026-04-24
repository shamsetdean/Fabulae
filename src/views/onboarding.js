import { supabase } from '../lib/supabase.js'

export const onboardingView = () => ({
  username: '',
  bio: '',
  loading: false,
  error: null,

  async submit() {
    this.error = null
    const u = this.username.trim().toLowerCase()

    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      this.error = 'Pseudo : 3-20 caractères, lettres minuscules, chiffres et _ uniquement.'
      return
    }

    this.loading = true

    try {
      // 1. Récupérer l'utilisateur depuis le store (déjà chargé) en priorité
      const store = window.Alpine.store('app')
      let userId = store.session?.user?.id

      // 2. Fallback : si pas de session en store, re-fetch depuis Supabase
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession()
        userId = sessionData.session?.user?.id
      }

      // 3. Si toujours rien, la session est vraiment perdue
      if (!userId) {
        this.error = 'Session expirée. Redirection en cours...'
        setTimeout(() => { window.location.hash = '#/auth' }, 1500)
        return
      }

      // 4. Vérifier si un profil existe déjà (cas reload/double-clic)
      const { data: existing } = await supabase
        .from('profiles').select('*')
        .eq('id', userId)
        .maybeSingle()

      if (existing) {
        // Le profil existe déjà, on ne recrée pas
        await store.loadProfile()
        window.location.hash = '#/feed'
        return
      }

      // 5. Vérifier que le pseudo n'est pas déjà pris
      const { data: taken } = await supabase
        .from('profiles').select('id')
        .eq('username', u)
        .maybeSingle()

      if (taken) {
        this.error = 'Ce pseudo est déjà pris.'
        return
      }

      // 6. Créer le profil
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, username: u, bio: this.bio.trim() || null })

      if (insertError) {
        if (insertError.code === '23505') {
          this.error = 'Ce pseudo est déjà pris.'
        } else if (insertError.code === '23503') {
          this.error = 'Compte invalide. Déconnecte-toi et reconnecte-toi.'
        } else {
          this.error = 'Erreur : ' + insertError.message
        }
        return
      }

      // 7. Recharger le profil dans le store puis rediriger
      await store.loadProfile()
      window.location.hash = '#/feed'
    } catch (e) {
      console.error('[Onboarding] submit exception', e)
      this.error = 'Erreur inattendue : ' + (e.message || 'unknown')
    } finally {
      this.loading = false
    }
  }
})
