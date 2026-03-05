import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'ZoneMap',
        short_name: 'ZoneMap',
        description: 'Beautiful time zone visualization and conversion tool',
        theme_color: '#040609',
        background_color: '#040609',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshot.png',
            sizes: '3002x1782',
            type: 'image/png',
            form_factor: 'wide',
            label: 'ZoneMap — World timezone visualizer',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}', 'world-110m.json'],
        runtimeCaching: [
          {
            // Cache world atlas topojson (large file, rarely changes)
            urlPattern: /\/world-110m\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'world-atlas',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
          {
            // Cache geonames city search data
            urlPattern: /\/geonames-cities\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geonames-cities',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-geo': ['d3-geo', 'topojson-client'],
          'vendor-date': ['date-fns', 'date-fns-tz'],
        },
      },
    },
  },
})
