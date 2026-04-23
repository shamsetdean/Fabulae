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
      this.error = 'Username : 3-20 caractères, lettres minuscules, chiffres et _ uniquement.'
      return
    }
    this.loading = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      this.error = 'Session perdue, reconnecte-toi.'
      this.loading = false
      return
    }

    const { error } = await supabase
      .from('profiles')
      .insert({ id: user.id, username: u, bio: this.bio.trim() || null })

    if (error) {
      this.error = error.code === '23505' ? 'Ce pseudo est déjà pris.' : error.message
      this.loading = false
      return
    }

    await window.Alpine.store('app').loadProfile()
    window.location.hash = '#/feed'
  }
})
