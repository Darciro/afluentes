import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const ONE_YEAR = 60 * 60 * 24 * 365

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Atualiza o service worker sozinho quando houver build novo
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Afluentes — Guardião da Amazônia',
        short_name: 'Afluentes',
        description: 'Responda o quiz e veja se está preparado para ser um Guardião da Amazônia.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        background_color: '#1A1410',
        theme_color: '#1A1410',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // App shell (JS, CSS, HTML e imagens do bundle) fica disponível offline
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: ONE_YEAR },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fotos das perguntas em /public/quiz-assets
            urlPattern: ({ url, request }) => url.pathname.startsWith('/quiz-assets/') && request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'quiz-images',
              expiration: { maxEntries: 100, maxAgeSeconds: ONE_YEAR },
            },
          },
          {
            // Vídeo da abertura: o navegador pede por partes (Range), então o cache precisa responder assim
            urlPattern: ({ url }) => url.pathname.endsWith('.mp4'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'quiz-video',
              rangeRequests: true,
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 3 },
            },
          },
        ],
      },
    }),
  ],
})
