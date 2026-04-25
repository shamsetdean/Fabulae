import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'My TVShow',
        short_name: 'My TVShow',
        description: 'Ton Top 3 des séries du moment.',
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
        globPatterns: ['**/*.{js,css,html,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/t\/p\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
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
        // Code splitting : sépare les dépendances volumineuses du code applicatif
        // pour qu'elles soient cachées en navigation et rechargements
        manualChunks: {
          'vendor-alpine': ['alpinejs'],
          'vendor-supabase': ['@supabase/supabase-js']
        }
      }
    },

    // Tailwind + Alpine + Supabase = ~150KB gzippé. Avertir si on dépasse trop
    chunkSizeWarningLimit: 200
  },

  server: {
    port: 5173,
    host: true
  },

  // Optimise la pré-bundling Vite en dev
  optimizeDeps: {
    include: ['alpinejs', '@supabase/supabase-js']
  }
})
