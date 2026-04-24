import Alpine from 'alpinejs'
import './style.css'

import { initStore } from './lib/store.js'
import { appTemplate } from './components/template.js'

import { authView } from './views/auth.js'
import { onboardingView } from './views/onboarding.js'
import { feedView, formatDate } from './views/feed.js'
import { top3View } from './views/top3.js'
import { trendingView } from './views/trending.js'
import { profileView } from './views/profile.js'
import { showView } from './views/show.js'
import { watchlistOnShow, libraryView } from './views/watchlist.js'

function showFatalError(title, message, details) {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; padding: 2rem; color: #F2E9E4; font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF6B35; font-size: 1.5rem; margin-bottom: 1rem;">${title}</h1>
      <p style="margin-bottom: 1rem; line-height: 1.6;">${message}</p>
      ${details ? `<pre style="background: #1C1A17; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; white-space: pre-wrap; word-break: break-word;">${details}</pre>` : ''}
    </div>
  `
}

window.addEventListener('error', e => console.error('[Global error]', e.error || e.message))
window.addEventListener('unhandledrejection', e => console.error('[Unhandled rejection]', e.reason))

const env = import.meta.env
const missing = []
if (!env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
if (!env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')
if (!env.VITE_TMDB_TOKEN) missing.push('VITE_TMDB_TOKEN')

if (missing.length > 0) {
  showFatalError(
    'Configuration manquante',
    'Les variables d\'environnement suivantes ne sont pas définies :',
    missing.map(v => '• ' + v).join('\n') + '\n\nAjoute-les dans Vercel → Settings → Environment Variables, puis redéploie.'
  )
  throw new Error('Missing env vars: ' + missing.join(', '))
}

// Expose factories Alpine
window.authView = authView
window.onboardingView = onboardingView
window.feedView = feedView
window.top3View = top3View
window.trendingView = trendingView
window.profileView = profileView
window.showView = showView
window.watchlistOnShow = watchlistOnShow
window.libraryView = libraryView
window.formatDate = formatDate

try {
  document.getElementById('app').innerHTML = appTemplate
} catch (e) {
  showFatalError('Erreur injection template', e.message, e.stack)
  throw e
}

try {
  initStore(Alpine)
} catch (e) {
  showFatalError('Erreur init store', e.message, e.stack)
  throw e
}

window.Alpine = Alpine
try {
  Alpine.start()
} catch (e) {
  showFatalError('Erreur Alpine.start', e.message, e.stack)
  throw e
}

Alpine.store('app').init().catch(err => {
  console.error('[App] init async failed:', err)
  showFatalError(
    'Erreur de démarrage',
    'L\'application n\'a pas pu s\'initialiser correctement.',
    err.message + '\n\n' + (err.stack || '')
  )
})
