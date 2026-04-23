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

// Injection du template AVANT Alpine.start() : Alpine parse tout normalement
document.getElementById('app').innerHTML = appTemplate

// Factories Alpine accessibles dans les directives x-data
window.authView = authView
window.onboardingView = onboardingView
window.feedView = feedView
window.top3View = top3View
window.trendingView = trendingView
window.profileView = profileView
window.showView = showView

// Helpers
window.formatDate = formatDate

// Store global
initStore(Alpine)

window.Alpine = Alpine
Alpine.start()

// Initialise le store APRÈS Alpine.start pour que le reactive system soit prêt
Alpine.store('app').init()
