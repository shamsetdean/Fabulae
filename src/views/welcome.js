import { supabase } from '../lib/supabase.js'

export const welcomeModal = () => ({
  step: 1,
  saving: false,
  consent_analytics: false,
  consent_notifications: false,
  consent_personalization: false,

  next() { if (this.step < 3) this.step++ },
  prev() { if (this.step > 1) this.step-- },

  async finish() {
    if (this.saving) return
    this.saving = true
    const store = window.Alpine.store('app')
    const me = store.session?.user?.id
    if (!me) { this.saving = false; return }

    const updates = {
      welcome_seen: true,
      consent_analytics: this.consent_analytics,
      consent_notifications: this.consent_notifications,
      consent_personalization: this.consent_personalization
    }

    try {
      const { error } = await supabase
        .from('profiles').update(updates).eq('id', me)
      if (error) throw error
      if (store.profile) Object.assign(store.profile, updates)
    } catch (e) {
      console.warn('[Welcome] save error', e)
    } finally {
      this.saving = false
    }
  }
})
