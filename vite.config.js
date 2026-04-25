import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Fabulae',
        short_name: 'Fabulae',
        description: 'Fabulae — L\'art de ne jamais perdre le fil. Ton Top 3 des séries du moment.',
        theme_color: '#0A0908',
        background_color: '#0A0908',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigationPreload: true,
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,html,png,svg,webp,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate' || request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'assets',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://image.tmdb.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://api.themoviedb.org',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tmdb-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('supabase.co'),
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],

  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-alpine': ['alpinejs'],
          'vendor-supabase': ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 200
  },

  server: {
    port: 5173,
    host: true
  },

  optimizeDeps: {
    include: ['alpinejs', '@supabase/supabase-js']
  }
})
