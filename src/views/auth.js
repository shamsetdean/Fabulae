import { supabase } from '../lib/supabase.js'

export const authView = () => ({
  mode: 'signin',
  email: '',
  password: '',
  loading: false,
  error: null,

  async submit() {
    this.error = null
    if (!this.email || this.password.length < 6) {
      this.error = 'Email requis, mot de passe 6 caractères minimum.'
      return
    }
    this.loading = true
    try {
      if (this.mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: this.email,
          password: this.password
        })
        if (error) throw error
        window.location.hash = '#/onboarding'
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: this.email,
          password: this.password
        })
        if (error) throw error
        window.location.hash = '#/feed'
      }
    } catch (e) {
      this.error = e.message || 'Erreur inconnue'
    } finally {
      this.loading = false
    }
  }
})
