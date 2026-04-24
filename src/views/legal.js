// Vue des pages légales — tout en dur, pas de chargement externe
export const legalView = () => ({
  tab: 'beta', // 'beta' | 'mentions' | 'privacy'

  init() {
    // Permet un deep-link : #/legal/privacy
    const param = window.Alpine.store('app').route.params[0]
    if (['beta', 'mentions', 'privacy'].includes(param)) this.tab = param
  }
})
