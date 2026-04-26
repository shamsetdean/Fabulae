import Alpine from 'alpinejs'
import './style.css'

import { initStore } from './lib/store.js'
import { appTemplate } from './components/template.js'

import { authView } from './views/auth.js'
import { onboardingView } from './views/onboarding.js'
import { feedView, formatDate } from './views/feed.js'
import { top3View } from './views/top3.js'
import { trendingView } from './views/trending.js'
import { discoverView } from './views/discover.js'
import { profileView } from './views/profile.js'
import { showView } from './views/show.js'
import { libraryView } from './views/library.js'
import { classifierModal } from './views/classifier.js'
import { notificationsView } from './views/notifications.js'
import { legalView } from './views/legal.js'
import { welcomeModal } from './views/welcome.js'

function showFatalError(title, message, details) {
  document.getElementById('app').innerHTML = `
    <div style="min-height: 100vh; padding: 2rem; color: #F2E9E4; font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #FF6B35; font-size: 1.5rem; margin-bottom: 1rem;">${title}</h1>
      <p style="margin-bottom: 1rem; line-height: 1.6;">${message}</p>
      ${details ? `<pre style="background: #1C1A17; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; white-space: pre-wrap; word-break: break-word;">${details}</pre>` : ''}
    </div>
  `
}

let _reloaded = false
function reloadOnce(reason) {
  if (_reloaded) return
  if (sessionStorage.getItem('__fabulae_reloaded') === '1') return
  _reloaded = true
  sessionStorage.setItem('__fabulae_reloaded', '1')
  console.warn('[Bootstrap] reloading due to:', reason)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister().catch(() => {}))
      if ('caches' in window) {
        caches.keys().then(keys => {
          Promise.all(keys.map(k => caches.delete(k))).finally(() => location.reload())
        })
      } else {
        location.reload()
      }
    }).catch(() => location.reload())
  } else {
    location.reload()
  }
}

window.addEventListener('error', e => {
  const msg = (e?.error?.message || e?.message || '').toLowerCase()
  if (msg.includes('failed to fetch dynamically imported module') ||
      msg.includes("can't find variable") ||
      msg.includes('importing a module script failed') ||
      msg.includes('failed to load module')) {
    reloadOnce('module-load-error')
    return
  }
  console.error('[Global error]', e.error || e.message)
})

window.addEventListener('unhandledrejection', e => {
  const reason = e?.reason
  const msg = (reason?.message || String(reason || '')).toLowerCase()
  if (msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes('failed to load module')) {
    reloadOnce('module-import-rejection')
    return
  }
  console.error('[Unhandled rejection]', reason)
})

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (sessionStorage.getItem('__fabulae_sw_seen') !== '1') {
      sessionStorage.setItem('__fabulae_sw_seen', '1')
    } else {
      sessionStorage.removeItem('__fabulae_reloaded')
      location.reload()
    }
  })
}

const env = import.meta.env
const missing = []
if (!env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
if (!env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')
if (!env.VITE_TMDB_TOKEN) missing.push('VITE_TMDB_TOKEN')

if (missing.length > 0) {
  showFatalError('Configuration manquante',
    'Les variables d\'environnement suivantes ne sont pas définies :',
    missing.map(v => '• ' + v).join('\n'))
  throw new Error('Missing env vars: ' + missing.join(', '))
}

window.authView = authView
window.onboardingView = onboardingView
window.feedView = feedView
window.top3View = top3View
window.trendingView = trendingView
window.discoverView = discoverView
window.profileView = profileView
window.showView = showView
window.libraryView = libraryView
window.classifierModal = classifierModal
window.notificationsView = notificationsView
window.legalView = legalView
window.welcomeModal = welcomeModal
window.formatDate = formatDate

function bootstrap() {
  const appEl = document.getElementById('app')
  if (!appEl) {
    setTimeout(bootstrap, 16)
    return
  }

  try { initStore(Alpine) }
  catch (e) { showFatalError('Erreur init store', e.message, e.stack); throw e }

  window.Alpine = Alpine

  try { Alpine.start() }
  catch (e) { showFatalError('Erreur Alpine.start', e.message, e.stack); throw e }

  try { appEl.innerHTML = appTemplate }
  catch (e) { showFatalError('Erreur injection template', e.message, e.stack); throw e }

  try {
    if (typeof Alpine.initTree === 'function') {
      Alpine.initTree(appEl)
    }
  } catch (e) {
    console.warn('[Bootstrap] initTree warning', e)
  }

  Alpine.store('app').init().catch(err => {
    console.error('[App] init async failed:', err)
    showFatalError('Erreur de démarrage',
      'L\'application n\'a pas pu s\'initialiser correctement.',
      err.message + '\n\n' + (err.stack || ''))
  })

  setTimeout(() => sessionStorage.removeItem('__fabulae_reloaded'), 5000)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true })
} else {
  bootstrap()
}
